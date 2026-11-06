
const db = require("../config/database");

async function obtenerVacantes() {
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
        ORDER BY fecha_publicacion DESC NULLS LAST
    `);

    return resultado.rows;
}

async function obtenerVacantePorId(id) {
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
        WHERE cve_vacante_sqlserver = $1
        LIMIT 1
    `, [id]);

    return resultado.rows[0] || null;
}

module.exports = {
    obtenerVacantes,
    obtenerVacantePorId
};
