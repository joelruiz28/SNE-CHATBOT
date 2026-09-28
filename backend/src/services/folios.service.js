const db = require("../config/database");


// =====================================================
// OBTENER ESTADÍSTICAS DE FOLIOS
// =====================================================

async function obtenerEstadisticasFolios() {

    const resultado = await db.query(`
        SELECT

            COUNT(*) AS total_personas,

            COUNT(folio) AS total_folios,

            COUNT(*) FILTER (
                WHERE perfil_completo = true
            ) AS perfiles_completos

        FROM buscadores_empleo
    `);


    return {

        totalPersonas:
            Number(
                resultado.rows[0].total_personas
            ),

        totalFolios:
            Number(
                resultado.rows[0].total_folios
            ),

        perfilesCompletos:
            Number(
                resultado.rows[0].perfiles_completos
            )

    };

}


// =====================================================
// OBTENER FOLIOS RECIENTES
// =====================================================

async function obtenerFolios() {

    const resultado = await db.query(`

        SELECT

            id,

            folio,

            nombre_completo,

            telefono,

            puesto_solicitado,

            municipio,

            perfil_completo,

            fecha_registro

        FROM buscadores_empleo

        WHERE folio IS NOT NULL

        AND folio <> ''

        ORDER BY fecha_registro DESC

        LIMIT 10

    `);


    return resultado.rows;

}


// =====================================================
// BUSCAR FOLIO
// =====================================================

async function buscarFolio(folio) {

    const resultado = await db.query(`

        SELECT

            id,

            folio,

            nombre_completo,

            curp,

            fecha_nacimiento,

            sexo,

            telefono,

            correo,

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

            perfil_completo,

            fecha_registro

        FROM buscadores_empleo

        WHERE UPPER(folio) = UPPER($1)

        LIMIT 1

    `, [
        folio.trim()
    ]);


    return resultado.rows[0] || null;

}


// =====================================================
// OBTENER FOLIO POR ID
// =====================================================

async function obtenerFolioPorId(id) {

    const resultado = await db.query(`

        SELECT

            id,

            folio,

            nombre_completo,

            curp,

            fecha_nacimiento,

            sexo,

            telefono,

            correo,

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

            perfil_completo,

            fecha_registro

        FROM buscadores_empleo

        WHERE id = $1

        LIMIT 1

    `, [
        id
    ]);


    return resultado.rows[0] || null;

}

// =====================================================
// ESTADÍSTICAS DE FOLIOS
// =====================================================

async function obtenerEstadisticasFolios() {

    const resultado = await db.query(`
        SELECT
            COUNT(*) AS total,

            COUNT(*) FILTER (
                WHERE perfil_completo = true
            ) AS completos,

            COUNT(*) FILTER (
                WHERE perfil_completo = false
                OR perfil_completo IS NULL
            ) AS pendientes

        FROM buscadores_empleo

        WHERE folio IS NOT NULL
        AND folio <> ''
    `);

    return {
        total: Number(resultado.rows[0].total),
        completos: Number(resultado.rows[0].completos),
        pendientes: Number(resultado.rows[0].pendientes)
    };
}


// =====================================================
// FOLIOS RECIENTES
// =====================================================

async function obtenerFoliosRecientes() {

    const resultado = await db.query(`
        SELECT
            id,
            folio,
            nombre_completo,
            municipio,
            puesto_solicitado,
            perfil_completo,
            fecha_registro

        FROM buscadores_empleo

        WHERE folio IS NOT NULL
        AND folio <> ''

        ORDER BY fecha_registro DESC

        LIMIT 10
    `);

    return resultado.rows;
}

// =====================================
// OBTENER RESUMEN DE FOLIOS
// =====================================

async function obtenerResumenFolios() {

    const estadisticas = await db.query(`
        SELECT
            COUNT(*) AS total,

            COUNT(*) FILTER (
                WHERE perfil_completo = TRUE
                AND folio IS NOT NULL
            ) AS completos,

            COUNT(*) FILTER (
                WHERE perfil_completo = FALSE
                AND folio IS NOT NULL
            ) AS pendientes

        FROM buscadores_empleo
        WHERE folio IS NOT NULL
    `);


    const foliosRecientes = await db.query(`
        SELECT
            id,
            folio,
            nombre_completo,
            municipio,
            puesto_solicitado,
            perfil_completo,
            fecha_registro

        FROM buscadores_empleo

        WHERE folio IS NOT NULL

        ORDER BY fecha_registro DESC

        LIMIT 10
    `);


    return {

        estadisticas: {
            total: Number(
                estadisticas.rows[0].total
            ),

            completos: Number(
                estadisticas.rows[0].completos
            ),

            pendientes: Number(
                estadisticas.rows[0].pendientes
            )
        },

        foliosRecientes:
            foliosRecientes.rows

    };

}

// =====================================================
// EXPORTAR
// =====================================================

module.exports = {

    obtenerEstadisticasFolios,

    obtenerFolios,

    obtenerFoliosRecientes,

    buscarFolio,

    obtenerFolioPorId,

    obtenerResumenFolios

};