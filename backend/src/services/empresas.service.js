const db = require("../config/database");

async function obtenerEmpresas() {
    const resultado = await db.query(`
        SELECT
            empresa,
            COUNT(*) AS total_vacantes,

            COUNT(*) FILTER (
                WHERE estado = 1
            ) AS vacantes_activas,

            COUNT(*) FILTER (
                WHERE estado = 0
            ) AS vacantes_inactivas

        FROM vacantes_externas

        WHERE empresa IS NOT NULL
          AND TRIM(empresa) <> ''

        GROUP BY empresa
        ORDER BY empresa ASC
    `);

    return resultado.rows.map((empresa) => ({
        ...empresa,
        total_vacantes: Number(empresa.total_vacantes),
        vacantes_activas: Number(empresa.vacantes_activas),
        vacantes_inactivas: Number(empresa.vacantes_inactivas)
    }));
}

async function obtenerEmpresaPorNombre(nombre) {
    const resultado = await db.query(`
        SELECT
            cve_vacante_sqlserver AS id,
            cve_vacante_sqlserver,
            folio_oferta,
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
            vigencia,
            estado

        FROM vacantes_externas

        WHERE LOWER(TRIM(empresa)) = LOWER(TRIM($1))

        ORDER BY fecha_publicacion DESC NULLS LAST
    `, [nombre]);

    return resultado.rows;
}

async function obtenerEstadisticasEmpresas() {
    const resultado = await db.query(`
        SELECT
            COUNT(DISTINCT empresa) FILTER (
                WHERE empresa IS NOT NULL
                  AND TRIM(empresa) <> ''
            ) AS total_empresas,

            COUNT(*) AS total_vacantes,

            COUNT(*) FILTER (
                WHERE estado = 1
            ) AS vacantes_activas

        FROM vacantes_externas
    `);

    const estadisticas = resultado.rows[0];

    return {
        totalEmpresas: Number(estadisticas.total_empresas),
        totalVacantes: Number(estadisticas.total_vacantes),
        vacantesActivas: Number(estadisticas.vacantes_activas)
    };
}

module.exports = {
    obtenerEmpresas,
    obtenerEmpresaPorNombre,
    obtenerEstadisticasEmpresas
};
