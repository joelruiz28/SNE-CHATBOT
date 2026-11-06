const db = require("../config/database");

const {
    buscarSolicitanteSQLServerPorCURP
} = require("../repositories/solicitantes.repository");


async function crearBuscador(telefono) {

    const existe = await db.query(
        `
        SELECT *
        FROM buscadores_empleo
        WHERE telefono = $1
        `,
        [telefono]
    );

    if (existe.rows.length > 0) {
        return existe.rows[0];
    }

    const resultado = await db.query(
        `
        INSERT INTO buscadores_empleo
        (
            telefono,
            fecha_registro
        )
        VALUES
        (
            $1,
            CURRENT_TIMESTAMP
        )
        RETURNING *
        `,
        [telefono]
    );

    return resultado.rows[0];
}



async function actualizarDato(
    telefono,
    campo,
    valor
) {

    const camposPermitidos = [
        "correo",
        "codigo_postal"
    ];

    if (
        !camposPermitidos.includes(campo)
    ) {

        throw new Error(
            `Campo no permitido para actualización: ${campo}`
        );
    }

    const consulta = `
        UPDATE buscadores_empleo
        SET ${campo} = $1
        WHERE telefono = $2
    `;

    await db.query(
        consulta,
        [valor, telefono]
    );
}



async function buscarPorCURP(curp) {

    const resultado = await db.query(
        `
        SELECT *
        FROM buscadores_empleo
        WHERE curp = $1
        LIMIT 1
        `,
        [curp]
    );

    return resultado.rows[0] || null;
}

/**
 * Busca un solicitante primero en PostgreSQL y,
 * si no existe, consulta la base oficial de SQL Server.
 *
 * Esta función únicamente consulta datos.
 */
async function buscarSolicitantePorCURPEnAmbasBases(curp) {
    const curpNormalizada = String(curp || "")
        .trim()
        .toUpperCase();

    if (!curpNormalizada) {
        return {
            origen: null,
            solicitante: null
        };
    }

    // 1. Consultar primero PostgreSQL.
    const buscadorPostgres = await buscarPorCURP(curpNormalizada);

    if (buscadorPostgres) {
        return {
            origen: "postgresql",
            solicitante: buscadorPostgres
        };
    }

    // 2. Si no existe en PostgreSQL, consultar SQL Server.
    const solicitanteSQLServer =
        await buscarSolicitanteSQLServerPorCURP(curpNormalizada);

    if (solicitanteSQLServer) {
        return {
            origen: "sqlserver",
            solicitante: solicitanteSQLServer
        };
    }

    // 3. No existe en ninguna de las dos bases.
    return {
        origen: null,
        solicitante: null
    };
}



async function generarFolio(telefono) {

    const resultado = await db.query(
        `
        SELECT id
        FROM buscadores_empleo
        WHERE telefono = $1
        `,
        [telefono]
    );

    if (resultado.rows.length === 0) {
        return null;
    }

    const id = resultado.rows[0].id;

    const anio =
        new Date().getFullYear();

    const consecutivo =
        String(id).padStart(6, "0");

    const folio =
        `SNE-${anio}-${consecutivo}`;

    await db.query(
        `
        UPDATE buscadores_empleo
        SET folio = $1
        WHERE telefono = $2
        `,
        [folio, telefono]
    );

    return folio;
}


async function completarPerfil(telefono) {

    await db.query(
        `
        UPDATE buscadores_empleo
        SET perfil_completo = (
            NULLIF(TRIM(nombre_completo), '') IS NOT NULL
            AND NULLIF(TRIM(curp), '') IS NOT NULL
            AND fecha_nacimiento IS NOT NULL
            AND NULLIF(TRIM(sexo), '') IS NOT NULL
            AND NULLIF(TRIM(telefono), '') IS NOT NULL
            AND NULLIF(TRIM(correo), '') IS NOT NULL
            AND NULLIF(TRIM(codigo_postal), '') IS NOT NULL
        )
        WHERE telefono = $1
        `,
        [telefono]
    );
}


async function verificarPerfilCompleto(telefono) {

    const resultado = await db.query(
        `
        SELECT
            nombre_completo,
            curp,
            fecha_nacimiento,
            sexo,
            telefono,
            correo,
            codigo_postal
        FROM buscadores_empleo
        WHERE telefono = $1
        LIMIT 1
        `,
        [telefono]
    );

    if (resultado.rows.length === 0) {
        return false;
    }

    const usuario = resultado.rows[0];

    return (
        usuario.nombre_completo?.trim() &&
        usuario.curp?.trim() &&
        usuario.fecha_nacimiento &&
        usuario.sexo?.trim() &&
        usuario.telefono?.trim() &&
        usuario.correo?.trim() &&
        usuario.codigo_postal?.trim()
    ) ? true : false;
}


async function obtenerBuscadorPorTelefono(telefono) {

    try {

        const resultado = await db.query(
            `
            SELECT *
            FROM buscadores_empleo
            WHERE telefono = $1
            LIMIT 1
            `,
            [telefono]
        );

        if (resultado.rows.length === 0) {

            console.log(
                "⚠️ No se encontró usuario con teléfono:",
                telefono
            );

            return null;
        }

        return resultado.rows[0];

    } catch (error) {

        console.error(
            "❌ Error en obtenerBuscadorPorTelefono():",
            error
        );

        throw error;
    }
}



async function obtenerBuscadorPorId(id) {

    const resultado = await db.query(
        `
        SELECT *
        FROM buscadores_empleo
        WHERE id = $1
        LIMIT 1
        `,
        [id]
    );

    return resultado.rows[0] || null;
}



async function obtenerUsuarioPorFolio(folio) {

    const resultado = await db.query(
        `
        SELECT
            nombre_completo,
            curp,
            fecha_nacimiento,
            sexo,
            telefono,
            correo,
            codigo_postal,
            municipio,
            colonia,
            nivel_estudios,
            carrera,
            experiencia,
            puesto_solicitado,
            disponibilidad,
            licencia_conducir,
            vehiculo_propio,
            disponibilidad_viajar,
            sueldo_deseado,
            horario,
            recibir_vacantes,
            folio,
            perfil_completo,
            fecha_registro
        FROM buscadores_empleo
        WHERE UPPER(folio) = UPPER($1)
        LIMIT 1
        `,
        [folio.trim()]
    );

    return resultado.rows[0] || null;
}



async function buscarVacantesPorPuesto(telefono) {

    try {

        const usuario =
            await obtenerBuscadorPorTelefono(
                telefono
            );

        if (!usuario) {

            return `
⚠️ No encontramos tu registro. Primero debes registrar tus datos.
`;
        }

        return buscarVacantesPorUsuario(
            usuario
        );

    } catch (error) {

        console.error(
            "❌ Error en buscarVacantesPorPuesto():",
            error
        );

        return `
❌ Ocurrió un error al buscar las vacantes.

Por favor intenta nuevamente más tarde.
`;
    }
}



async function buscarVacantesPorPuestoPorId(id) {

    try {

        console.log(
            "🔐 Buscando vacantes mediante usuario autorizado."
        );

        console.log(
            "🆔 ID del usuario:",
            id
        );

        const usuario =
            await obtenerBuscadorPorId(id);

        if (!usuario) {

            console.log(
                "⚠️ No se encontró usuario con ID:",
                id
            );

            return `
⚠️ No encontramos tu registro.
`;
        }

        return buscarVacantesPorUsuario(
            usuario
        );

    } catch (error) {

        console.error(
            "❌ Error en buscarVacantesPorPuestoPorId():",
            error
        );

        return `
❌ Ocurrió un error al buscar las vacantes.

Por favor intenta nuevamente más tarde.
`;
    }
}



async function buscarVacantesPorUsuario(usuario) {

    const puestoSolicitado =
        usuario.puesto_solicitado?.trim();

    if (!puestoSolicitado) {

        return `
⚠️ No tienes un puesto solicitado registrado.

Primero debes completar tu perfil.
`;
    }

    console.log(
        "🔎 Buscando vacantes para:",
        puestoSolicitado
    );

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

            GREATEST(
                similarity(
                    LOWER(puesto),
                    LOWER($1)
                ),
                similarity(
                    COALESCE(LOWER(area), ''),
                    LOWER($1)
                ),
                similarity(
                    COALESCE(LOWER(subarea), ''),
                    LOWER($1)
                )
            ) AS similitud

        FROM vacantes

        WHERE
            similarity(
                LOWER(puesto),
                LOWER($1)
            ) >= 0.20

            OR similarity(
                COALESCE(LOWER(area), ''),
                LOWER($1)
            ) >= 0.20

            OR similarity(
                COALESCE(LOWER(subarea), ''),
                LOWER($1)
            ) >= 0.20

        ORDER BY similitud DESC

        LIMIT 10;
        `,
        [puestoSolicitado]
    );

    const vacantes =
        resultado.rows;

    console.log(
        `🔎 Vacantes encontradas: ${vacantes.length}`
    );

    if (vacantes.length === 0) {

        return `
😕 No encontramos vacantes relacionadas con:

💼 ${puestoSolicitado}

Puedes intentar con otro puesto.
`;
    }

    let respuesta = `
🔎 *Vacantes encontradas para:*
💼 ${puestoSolicitado}

`;

    vacantes.forEach(
        (vacante, index) => {

            const salario =
                vacante.salario
                    ? `$${Number(
                        vacante.salario
                    ).toLocaleString(
                        "es-MX"
                    )} MXN`
                    : "No especificado";

            const ubicacion = [
                vacante.municipio,
                vacante.entidad
            ]
                .filter(Boolean)
                .join(", ")
                || "No especificada";

            const plazas =
                vacante.numero_plazas
                    ? vacante.numero_plazas
                    : "No especificado";

            const fecha =
                vacante.fecha_publicacion
                    ? new Date(
                        vacante.fecha_publicacion
                    ).toLocaleDateString(
                        "es-MX",
                        {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                        }
                    )
                    : "No especificada";

            respuesta += `
━━━━━━━━━━━━━━━━━━

*${index + 1}. ${
                vacante.puesto ||
                "Puesto no especificado"
            }*

🏢 Empresa:
${vacante.empresa || "No especificada"}

📂 Área:
${vacante.area || "No especificada"}

📌 Subárea:
${vacante.subarea || "No especificada"}

🎓 Nivel de estudios:
${vacante.nivel_estudios || "No especificado"}

💼 Experiencia:
${vacante.experiencia || "No especificada"}

📍 Ubicación:
${ubicacion}

💰 Salario:
${salario}

👥 Plazas disponibles:
${plazas}

📅 Publicación:
${fecha}

📄 Folio:
${vacante.folio_oferta || "No especificado"}
`;
        }
    );

    respuesta += `
━━━━━━━━━━━━━━━━━━

📌 Se muestran las 10 vacantes más relacionadas con tu búsqueda.
`;

    return respuesta;
}


async function crearBuscadorCompleto(
    datos,
    telefono
) {

    const cliente =
        await db.connect();

    try {

        await cliente.query(
            "BEGIN"
        );

        const curpExistente =
            await cliente.query(
                `
                SELECT *
                FROM buscadores_empleo
                WHERE curp = $1
                LIMIT 1
                `,
                [datos.curp]
            );

        if (
            curpExistente.rows.length > 0
        ) {

            throw new Error(
                "La CURP ya se encuentra registrada."
            );
        }

        const resultado =
            await cliente.query(
                `
                INSERT INTO buscadores_empleo
                (
                    telefono,
                    curp,
                    nombre_completo,
                    fecha_nacimiento,
                    sexo,
                    correo,
                    codigo_postal,
                    perfil_completo,
                    fecha_registro
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    true,
                    CURRENT_TIMESTAMP
                )
                RETURNING *
                `,
                [
                    telefono,
                    datos.curp,
                    datos.nombre_completo,
                    datos.fecha_nacimiento,
                    datos.sexo,
                    datos.correo,
                    datos.codigo_postal
                ]
            );

        const buscador =
            resultado.rows[0];

        const anio =
            new Date().getFullYear();

        const consecutivo =
            String(
                buscador.id
            ).padStart(6, "0");

        const folio =
            `SNE-${anio}-${consecutivo}`;

        const resultadoFolio =
            await cliente.query(
                `
                UPDATE buscadores_empleo
                SET folio = $1
                WHERE id = $2
                RETURNING *
                `,
                [
                    folio,
                    buscador.id
                ]
            );

        await cliente.query(
            "COMMIT"
        );

        return {
            ...resultadoFolio.rows[0]
        };

    } catch (error) {

        await cliente.query(
            "ROLLBACK"
        );

        console.error(
            "❌ Error en crearBuscadorCompleto():",
            error.message
        );

        throw error;

    } finally {

        cliente.release();

    }
}



async function importarBuscadorHistorico(datos, telefono) {
    const cliente = await db.connect();

    try {
        await cliente.query("BEGIN");

        const curp = String(datos.curp || "")
            .trim()
            .toUpperCase();

        const telefonoNormalizado = String(telefono || "")
            .replace(/\D/g, "");

        if (!curp) {
            throw new Error("La CURP es obligatoria para importar el registro.");
        }

        if (!telefonoNormalizado) {
            throw new Error("El teléfono es obligatorio para importar el registro.");
        }

        // Serializar importaciones para evitar conflictos concurrentes
        // entre procesos que intenten recuperar registros simultáneamente.
        await cliente.query(
            "SELECT pg_advisory_xact_lock(hashtext($1))",
            [`importar-buscador:${curp}`]
        );

        // Comprobar si la CURP ya existe.
        const existente = await cliente.query(
            `
            SELECT *
            FROM buscadores_empleo
            WHERE UPPER(TRIM(curp)) = $1
            LIMIT 1
            FOR UPDATE
            `,
            [curp]
        );

        if (existente.rows.length > 0) {
            const buscador = existente.rows[0];
            const telefonoExistente = String(buscador.telefono || "")
                .replace(/\D/g, "");

            // No devolver un registro asociado a otro teléfono.
            if (
                !telefonoExistente ||
                telefonoExistente.slice(-10) !==
                    telefonoNormalizado.slice(-10)
            ) {
                throw new Error(
                    "La CURP ya está asociada a otro teléfono en PostgreSQL."
                );
            }

            await cliente.query("COMMIT");
            return buscador;
        }

        // Comprobar que el teléfono no pertenezca a otra CURP.
        const telefonoExistente = await cliente.query(
            `
            SELECT id, curp
            FROM buscadores_empleo
            WHERE telefono = $1
            LIMIT 1
            `,
            [telefonoNormalizado]
        );

        if (telefonoExistente.rows.length > 0) {
            throw new Error(
                "El teléfono ya está asociado a otro usuario en PostgreSQL."
            );
        }

        const nombre = String(datos.nombre_completo || "").trim();
        const correo = String(datos.correo || "").trim() || null;
        const codigoPostal = String(datos.codigo_postal || "").trim() || null;
        const fechaNacimiento = datos.fecha_nacimiento || null;
        const sexo = datos.sexo || null;

        const perfilCompleto = Boolean(
            nombre &&
            curp &&
            fechaNacimiento &&
            sexo &&
            telefonoNormalizado &&
            correo &&
            codigoPostal
        );

        const resultado = await cliente.query(
            `
            INSERT INTO buscadores_empleo (
                telefono,
                curp,
                nombre_completo,
                fecha_nacimiento,
                sexo,
                correo,
                codigo_postal,
                perfil_completo,
                fecha_registro
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            RETURNING *
            `,
            [
                telefonoNormalizado,
                curp,
                nombre || null,
                fechaNacimiento,
                sexo,
                correo,
                codigoPostal,
                perfilCompleto
            ]
        );

        let buscador = resultado.rows[0];

        // Conservar el folio interno del chatbot.
        // No utilizar el folio histórico de SQL Server.
        if (perfilCompleto) {
            const anio = new Date().getFullYear();
            const consecutivo = String(buscador.id).padStart(6, "0");
            const folio = `SNE-${anio}-${consecutivo}`;

            const resultadoFolio = await cliente.query(
                `
                UPDATE buscadores_empleo
                SET folio = $1
                WHERE id = $2
                RETURNING *
                `,
                [folio, buscador.id]
            );

            buscador = resultadoFolio.rows[0];
        }

        await cliente.query("COMMIT");
        return buscador;

    } catch (error) {
        await cliente.query("ROLLBACK");

        console.error(
            "Error al importar el registro histórico:",
            error.message
        );

        throw error;

    } finally {
        cliente.release();
    }
}





async function actualizarBuscadorCompletoPorId(id, datos) {
    const cliente = await db.connect();

    try {
        await cliente.query("BEGIN");

        // 1️⃣ Actualizar los datos del buscador
        const resultado = await cliente.query(`
            UPDATE buscadores_empleo
            SET
                nombre_completo = $1,
                fecha_nacimiento = $2,
                sexo = $3,
                correo = $4,
                codigo_postal = $5
            WHERE id = $6
            RETURNING *
        `, [
            datos.nombre_completo,
            datos.fecha_nacimiento,
            datos.sexo,
            datos.correo,
            datos.codigo_postal,
            id
        ]);

        if (resultado.rows.length === 0) {
            throw new Error("No se encontró el buscador de empleo.");
        }

        // 2️⃣ Ahora calcular perfil_completo
        // usando los datos YA actualizados
        const resultadoPerfil = await cliente.query(`
            UPDATE buscadores_empleo
            SET perfil_completo = (
                NULLIF(TRIM(nombre_completo), '') IS NOT NULL
                AND NULLIF(TRIM(curp), '') IS NOT NULL
                AND fecha_nacimiento IS NOT NULL
                AND NULLIF(TRIM(sexo), '') IS NOT NULL
                AND NULLIF(TRIM(telefono), '') IS NOT NULL
                AND NULLIF(TRIM(correo), '') IS NOT NULL
                AND NULLIF(TRIM(codigo_postal), '') IS NOT NULL
            )
            WHERE id = $1
            RETURNING *
        `, [id]);

        let buscador = resultadoPerfil.rows[0];

        // 3️⃣ Generar folio si todavía no tiene
        if (!buscador.folio) {
            const anio = new Date().getFullYear();
            const folio = `SNE-${anio}-${String(buscador.id).padStart(6, "0")}`;

            const resultadoFolio = await cliente.query(`
                UPDATE buscadores_empleo
                SET folio = $1
                WHERE id = $2
                RETURNING *
            `, [folio, buscador.id]);

            buscador = resultadoFolio.rows[0];
        }

        await cliente.query("COMMIT");

        return buscador;

    } catch (error) {
        await cliente.query("ROLLBACK");
        throw error;

    } finally {
        cliente.release();
    }
}

async function actualizarCampoPerfilPorId(id, campo, valor) {

    const camposPermitidos = {
        nombre: "nombre_completo",
        fecha: "fecha_nacimiento",
        sexo: "sexo",
        correo: "correo",
        codigo_postal: "codigo_postal"
    };

    const columna = camposPermitidos[campo];

    if (!columna) {
        throw new Error("Campo de perfil no permitido.");
    }

    const cliente = await db.connect();

    try {

        await cliente.query("BEGIN");

        // =============================================
        // ACTUALIZAR SOLAMENTE EL CAMPO FALTANTE
        // =============================================

        const resultado = await cliente.query(
            `
            UPDATE buscadores_empleo
            SET ${columna} = $1
            WHERE id = $2
            RETURNING *
            `,
            [
                valor,
                id
            ]
        );

        if (resultado.rows.length === 0) {
            throw new Error(
                "No se encontró el buscador de empleo."
            );
        }

        // =============================================
        // RECALCULAR PERFIL COMPLETO
        // =============================================

        const resultadoPerfil = await cliente.query(
            `
            UPDATE buscadores_empleo
            SET perfil_completo = (
                NULLIF(TRIM(nombre_completo), '') IS NOT NULL
                AND NULLIF(TRIM(curp), '') IS NOT NULL
                AND fecha_nacimiento IS NOT NULL
                AND NULLIF(TRIM(sexo), '') IS NOT NULL
                AND NULLIF(TRIM(telefono), '') IS NOT NULL
                AND NULLIF(TRIM(correo), '') IS NOT NULL
                AND NULLIF(TRIM(codigo_postal), '') IS NOT NULL
            )
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        let buscador =
            resultadoPerfil.rows[0];

        // =============================================
        // GENERAR FOLIO SI EL PERFIL YA ESTÁ COMPLETO
        // =============================================

        if (
            buscador.perfil_completo === true &&
            !buscador.folio
        ) {

            const anio =
                new Date().getFullYear();

            const folio =
                `SNE-${anio}-${String(
                    buscador.id
                ).padStart(6, "0")}`;

            const resultadoFolio =
                await cliente.query(
                    `
                    UPDATE buscadores_empleo
                    SET folio = $1
                    WHERE id = $2
                    RETURNING *
                    `,
                    [
                        folio,
                        buscador.id
                    ]
                );

            buscador =
                resultadoFolio.rows[0];
        }

        await cliente.query("COMMIT");

        return buscador;

    } catch (error) {

        await cliente.query("ROLLBACK");

        console.error(
            "❌ Error en actualizarCampoPerfilPorId():",
            error.message
        );

        throw error;

    } finally {

        cliente.release();

    }
}


async function actualizarDatoPorId(
    id,
    campo,
    valor
) {

    const camposPermitidos = [
        "correo",
        "codigo_postal"
    ];

    if (
        !camposPermitidos.includes(campo)
    ) {

        throw new Error(
            `Campo no permitido para actualización: ${campo}`
        );
    }

    const consulta = `
        UPDATE buscadores_empleo
        SET ${campo} = $1
        WHERE id = $2
    `;

    await db.query(
        consulta,
        [
            valor,
            id
        ]
    );
}


module.exports = {

    crearBuscador,

    actualizarDato,

    generarFolio,

    completarPerfil,

    verificarPerfilCompleto,

    obtenerBuscadorPorTelefono,

    obtenerBuscadorPorId,

    obtenerUsuarioPorFolio,

    buscarVacantesPorPuesto,

    buscarVacantesPorPuestoPorId,

    buscarPorCURP,

    crearBuscadorCompleto,

    actualizarBuscadorCompletoPorId,

    actualizarCampoPerfilPorId,

    buscarSolicitantePorCURPEnAmbasBases,

    importarBuscadorHistorico,

    actualizarDatoPorId


};