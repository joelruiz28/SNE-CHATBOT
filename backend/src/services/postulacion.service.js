const db = require("../config/database");


async function crearPostulacion(
    buscadorId,
    vacanteId
) {

    const resultado = await db.query(
        `
        INSERT INTO postulaciones
        (
            buscador_id,
            vacante_id
        )
        VALUES ($1, $2)
        ON CONFLICT (buscador_id, vacante_id)
        DO NOTHING
        RETURNING *
        `,
        [
            buscadorId,
            vacanteId
        ]
    );

    return resultado.rows[0] || null;
}


async function obtenerPostulacionesPorBuscador(
    buscadorId
) {

    const resultado = await db.query(
        `
        SELECT
            p.id,
            p.fecha_postulacion,
            p.estado,

            v.id AS vacante_id,
            v.folio_oferta,
            v.puesto,
            v.empresa,
            v.municipio,
            v.entidad,
            v.salario

        FROM postulaciones p

        INNER JOIN vacantes v
            ON v.id = p.vacante_id

        WHERE p.buscador_id = $1

        ORDER BY p.fecha_postulacion DESC
        `,
        [
            buscadorId
        ]
    );

    return resultado.rows;
}


/**
 * Obtiene toda la información necesaria
 * para generar el comprobante de postulación.
 */
async function obtenerDatosComprobante(
    postulacionId
) {

    const resultado = await db.query(
        `
        SELECT

            /* Datos de la postulación */
            p.id AS postulacion_id,
            p.fecha_postulacion,
            p.estado,

            /* Datos del buscador */
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

            /* Datos de la vacante */
            v.id AS vacante_id,
            v.folio_oferta,
            v.puesto,
            v.empresa,
            v.municipio AS municipio_vacante,
            v.entidad,
            v.salario,
            v.nivel_estudios AS nivel_estudios_vacante,
            v.experiencia

        FROM postulaciones p

        INNER JOIN buscadores_empleo b
            ON b.id = p.buscador_id

        INNER JOIN vacantes v
            ON v.id = p.vacante_id

        WHERE p.id = $1

        LIMIT 1
        `,
        [
            postulacionId
        ]
    );

    return resultado.rows[0] || null;
}


module.exports = {

    crearPostulacion,

    obtenerPostulacionesPorBuscador,

    obtenerDatosComprobante

};