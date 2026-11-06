
const {
    obtenerSesionesParaAdvertencia,
    marcarAdvertenciaInactividad,
    obtenerSesionesParaCerrar,
    cerrarSesionPorInactividad
} = require("./sesion.service");

const {
    enviarMensajeWhatsApp
} = require("./whatsapp.service");

// Configuración del sistema
const INTERVALO_REVISION = 30 * 1000;

let temporizador = null;
let ejecutando = false;


// Mensaje de advertencia (8 minutos)
const MENSAJE_ADVERTENCIA =
    "👋 ¡Hola! Seguimos aquí para ayudarte.\n\n" +
    "Hemos notado que llevas algunos minutos sin interactuar con nuestro chatbot.\n\n" +
    " Tu sesión se cerrará automáticamente en 2 minutos si no recibimos respuesta. " +
    "¿Deseas continuar?\n\n" +
    "Si estás respondiendo una pregunta, envía la respuesta solicitada.\n\n" +
    "Si tienes un menú disponible, selecciona la opción que deseas consultar.\n\n" +
    "Si deseas regresar al inicio, escribe MENÚ.\n\n" +
    "🇲🇽 Servicio Nacional de Empleo | Chiapas";


// Mensaje de cierre (10 minutos)
const MENSAJE_CIERRE =
    "👋 Te informamos que hemos cerrado esta conversación " +
    "porque no detectamos actividad durante 10 minutos.\n\n" +
    "Tus datos y postulaciones permanecen guardados.\n\n" +
    "Cuando quieras continuar utilizando los servicios del " +
    "SNE Chiapas, simplemente escribe *Hola* para iniciar " +
    "una nueva conversación.\n\n" +
    "🇲🇽 ¡Gracias por comunicarte con nosotros!";


// Procesar advertencias
async function procesarAdvertencias() {

    const sesiones = await obtenerSesionesParaAdvertencia();

    for (const sesion of sesiones) {

        try {

            // Marcar antes del envío para evitar duplicados.
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

            // Permitir un nuevo intento si el envío falló.
            // La condición evita modificar sesiones que ya recibieron
            // un mensaje posterior o que fueron finalizadas.
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


// Procesar cierres automáticos
async function procesarCierres() {

    const sesiones = await obtenerSesionesParaCerrar();

    for (const sesion of sesiones) {

        try {

            // Cerrar únicamente si todavía cumple los 10 minutos.
            const sesionCerrada = await cerrarSesionPorInactividad(
                sesion.telefono
            );

            if (!sesionCerrada) {
                continue;
            }

            console.log(
                `🔒 Sesión cerrada por inactividad: ${sesion.telefono}`
            );

            // Notificar al usuario después de cerrar la sesión.
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


// Revisar todas las sesiones pendientes
async function revisarInactividad() {

    // Evitar que dos revisiones se ejecuten simultáneamente.
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


// Iniciar el servicio automático
function iniciarServicioInactividad() {

    if (temporizador) {
        console.log("ℹ️ El servicio de inactividad ya está iniciado.");
        return;
    }

    console.log("🟢 Servicio de inactividad iniciado.");
    console.log("⏳ Advertencia: 8 minutos.");
    console.log("🔒 Cierre automático: 10 minutos.");
    console.log("🔄 Revisión cada 30 segundos.");

    // Ejecutar una revisión al iniciar.
    revisarInactividad();

    // Revisar periódicamente.
    temporizador = setInterval(
        revisarInactividad,
        INTERVALO_REVISION
    );

    // Evitar que el temporizador impida cerrar el proceso Node.
    if (temporizador.unref) {
        temporizador.unref();
    }
}


module.exports = {
    iniciarServicioInactividad,
    revisarInactividad
};
