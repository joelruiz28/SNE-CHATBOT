const db = require("../config/database");



async function obtenerEmpresas() {

    const resultado = await db.query(`
        SELECT
            empresa,
            COUNT(*) AS total_vacantes,
            COUNT(*) FILTER (
                WHERE COALESCE(LOWER(estado), 'activa') = 'activa'
            ) AS vacantes_activas,
            COUNT(*) FILTER (
                WHERE COALESCE(LOWER(estado), 'activa') = 'inactiva'
            ) AS vacantes_inactivas

        FROM vacantes

        WHERE empresa IS NOT NULL
        AND TRIM(empresa) <> ''

        GROUP BY empresa

        ORDER BY empresa ASC
    `);

    return resultado.rows;
}



async function obtenerEmpresaPorNombre(nombre) {

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

        WHERE LOWER(TRIM(empresa))
            = LOWER(TRIM($1))

        ORDER BY fecha_publicacion DESC
    `, [nombre]);

    return resultado.rows;
}


async function obtenerEstadisticasEmpresas() {

    const empresas = await db.query(`
        SELECT COUNT(DISTINCT empresa) AS total
        FROM vacantes

        WHERE empresa IS NOT NULL
        AND TRIM(empresa) <> ''
    `);


    const vacantes = await db.query(`
        SELECT COUNT(*) AS total
        FROM vacantes
    `);


    const activas = await db.query(`
        SELECT COUNT(*) AS total
        FROM vacantes

        WHERE COALESCE(LOWER(estado), 'activa') = 'activa'
    `);


    return {

        totalEmpresas:
            Number(empresas.rows[0].total),

        totalVacantes:
            Number(vacantes.rows[0].total),

        vacantesActivas:
            Number(activas.rows[0].total)

    };

}


module.exports = {
    obtenerEmpresas,
    obtenerEmpresaPorNombre,
    obtenerEstadisticasEmpresas
};