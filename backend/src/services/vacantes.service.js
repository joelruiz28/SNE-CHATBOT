const db = require("../config/database");


// =====================================================
// OBTENER TODAS LAS VACANTES
// =====================================================

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

    return resultado.rows;
}


// =====================================================
// OBTENER VACANTE POR ID
// =====================================================

async function obtenerVacantePorId(id) {

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

        WHERE id = $1

        LIMIT 1
    `, [id]);

    return resultado.rows[0] || null;
}

// =====================================================
// ACTUALIZAR ESTADO DE VACANTE
// =====================================================

async function actualizarEstadoVacante(id, estado) {

    const estadosValidos = [
        "Activa",
        "Inactiva",
        "Cerrada"
    ];

    if (!estadosValidos.includes(estado)) {

        throw new Error(
            "Estado de vacante no válido"
        );

    }


    const resultado = await db.query(
        `
        UPDATE vacantes
        SET estado = $1
        WHERE id = $2
        RETURNING *
        `,
        [
            estado,
            id
        ]
    );


    if (resultado.rows.length === 0) {

        return null;

    }


    return resultado.rows[0];

}

module.exports = {
    obtenerVacantes,
    obtenerVacantePorId,
    actualizarEstadoVacante
};