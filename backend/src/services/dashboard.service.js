const db = require("../config/database");


// =====================================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD
// =====================================================

async function obtenerEstadisticasDashboard() {

    // ---------------------------------------------
    // TOTAL DE PERSONAS REGISTRADAS
    // ---------------------------------------------

    const personas = await db.query(`
        SELECT COUNT(*) AS total
        FROM buscadores_empleo
    `);


    // ---------------------------------------------
    // PERFILES COMPLETOS
    // ---------------------------------------------

    const perfilesCompletos = await db.query(`
        SELECT COUNT(*) AS total
        FROM buscadores_empleo
        WHERE perfil_completo = true
    `);


    // ---------------------------------------------
    // PERFILES INCOMPLETOS
    // ---------------------------------------------

    const perfilesIncompletos = await db.query(`
        SELECT COUNT(*) AS total
        FROM buscadores_empleo
        WHERE perfil_completo = false
        OR perfil_completo IS NULL
    `);


    // ---------------------------------------------
    // TOTAL DE VACANTES
    // ---------------------------------------------

    const vacantes = await db.query(`
        SELECT COUNT(*) AS total
        FROM vacantes
    `);


    // ---------------------------------------------
    // TOTAL DE EMPRESAS
    // ---------------------------------------------

    const empresas = await db.query(`
        SELECT COUNT(DISTINCT empresa) AS total
        FROM vacantes
        WHERE empresa IS NOT NULL
        AND empresa <> ''
    `);


    return {
        totalPersonas: Number(personas.rows[0].total),

        perfilesCompletos:
            Number(perfilesCompletos.rows[0].total),

        perfilesIncompletos:
            Number(perfilesIncompletos.rows[0].total),

        totalVacantes:
            Number(vacantes.rows[0].total),

        totalEmpresas:
            Number(empresas.rows[0].total)
    };
}


// =====================================================
// OBTENER PERSONAS REGISTRADAS RECIENTEMENTE
// =====================================================

async function obtenerRegistrosRecientes() {

    const resultado = await db.query(`
        SELECT
            id,
            nombre_completo,
            municipio,
            puesto_solicitado,
            perfil_completo,
            fecha_registro,
            folio

        FROM buscadores_empleo

        ORDER BY fecha_registro DESC

        LIMIT 10
    `);

    return resultado.rows;
}


module.exports = {
    obtenerEstadisticasDashboard,
    obtenerRegistrosRecientes
};