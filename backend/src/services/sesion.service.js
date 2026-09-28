const db = require("../config/database");


// Buscar sesión del usuario
async function obtenerSesion(telefono){

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
async function crearSesion(telefono){

    const resultado = await db.query(
        `
        INSERT INTO sesiones_chatbot
        (
            telefono,
            paso_actual,
            paso_anterior,
            datos_temporales,
            intentos
        )

        VALUES($1,$2,$3,$4,$5)

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
async function actualizarPaso(telefono,paso){

    await db.query(
        `
        UPDATE sesiones_chatbot

        SET 
        paso_anterior = paso_actual,
        paso_actual=$1,
        actualizado=CURRENT_TIMESTAMP

        WHERE telefono=$2
        `,
        [
            paso,
            telefono
        ]
    );

}



// Aumentar intentos fallidos
async function aumentarIntento(telefono){

    const resultado = await db.query(

        `
        UPDATE sesiones_chatbot

        SET intentos = intentos + 1

        WHERE telefono=$1

        RETURNING intentos
        `,

        [
            telefono
        ]

    );


    return resultado.rows[0].intentos;

}



// Reiniciar intentos
async function reiniciarIntentos(telefono){

    await db.query(

        `
        UPDATE sesiones_chatbot

        SET intentos=0

        WHERE telefono=$1
        `,

        [
            telefono
        ]

    );

}



// Reiniciar conversación
async function reiniciarSesion(telefono){

    await db.query(

        `
        UPDATE sesiones_chatbot

        SET
        paso_actual='menu',
        paso_anterior=NULL,
        datos_temporales='{}',
        intentos=0,
        actualizado=CURRENT_TIMESTAMP

        WHERE telefono=$1
        `,

        [
            telefono
        ]

    );

}

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


module.exports = {

    obtenerSesion,
    crearSesion,
    actualizarPaso,
    aumentarIntento,
    reiniciarIntentos,
    reiniciarSesion,
    actualizarDatosTemporales

};