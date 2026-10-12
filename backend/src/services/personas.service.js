const db = require("../config/database");


async function obtenerPersonas() {

    const resultado = await db.query(`
        SELECT
            id,
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
            folio,
            perfil_completo,
            fecha_registro

        FROM buscadores_empleo

        ORDER BY fecha_registro DESC
    `);

    return resultado.rows;
}


async function obtenerPersonaPorId(id) {

    const resultado = await db.query(`
        SELECT
            id,
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
            folio,
            perfil_completo,
            fecha_registro

        FROM buscadores_empleo

        WHERE id = $1

        LIMIT 1
    `, [id]);

    return resultado.rows[0] || null;
}


module.exports = {
    obtenerPersonas,
    obtenerPersonaPorId
};