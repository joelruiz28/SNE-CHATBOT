const db = require("../config/database");

const {
    obtenerSesion,
    crearSesion,
    actualizarPaso,
    registrarActividad,
    reiniciarSesion
} = require("../services/sesion.service");

const {
    procesarMensaje
} = require("../services/chatbot.service");


const {
    enviarMensajeWhatsApp,
    enviarMenuPrincipalWhatsApp,
    enviarImagenWhatsApp,
    enviarListaVacantesWhatsApp,
    enviarListaInteractivaWhatsApp
} = require("../services/whatsapp.service");



exports.verificarWebhook = (req, res) => {

    const modo = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
        modo === "subscribe" &&
        token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
        console.log(
            "🟢 Webhook de WhatsApp verificado correctamente"
        );

        return res.status(200).send(challenge);
    }

    console.log("🔴 Error al verificar webhook");

    return res.sendStatus(403);
};


exports.recibirWebhook = async (req, res) => {

    // Responder a Meta inmediatamente para evitar reintentos
    // mientras se procesa la conversación.
    res.sendStatus(200);

    try {

        console.log("📩 Evento recibido de WhatsApp:");

        console.log(
            JSON.stringify(req.body, null, 2)
        );

        const entrada = req.body?.entry?.[0];
        const cambio = entrada?.changes?.[0];
        const valor = cambio?.value;

        if (!valor) {
            console.log(
                "ℹ️ Evento sin información de WhatsApp"
            );
            return;
        }

        const mensaje = valor.messages?.[0];

        // Ignorar eventos de estado de entrega o lectura.
        if (!mensaje) {
            console.log("ℹ️ Evento de estado recibido");
            return;
        }

        if (
            mensaje.type !== "text" &&
            mensaje.type !== "interactive"
        ) {
            console.log(
                `ℹ️ Tipo de mensaje no soportado: ${mensaje.type}`
            );
            return;
        }

        const telefono = mensaje.from;

        let texto = "";

        if (mensaje.type === "text") {

            texto = mensaje.text?.body || "";

        } else if (
            mensaje.type === "interactive" &&
            mensaje.interactive?.type === "list_reply"
        ) {

            texto =
                mensaje.interactive.list_reply?.id || "";

        } else if (
            mensaje.type === "interactive" &&
            mensaje.interactive?.type === "button_reply"
        ) {

            texto =
                mensaje.interactive.button_reply?.id || "";
        }

        if (!texto) {
            console.log(
                "ℹ️ No se pudo obtener el contenido del mensaje interactivo"
            );
            return;
        }

        console.log("📱 Teléfono:", telefono);
        console.log("💬 Mensaje procesado:", texto);

        

        // 1. Consultar si este teléfono ya tiene conversaciones guardadas.
        const historial = await db.query(
            `SELECT 1
             FROM conversaciones
             WHERE telefono = $1
             LIMIT 1`,
            [telefono]
        );

        const primeraInteraccion = historial.rowCount === 0;

        // 2. Obtener la sesión actual.
let sesion = await obtenerSesion(telefono);

const sesionExistente = sesion;

const sesionFinalizada =
    Boolean(sesionExistente) &&
    sesionExistente.paso_actual === "finalizado";

// Crear sesión si el usuario nunca ha tenido una.
if (!sesion) {

    console.log(
        "🆕 Creando sesión para el teléfono:",
        telefono
    );

    sesion = await crearSesion(telefono);

}

// Si la sesión anterior terminó, iniciar una nueva conversación.
else if (sesionFinalizada) {

    console.log(
        "🔄 Reiniciando conversación finalizada:",
        telefono
    );

    await reiniciarSesion(telefono);

    sesion = await obtenerSesion(telefono);

}

// Registrar actividad del usuario.
// Esto reinicia el contador de inactividad y la advertencia.
await registrarActividad(telefono);

console.log(
    "⏱️ Actividad del usuario registrada:",
    telefono
);

        // 3. Determinar qué tipo de menú debe mostrarse.
        let contextoMenu = null;

        if (primeraInteraccion) {
            contextoMenu = "primera_vez";
        } else if (sesionFinalizada || !sesionExistente) {
            contextoMenu = "sesion_finalizada";
        } else if (
            ["menu", "menú", "inicio", "menu_principal"]
                .includes(String(texto).trim().toLowerCase())
        ) {
            contextoMenu = "menu_en_conversacion";
        }

        const abrirMenu =
            contextoMenu === "primera_vez" ||
            contextoMenu === "sesion_finalizada";

        console.log("📌 Contexto de menú:", contextoMenu || "flujo_activo");

        // 4. Solo forzar el menú al iniciar o reanudar
        // después de finalizar. En los demás casos,
        // procesar la opción que eligió el usuario.
        const resultado = await procesarMensaje(
            sesion,
            abrirMenu ? "mostrar_menu" : texto,
            telefono
        );
console.log("📋 Tipo:", resultado.tipoRespuesta);
console.log("📋 Paso:", resultado.siguientePaso);
console.log("📋 Opciones:", resultado.opcionesMenu?.length || 0);
        console.log("🤖 Respuesta del chatbot:");
        console.log(resultado.respuesta);

        await actualizarPaso(
            telefono,
            resultado.siguientePaso
        );

        await db.query(
            `INSERT INTO conversaciones
             (telefono, mensaje, respuesta)
             VALUES ($1, $2, $3)`,
            [
                telefono,
                texto,
                resultado.respuesta
            ]
        );




        // Enviar la respuesta correspondiente al contexto.

        const esMenuInteractivo =
            resultado.tipoRespuesta === "menu_interactivo" ||
            resultado.tipoRespuesta === "menu_principal";

        if (esMenuInteractivo) {
            const opciones = resultado.opcionesMenu;

            if (!Array.isArray(opciones) || opciones.length === 0) {
                // Evitar perder la respuesta si el flujo no devuelve filas.
                if (resultado.respuesta) {
                    await enviarMensajeWhatsApp(
                        telefono,
                        resultado.respuesta
                    );
                }

                console.error(
                    "⚠️ El flujo interactivo no devolvió opciones."
                );

                return;
            }

            let encabezado = "SNE Chiapas | Opciones";
            let boton = "Consultar opciones";
            let tituloSeccion = "Opciones disponibles";
            let textoLista =
                resultado.respuesta ||
                "Selecciona una opción para continuar.";

                if (resultado.siguientePaso === "seleccionar_postulacion") {
    encabezado = "SNE Chiapas | Mis postulaciones";
    boton = "Ver postulaciones";
    tituloSeccion = "Tus postulaciones";
}

            if (resultado.siguientePaso === "esperando_escolaridad") {
                encabezado = "SNE Chiapas | Escolaridad";
                boton = "Elegir estudios";
                tituloSeccion = "Nivel de estudios";

                textoLista =
                    resultado.respuesta ||
                    "Selecciona tu último nivel de estudios.";
            } else if (
                resultado.siguientePaso === "seleccionar_vacante"
            ) {
                encabezado = "SNE Chiapas | Vacantes";
                boton = "Ver opciones";
                tituloSeccion = "Opciones disponibles";
            } else if (
                resultado.siguientePaso === "detalle_vacante"
            ) {
                encabezado = "SNE Chiapas | Vacante";
                boton = "Continuar";
                tituloSeccion = "¿Qué deseas hacer?";
            }

            // Mantener el banner institucional para la primera interacción.
            if (contextoMenu === "primera_vez") {
                const logoUrl = process.env.SNE_LOGO_URL;

                if (logoUrl) {
                    try {
                        await enviarImagenWhatsApp(
                            telefono,
                            logoUrl,
                            "Servicio Nacional de Empleo | Chiapas"
                        );
                    } catch (error) {
                        console.error(
                            "⚠️ Error enviando banner institucional:",
                            error.response?.data || error.message
                        );
                    }
                }

                textoLista =
                    "🇲🇽 ¡Te damos la bienvenida al Servicio Nacional " +
                    "de Empleo Chiapas! 👋\n\n" +
                    "Consulta oportunidades laborales o registra tu perfil.\n\n" +
                    "Selecciona un servicio para comenzar.";
            } else if (contextoMenu === "sesion_finalizada") {
                textoLista =
                    "👋 ¡Hola de nuevo!\n\n" +
                    "Nos da gusto atenderte otra vez en el " +
                    "Servicio Nacional de Empleo Chiapas.\n\n" +
                    "¿Qué servicio deseas consultar?";
            }

            await enviarListaInteractivaWhatsApp(
                telefono,
                {
                    encabezado,
                    texto: textoLista,
                    boton,
                    tituloSeccion,
                    filas: opciones
                }
            );

        } else if (
            resultado.tipoRespuesta === "lista_vacantes"
        ) {
            await enviarListaVacantesWhatsApp(
                telefono,
                resultado.escolaridad,
                resultado.municipio,
                resultado.entidad,
                resultado.vacantes
            );

        } else if (resultado.respuesta) {
            await enviarMensajeWhatsApp(
                telefono,
                resultado.respuesta
            );
        }




    } catch (error) {

        console.error(
            "🔴 Error procesando webhook:"
        );

        console.error(
            error.response?.data ||
            error.message ||
            error
        );
    }
};
