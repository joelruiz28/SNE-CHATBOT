const {
    obtenerSesionesParaAdvertencia,
    marcarAdvertenciaInactividad,
    obtenerSesionesParaCerrar,
    cerrarSesionPorInactividad
} = require("./sesion.service");

const {
    enviarMensajeWhatsApp
} = require("./whatsapp.service");


const INTERVALO_REVISION = 30 * 1000;

let temporizador = null;
let ejecutando = false;


const MENSAJE_ADVERTENCIA =
    "👋 ¡Hola! Seguimos aquí para ayudarte.\n\n" +
    "Hemos notado que llevas algunos minutos sin interactuar con nuestro chatbot.\n\n" +
    " Tu sesión se cerrará automáticamente en 2 minutos si no recibimos respuesta. " +
    "¿Deseas continuar?\n\n" +
    "Si estás respondiendo una pregunta, envía la respuesta solicitada.\n\n" +
    "Si tienes un menú disponible, selecciona la opción que deseas consultar.\n\n" +
    "Si deseas regresar al inicio, escribe MENÚ.\n\n" +
    "🇲🇽 Servicio Nacional de Empleo | Chiapas";



const MENSAJE_CIERRE =
    "👋 Te informamos que hemos cerrado esta conversación " +
    "porque no detectamos actividad durante 10 minutos.\n\n" +
    "Tus datos y postulaciones permanecen guardados.\n\n" +
    "Cuando quieras continuar utilizando los servicios del " +
    "SNE Chiapas, simplemente escribe *Hola* para iniciar " +
    "una nueva conversación.\n\n" +
    "🇲🇽 ¡Gracias por comunicarte con nosotros!";


async function procesarAdvertencias() {

    const sesiones = await obtenerSesionesParaAdvertencia();

    for (const sesion of sesiones) {

        try {

            
            const marcada = await marcarAdvertenciaInactividad(
                sesion.telefono
            );

            if (!marcada) {
                continue;
            }

            await enviarMensajeWhatsApp(
                sesion.telefono,
                MENSAJE_ADVERTENCIA
            );

            console.log(
                `⏳ Advertencia de inactividad enviada: ${sesion.telefono}`
            );

        } catch (error) {

            console.error(
                `🔴 Error enviando advertencia a ${sesion.telefono}:`,
                error.response?.data || error.message
            );


            try {
                const db = require("../config/database");

                await db.query(
                    `
                    UPDATE sesiones_chatbot

                    SET advertencia_inactividad_enviada = FALSE

                    WHERE
                        telefono = $1
                        AND paso_actual <> 'finalizado'
                        AND ultima_actividad <= CURRENT_TIMESTAMP - INTERVAL '8 minutes'
                        AND ultima_actividad > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
                    `,
                    [sesion.telefono]
                );

            } catch (errorBD) {

                console.error(
                    "🔴 Error restableciendo advertencia:",
                    errorBD.message
                );
            }
        }
    }
}



async function procesarCierres() {

    const sesiones = await obtenerSesionesParaCerrar();

    for (const sesion of sesiones) {

        try {


            const sesionCerrada = await cerrarSesionPorInactividad(
                sesion.telefono
            );

            if (!sesionCerrada) {
                continue;
            }

            console.log(
                `🔒 Sesión cerrada por inactividad: ${sesion.telefono}`
            );

   
            try {

                await enviarMensajeWhatsApp(
                    sesion.telefono,
                    MENSAJE_CIERRE
                );

                console.log(
                    `📨 Mensaje de cierre enviado: ${sesion.telefono}`
                );

            } catch (errorEnvio) {

                console.error(
                    `🔴 La sesión se cerró, pero no se pudo enviar el mensaje a ${sesion.telefono}:`,
                    errorEnvio.response?.data || errorEnvio.message
                );
            }

        } catch (error) {

            console.error(
                `🔴 Error cerrando sesión ${sesion.telefono}:`,
                error.message
            );
        }
    }
}



async function revisarInactividad() {


    if (ejecutando) {
        return;
    }

    ejecutando = true;

    try {

        await procesarAdvertencias();

        await procesarCierres();

    } catch (error) {

        console.error(
            "🔴 Error general en el servicio de inactividad:",
            error.message
        );

    } finally {

        ejecutando = false;

    }
}


function iniciarServicioInactividad() {

    if (temporizador) {
        console.log("ℹ️ El servicio de inactividad ya está iniciado.");
        return;
    }

    revisarInactividad();


    temporizador = setInterval(
        revisarInactividad,
        INTERVALO_REVISION
    );


    if (temporizador.unref) {
        temporizador.unref();
    }
}


module.exports = {
    iniciarServicioInactividad,
    revisarInactividad
};
