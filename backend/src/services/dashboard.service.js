
const db = require("../config/database");

async function obtenerEstadisticasDashboard() {
    const personas = await db.query(`
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (
                WHERE perfil_completo = true
            ) AS perfiles_completos,
            COUNT(*) FILTER (
                WHERE perfil_completo = false
                   OR perfil_completo IS NULL
            ) AS perfiles_incompletos
        FROM buscadores_empleo
    `);

    const vacantes = await db.query(`
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (
                WHERE estado = 1
            ) AS activas,
            COUNT(*) FILTER (
                WHERE estado = 0
            ) AS inactivas,
            COUNT(*) FILTER (
                WHERE estado = 1
                  AND vigencia IS NOT NULL
                  AND vigencia < CURRENT_DATE
            ) AS vencidas
        FROM vacantes_externas
    `);

    const empresas = await db.query(`
        SELECT
            COUNT(DISTINCT TRIM(empresa)) AS total
        FROM vacantes_externas
        WHERE empresa IS NOT NULL
          AND TRIM(empresa) <> ''
    `);

    const datosPersonas = personas.rows[0];
    const datosVacantes = vacantes.rows[0];

    return {
        totalPersonas: Number(datosPersonas.total),
        perfilesCompletos: Number(datosPersonas.perfiles_completos),
        perfilesIncompletos: Number(datosPersonas.perfiles_incompletos),

        totalVacantes: Number(datosVacantes.total),
        vacantesActivas: Number(datosVacantes.activas),
        vacantesInactivas: Number(datosVacantes.inactivas),
        vacantesVencidas: Number(datosVacantes.vencidas),

        totalEmpresas: Number(empresas.rows[0].total)
    };
}

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
