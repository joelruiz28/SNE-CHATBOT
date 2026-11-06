const db = require("../config/database");

// Buscar sesión del usuario
async function obtenerSesion(telefono) {

    const resultado = await db.query(
        `
        SELECT *
        FROM sesiones_chatbot
        WHERE telefono = $1
        `,
        [telefono]
    );

    return resultado.rows[0];
}


// Crear sesión nueva
async function crearSesion(telefono) {

    const resultado = await db.query(
        `
        INSERT INTO sesiones_chatbot
        (
            telefono,
            paso_actual,
            paso_anterior,
            datos_temporales,
            intentos,
            ultima_actividad,
            advertencia_inactividad_enviada
        )

        VALUES($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,FALSE)

        RETURNING *
        `,
        [
            telefono,
            "menu",
            null,
            {},
            0
        ]
    );

    return resultado.rows[0];
}


// Actualizar paso actual
async function actualizarPaso(telefono, paso) {

    await db.query(
        `
        UPDATE sesiones_chatbot

        SET
            paso_anterior = paso_actual,
            paso_actual = $1,
            actualizado = CURRENT_TIMESTAMP

        WHERE telefono = $2
        `,
        [
            paso,
            telefono
        ]
    );

}


// Aumentar intentos fallidos
async function aumentarIntento(telefono) {

    const resultado = await db.query(
        `
        UPDATE sesiones_chatbot

        SET intentos = intentos + 1

        WHERE telefono = $1

        RETURNING intentos
        `,
        [telefono]
    );

    return resultado.rows[0].intentos;
}


// Reiniciar intentos
async function reiniciarIntentos(telefono) {

    await db.query(
        `
        UPDATE sesiones_chatbot

        SET intentos = 0

        WHERE telefono = $1
        `,
        [telefono]
    );

}


// Reiniciar conversación
async function reiniciarSesion(telefono) {

    await db.query(
        `
        UPDATE sesiones_chatbot

        SET
            paso_actual = 'menu',
            paso_anterior = NULL,
            datos_temporales = '{}'::jsonb,
            intentos = 0,
            ultima_actividad = CURRENT_TIMESTAMP,
            advertencia_inactividad_enviada = FALSE,
            fecha_cierre = NULL,
            motivo_cierre = NULL,
            actualizado = CURRENT_TIMESTAMP

        WHERE telefono = $1
        `,
        [telefono]
    );

}


// Actualizar datos temporales
async function actualizarDatosTemporales(telefono, datos) {

    await db.query(
        `
        UPDATE sesiones_chatbot

        SET
            datos_temporales =
                COALESCE(datos_temporales, '{}'::jsonb)
                || $1::jsonb,

            actualizado = CURRENT_TIMESTAMP

        WHERE telefono = $2
        `,
        [
            JSON.stringify(datos),
            telefono
        ]
    );

}


// Registrar actividad real del usuario
async function registrarActividad(telefono) {

    await db.query(
        `
        UPDATE sesiones_chatbot

        SET
            ultima_actividad = CURRENT_TIMESTAMP,
            advertencia_inactividad_enviada = FALSE

        WHERE telefono = $1
        `,
        [telefono]
    );

}


// Obtener sesiones que necesitan advertencia (8 minutos)
async function obtenerSesionesParaAdvertencia() {

    const resultado = await db.query(
        `
        SELECT *
        FROM sesiones_chatbot

        WHERE
            paso_actual <> 'finalizado'

            AND advertencia_inactividad_enviada = FALSE

            AND ultima_actividad <= CURRENT_TIMESTAMP - INTERVAL '8 minutes'

            AND ultima_actividad > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
        `
    );

    return resultado.rows;
}


// Marcar advertencia como enviada
async function marcarAdvertenciaInactividad(telefono) {

    const resultado = await db.query(
        `
        UPDATE sesiones_chatbot

        SET advertencia_inactividad_enviada = TRUE

        WHERE
            telefono = $1
            AND paso_actual <> 'finalizado'
            AND advertencia_inactividad_enviada = FALSE
            AND ultima_actividad <= CURRENT_TIMESTAMP - INTERVAL '8 minutes'
            AND ultima_actividad > CURRENT_TIMESTAMP - INTERVAL '10 minutes'

        RETURNING telefono
        `,
        [telefono]
    );

    return resultado.rowCount > 0;
}


// Obtener sesiones que superaron los 10 minutos
async function obtenerSesionesParaCerrar() {

    const resultado = await db.query(
        `
        SELECT *
        FROM sesiones_chatbot

        WHERE
            paso_actual <> 'finalizado'

            AND ultima_actividad <= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
        `
    );

    return resultado.rows;
}


// Cerrar sesión por inactividad
async function cerrarSesionPorInactividad(telefono) {

    const resultado = await db.query(
        `
        UPDATE sesiones_chatbot

        SET
            paso_anterior = paso_actual,
            paso_actual = 'finalizado',
            fecha_cierre = CURRENT_TIMESTAMP,
            motivo_cierre = 'inactividad',
            actualizado = CURRENT_TIMESTAMP

        WHERE
            telefono = $1
            AND paso_actual <> 'finalizado'
            AND ultima_actividad <= CURRENT_TIMESTAMP - INTERVAL '10 minutes'

        RETURNING *
        `,
        [telefono]
    );

    return resultado.rows[0] || null;
}


module.exports = {

    obtenerSesion,
    crearSesion,
    actualizarPaso,
    aumentarIntento,
    reiniciarIntentos,
    reiniciarSesion,
    actualizarDatosTemporales,

    // Funciones de control de inactividad
    registrarActividad,
    obtenerSesionesParaAdvertencia,
    marcarAdvertenciaInactividad,
    obtenerSesionesParaCerrar,
    cerrarSesionPorInactividad

};
