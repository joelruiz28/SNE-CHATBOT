const db = require("../config/database");
const sqlserver = require("../config/sqlserver");
const sql = require("mssql");

const {
    registrarSolicitanteSQLServer,
    obtenerOCrearExpedienteActivoSQLServer
} = require("../repositories/solicitantes.repository");


async function crearPostulacion(
    buscadorId,
    vacanteId,
    origen = "postgresql"
) {
    const idBuscador = Number(buscadorId);
    const idVacante = Number(vacanteId);

    if (
        !Number.isSafeInteger(idBuscador) ||
        idBuscador <= 0 ||
        !Number.isSafeInteger(idVacante) ||
        idVacante <= 0
    ) {
        throw new Error(
            "El buscador y la vacante deben tener identificadores enteros positivos."
        );
    }

    if (!["postgresql", "sqlserver"].includes(origen)) {
        throw new Error("Origen de vacante no válido.");
    }

    // ========================================================
    // VACANTES DE SQL SERVER
    // ========================================================

    if (origen === "sqlserver") {

        // 1. Evitar ejecutar nuevamente el procedimiento
        // si ya existe la postulación en PostgreSQL.

        const postulacionExistente =
            await obtenerPostulacionPorBuscadorYVacante(
                idBuscador,
                idVacante,
                "sqlserver"
            );

        if (postulacionExistente) {
            console.log(
                "ℹ️ La postulación ya existe en PostgreSQL."
            );

            return null;
        }

        // 2. Obtener los datos del buscador en PostgreSQL.

        const resultadoBuscador = await db.query(
            `
            SELECT
                nombre_completo,
                curp,
                fecha_nacimiento,
                sexo,
                telefono,
                correo,
                codigo_postal,
                folio
            FROM buscadores_empleo
            WHERE id = $1
            LIMIT 1
            `,
            [idBuscador]
        );

        const buscador = resultadoBuscador.rows[0];

        if (!buscador) {
            throw new Error(
                "No se encontró el perfil del buscador de empleo."
            );
        }

        if (!buscador.curp) {
            throw new Error(
                "No se encontró la CURP del buscador de empleo."
            );
        }

        // 3. Buscar o registrar al solicitante oficial.

        const solicitante =
            await registrarSolicitanteSQLServer(buscador);

        if (!solicitante || !solicitante.id) {
            throw new Error(
                "No fue posible localizar o registrar al solicitante en SQL Server."
            );
        }

        console.log(
            "✅ Solicitante oficial disponible:",
            solicitante.id
        );

        // 4. Buscar o crear su expediente activo.

        const expediente =
            await obtenerOCrearExpedienteActivoSQLServer(
                solicitante.id
            );

        if (!expediente || !expediente.id) {
            throw new Error(
                "No fue posible obtener o crear el expediente del solicitante."
            );
        }

        console.log(
            "✅ Expediente activo disponible:",
            expediente.id
        );

        // 5. Esperar la conexión existente.

        await sqlserver.poolConectado;

        const resultadoSQL = await sqlserver
            .request()
            .input(
                "CveSolicitante",
                sql.Int,
                Number(solicitante.id)
            )
            .input(
                "CveVacante",
                sql.Int,
                idVacante
            )
            .input(
                "CveUser",
                sql.Int,
                1
            )
            .input(
                "NombreUsuario",
                sql.NVarChar(100),
                "CHATBOT SNE"
            )
            .output(
                "CveEnvio",
                sql.Int
            )
            .output(
                "MensajeError",
                sql.NVarChar(sql.MAX)
            )
            .execute("dbo.sp_GenerarPostulacion");

        const cveEnvio = Number(
            resultadoSQL.output.CveEnvio || 0
        );

        const mensajeError = String(
            resultadoSQL.output.MensajeError || ""
        ).trim();

        console.log("📨 Resultado del procedimiento SQL Server:");
        console.log("CveEnvio:", cveEnvio);
        console.log("Mensaje:", mensajeError);

        // DUPLICADO significa que ya existe un envío oficial.
        // Podemos continuar registrando su referencia en PostgreSQL.

        if (
            mensajeError &&
            mensajeError !== "DUPLICADO"
        ) {
            throw new Error(mensajeError);
        }

        if (cveEnvio <= 0) {
            throw new Error(
                "SQL Server no devolvió un identificador de envío válido."
            );
        }

        // 6. Registrar la postulación en PostgreSQL.

        const resultadoPostgres = await db.query(
            `
            INSERT INTO postulaciones (
                buscador_id,
                vacante_id,
                origen_vacante,
                cve_vacante_sqlserver
            )
            VALUES ($1, NULL, 'sqlserver', $2)
            ON CONFLICT DO NOTHING
            RETURNING *
            `,
            [idBuscador, idVacante]
        );

        let postulacion = resultadoPostgres.rows[0] || null;

        // Si hubo una inserción concurrente, recuperar el registro.

        if (!postulacion) {
            postulacion =
                await obtenerPostulacionPorBuscadorYVacante(
                    idBuscador,
                    idVacante,
                    "sqlserver"
                );
        }

        if (!postulacion) {
            throw new Error(
                "El envío se realizó en SQL Server, pero no fue posible recuperar el registro de PostgreSQL. Reintenta para reconciliarlo."
            );
        }

        console.log(
            "✅ Postulación registrada en ambas bases de datos."
        );

        return {
            ...postulacion,
            cve_envio_sqlserver: cveEnvio
        };
    }

    // ========================================================
    // VACANTES DE POSTGRESQL
    // CONSERVAR COMPORTAMIENTO ACTUAL
    // ========================================================

    const resultado = await db.query(
        `
        INSERT INTO postulaciones (
            buscador_id,
            vacante_id,
            origen_vacante,
            cve_vacante_sqlserver
        )
        VALUES ($1, $2, 'postgresql', NULL)
        ON CONFLICT DO NOTHING
        RETURNING *
        `,
        [idBuscador, idVacante]
    );

    return resultado.rows[0] || null;
}


async function obtenerPostulacionesPorBuscador(buscadorId) {
    const resultado = await db.query(
        `
        SELECT
            p.id,
            p.fecha_postulacion,
            p.estado,
            p.origen_vacante,

            COALESCE(
                v.id,
                ve.cve_vacante_sqlserver
            ) AS vacante_id,

            COALESCE(v.folio_oferta, ve.folio_oferta)
                AS folio_oferta,

            COALESCE(v.puesto, ve.puesto)
                AS puesto,

            COALESCE(v.empresa, ve.empresa)
                AS empresa,

            COALESCE(v.municipio, ve.municipio)
                AS municipio,

            COALESCE(v.entidad, ve.entidad)
                AS entidad,

            COALESCE(v.salario, ve.salario)
                AS salario

        FROM postulaciones p

        LEFT JOIN vacantes v
            ON p.origen_vacante = 'postgresql'
           AND v.id = p.vacante_id

        LEFT JOIN vacantes_externas ve
            ON p.origen_vacante = 'sqlserver'
           AND ve.cve_vacante_sqlserver = p.cve_vacante_sqlserver

        WHERE p.buscador_id = $1

        ORDER BY p.fecha_postulacion DESC
        `,
        [buscadorId]
    );

    return resultado.rows;
}


async function obtenerDatosComprobante(postulacionId) {
    const resultado = await db.query(
        `
        SELECT
            p.id AS postulacion_id,
            p.fecha_postulacion,
            p.estado,
            p.origen_vacante,

            b.id AS buscador_id,
            b.nombre_completo,
            b.curp,
            b.telefono,
            b.correo,
            b.municipio AS municipio_candidato,
            b.colonia,
            b.nivel_estudios,
            b.carrera,
            b.folio AS folio_buscador,

            COALESCE(
                v.id,
                ve.cve_vacante_sqlserver
            ) AS vacante_id,

            COALESCE(v.folio_oferta, ve.folio_oferta)
                AS folio_oferta,

            COALESCE(v.puesto, ve.puesto)
                AS puesto,

            COALESCE(v.empresa, ve.empresa)
                AS empresa,

            COALESCE(v.municipio, ve.municipio)
                AS municipio_vacante,

            COALESCE(v.entidad, ve.entidad)
                AS entidad,

            COALESCE(v.salario, ve.salario)
                AS salario,

            COALESCE(v.nivel_estudios, ve.nivel_estudios)
                AS nivel_estudios_vacante,

            COALESCE(v.experiencia, ve.experiencia)
                AS experiencia

        FROM postulaciones p

        INNER JOIN buscadores_empleo b
            ON b.id = p.buscador_id

        LEFT JOIN vacantes v
            ON p.origen_vacante = 'postgresql'
           AND v.id = p.vacante_id

        LEFT JOIN vacantes_externas ve
            ON p.origen_vacante = 'sqlserver'
           AND ve.cve_vacante_sqlserver = p.cve_vacante_sqlserver

        WHERE p.id = $1
          AND (
              (p.origen_vacante = 'postgresql' AND v.id IS NOT NULL)
              OR
              (p.origen_vacante = 'sqlserver'
               AND ve.cve_vacante_sqlserver IS NOT NULL)
          )

        LIMIT 1
        `,
        [postulacionId]
    );

    return resultado.rows[0] || null;
}


async function obtenerPostulacionPorBuscadorYVacante(
    buscadorId,
    vacanteId,
    origen = "postgresql"
) {
    if (origen === "sqlserver") {
        const resultado = await db.query(
            `
            SELECT *
            FROM postulaciones
            WHERE buscador_id = $1
              AND origen_vacante = 'sqlserver'
              AND cve_vacante_sqlserver = $2
            LIMIT 1
            `,
            [buscadorId, vacanteId]
        );

        return resultado.rows[0] || null;
    }

    if (origen !== "postgresql") {
        throw new Error("Origen de vacante no válido.");
    }

    const resultado = await db.query(
        `
        SELECT *
        FROM postulaciones
        WHERE buscador_id = $1
          AND origen_vacante = 'postgresql'
          AND vacante_id = $2
        LIMIT 1
        `,
        [buscadorId, vacanteId]
    );

    return resultado.rows[0] || null;
}


module.exports = {
    crearPostulacion,
    obtenerPostulacionesPorBuscador,
    obtenerPostulacionPorBuscadorYVacante,
    obtenerDatosComprobante
};
