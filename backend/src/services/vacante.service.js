const db = require("../config/database");
const {
    obtenerVacantesSQLServer
} = require("../repositories/vacantes.repository");

async function guardarVacantesExternas(vacantes) {
    if (vacantes.length === 0) {
        return;
    }

    const cliente = await db.connect();

    try {
        await cliente.query("BEGIN");

        for (const vacante of vacantes) {
            await cliente.query(
                `
                INSERT INTO vacantes_externas (
                    cve_vacante_sqlserver,
                    folio_oferta,
                    empresa,
                    puesto,
                    descripcion,
                    area,
                    subarea,
                    nivel_estudios,
                    experiencia,
                    entidad,
                    municipio,
                    numero_plazas,
                    salario,
                    fecha_publicacion,
                    vigencia,
                    estado,
                    fecha_sincronizacion
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9,
                    $10, $11, $12, $13, $14, $15, $16,
                    CURRENT_TIMESTAMP
                )
                ON CONFLICT (cve_vacante_sqlserver)
                DO UPDATE SET
                    folio_oferta = COALESCE(
                EXCLUDED.folio_oferta,
                   vacantes_externas.folio_oferta
                     ),
                    empresa = EXCLUDED.empresa,
                    puesto = EXCLUDED.puesto,
                    descripcion = EXCLUDED.descripcion,
                    area = EXCLUDED.area,
                    subarea = EXCLUDED.subarea,
                    nivel_estudios = EXCLUDED.nivel_estudios,
                    experiencia = EXCLUDED.experiencia,
                    entidad = EXCLUDED.entidad,
                    municipio = EXCLUDED.municipio,
                    numero_plazas = EXCLUDED.numero_plazas,
                    salario = EXCLUDED.salario,
                    fecha_publicacion = EXCLUDED.fecha_publicacion,
                    vigencia = EXCLUDED.vigencia,
                    estado = EXCLUDED.estado,
                    fecha_sincronizacion = CURRENT_TIMESTAMP
                `,
                [
                    vacante.id,
                    vacante.folio_oferta,
                    vacante.empresa,
                    vacante.puesto,
                    vacante.descripcion,
                    vacante.area,
                    vacante.subarea,
                    vacante.nivel_estudios,
                    vacante.experiencia,
                    vacante.entidad,
                    vacante.municipio,
                    vacante.numero_plazas,
                    vacante.salario,
                    vacante.fecha_publicacion,
                    vacante.vigencia,
                    vacante.estado
                ]
            );
        }

        await cliente.query("COMMIT");
    } catch (error) {
        await cliente.query("ROLLBACK");
        throw error;
    } finally {
        cliente.release();
    }
}

function prepararVacanteExterna(vacante) {
    return {
        ...vacante,
        id: Number(vacante.id),
        folio_empresa: null,
        estado: Number(vacante.estado) === 1 ? "Activa" : "Inactiva",
        origen_vacante: "sqlserver",
        clave_seleccion: `sqlserver_${vacante.id}`
    };
}

async function obtenerVacantes() {
    const resultado = await db.query(`
        SELECT
            id,
            folio_oferta,
            folio_empresa,
            empresa,
            puesto,
            area,
            subarea,
            nivel_estudios,
            experiencia,
            entidad,
            municipio,
            numero_plazas,
            salario,
            fecha_publicacion,
            estado
        FROM vacantes
        ORDER BY fecha_publicacion DESC
    `);

    return resultado.rows.map(vacante => ({
        ...vacante,
        origen_vacante: "postgresql",
        clave_seleccion: `postgresql_${vacante.id}`
    }));
}

async function obtenerVacantePorId(id, origen = "postgresql") {
    if (origen === "sqlserver") {
        const resultado = await db.query(
            `
            SELECT
                cve_vacante_sqlserver AS id,
                folio_oferta,
                NULL AS folio_empresa,
                empresa,
                puesto,
                descripcion,
                area,
                subarea,
                nivel_estudios,
                experiencia,
                entidad,
                municipio,
                numero_plazas,
                salario,
                fecha_publicacion,
                vigencia,
                estado
            FROM vacantes_externas
            WHERE cve_vacante_sqlserver = $1
            AND estado = 1
            AND vigencia >= CURRENT_DATE
            LIMIT 1
            `,
            [id]
        );

        if (!resultado.rows[0]) {
            return null;
        }

        return {
            ...resultado.rows[0],
            origen_vacante: "sqlserver",
            clave_seleccion: `sqlserver_${id}`
        };
    }

    const resultado = await db.query(
        `
        SELECT
            id,
            folio_oferta,
            folio_empresa,
            empresa,
            puesto,
            area,
            subarea,
            nivel_estudios,
            experiencia,
            entidad,
            municipio,
            numero_plazas,
            salario,
            fecha_publicacion,
            estado
        FROM vacantes
        WHERE id = $1
        LIMIT 1
        `,
        [id]
    );

    if (!resultado.rows[0]) {
        return null;
    }

    return {
        ...resultado.rows[0],
        origen_vacante: "postgresql",
        clave_seleccion: `postgresql_${id}`
    };
}

async function actualizarEstadoVacante(id, estado) {
    const estadosValidos = ["Activa", "Inactiva", "Cerrada"];

    if (!estadosValidos.includes(estado)) {
        throw new Error("Estado de vacante no válido");
    }

    const resultado = await db.query(
        `
        UPDATE vacantes
        SET estado = $1
        WHERE id = $2
        RETURNING *
        `,
        [estado, id]
    );

    if (resultado.rows.length === 0) {
        return null;
    }

    return resultado.rows[0];
}


async function buscarVacantes(escolaridad) {
    try {
        const vacantesSQLServer = await obtenerVacantesSQLServer(
            100,
            escolaridad
        );

        // Intentar actualizar la caché sin perder los resultados
        // si SQL Server respondió, pero falló el guardado.
        try {
            await guardarVacantesExternas(vacantesSQLServer);
        } catch (errorCache) {
            console.warn(
                "No se pudo actualizar la caché de PostgreSQL:",
                errorCache.message
            );
        }

        return vacantesSQLServer.map(prepararVacanteExterna);

    } catch (errorSQLServer) {
        console.warn(
            "SQL Server no está disponible. Se consultará la caché de PostgreSQL:",
            errorSQLServer.message
        );

        const equivalenciasEscolaridad = {
            "primaria": "Primaria",
            "secundaria": "Secundaria",
            "preparatoria o vocacional": "Preparatoria / Bachillerato",
            "licenciatura": "Licenciatura / Profesional"
        };

        let escolaridadCache = null;

        if (escolaridad) {
            const clave = escolaridad.trim().toLocaleLowerCase("es-MX");

            escolaridadCache = equivalenciasEscolaridad[clave];

            if (!escolaridadCache) {
                throw new Error(`Escolaridad no reconocida: ${escolaridad}`);
            }
        }

        const resultado = await db.query(
            `
            SELECT
                cve_vacante_sqlserver AS id,
                folio_oferta,
                empresa,
                puesto,
                descripcion,
                area,
                subarea,
                nivel_estudios,
                experiencia,
                entidad,
                municipio,
                numero_plazas,
                salario,
                fecha_publicacion,
                vigencia,
                estado
            FROM vacantes_externas
            WHERE estado = 1
             AND vigencia >= CURRENT_DATE
             AND (
             $1::varchar IS NULL
             OR LOWER(BTRIM(nivel_estudios)) = LOWER($1)
       )
            ORDER BY fecha_publicacion DESC NULLS LAST,
                     cve_vacante_sqlserver DESC
            LIMIT 20
            `,
            [escolaridadCache]
        );

        return resultado.rows.map(prepararVacanteExterna);
    }
}


module.exports = {
    obtenerVacantes,
    obtenerVacantePorId,
    actualizarEstadoVacante,
    buscarVacantes
};
