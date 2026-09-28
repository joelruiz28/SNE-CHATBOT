const db = require("../config/database");


const {
    obtenerSesion,
    crearSesion,
    actualizarPaso
} = require("../services/sesion.service");


const {
    procesarMensaje
} = require("../services/chatbot.service");


const {
    enviarMensajeWhatsApp,
    enviarListaVacantesWhatsApp
} = require("../services/whatsapp.service");



exports.verificarWebhook = (req, res) => {

    const modo =
        req.query["hub.mode"];

    const token =
        req.query["hub.verify_token"];

    const challenge =
        req.query["hub.challenge"];


    if (
        modo === "subscribe" &&
        token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {

        console.log(
            "🟢 Webhook de WhatsApp verificado correctamente"
        );

        return res
            .status(200)
            .send(challenge);
    }


    console.log(
        "🔴 Error al verificar webhook"
    );

    return res.sendStatus(403);

};



exports.recibirWebhook = async (req, res) => {

    try {

        console.log(
            "📩 Evento recibido de WhatsApp:"
        );


        console.log(
            JSON.stringify(
                req.body,
                null,
                2
            )
        );


        /*
         * Respondemos inmediatamente a Meta.
         *
         * Después procesamos el mensaje.
         */
        res.sendStatus(200);


        const entrada =
            req.body?.entry?.[0];


        const cambio =
            entrada?.changes?.[0];


        const valor =
            cambio?.value;


        if (!valor) {

            console.log(
                "ℹ️ Evento sin información de WhatsApp"
            );

            return;

        }


        const mensaje =
            valor.messages?.[0];


        /*
         * Si no existe messages[0],
         * probablemente sea un evento de estado.
         */
        if (!mensaje) {

            console.log(
                "ℹ️ Evento de estado recibido"
            );

            return;

        }


        /*
         * Ahora aceptamos:
         *
         * text
         * interactive
         */
        if (
            mensaje.type !== "text" &&
            mensaje.type !== "interactive"
        ) {

            console.log(
                `ℹ️ Tipo de mensaje no soportado: ${mensaje.type}`
            );

            return;

        }


        const telefono =
            mensaje.from;


        /*
         * Texto que enviaremos al chatbot.
         *
         * Mensaje normal:
         *     mensaje.text.body
         *
         * Selección de lista:
         *     mensaje.interactive.list_reply.id
         */
        let texto = "";


        if (
            mensaje.type === "text"
        ) {

            texto =
                mensaje.text?.body || "";

        }


        else if (
            mensaje.type === "interactive" &&
            mensaje.interactive?.type === "list_reply"
        ) {

            texto =
                mensaje.interactive
                    ?.list_reply
                    ?.id || "";

        }


        /*
         * Si llegó un interactive que no es
         * list_reply, no lo procesamos todavía.
         */
        if (!texto) {

            console.log(
                "ℹ️ No se pudo obtener el contenido del mensaje interactivo"
            );

            return;

        }


        console.log(
            "📱 Teléfono:",
            telefono
        );


        console.log(
            "💬 Mensaje procesado:",
            texto
        );


        let sesion =
            await obtenerSesion(telefono);


        if (!sesion) {

            console.log(
                "🆕 Creando nueva sesión..."
            );


            sesion =
                await crearSesion(
                    telefono
                );

        }


        /*
         * Procesar mensaje mediante el chatbot.
         */
        const resultado =
            await procesarMensaje(
                sesion,
                texto,
                telefono
            );


        console.log(
            "🤖 Respuesta del chatbot:"
        );


        console.log(
            resultado.respuesta
        );


        /*
         * Actualizar paso de la sesión.
         */
        await actualizarPaso(
            telefono,
            resultado.siguientePaso
        );


        /*
         * Guardar conversación.
         */
        await db.query(`
            INSERT INTO conversaciones
            (telefono, mensaje, respuesta)
            VALUES ($1, $2, $3)
        `, [
            telefono,
            texto,
            resultado.respuesta
        ]);


        /*
         * Si el flujo encontró vacantes,
         * enviamos una LISTA INTERACTIVA.
         */
        if (
            resultado.tipoRespuesta ===
            "lista_vacantes"
        ) {

            console.log(
                "📋 Enviando lista interactiva de vacantes..."
            );


            await enviarListaVacantesWhatsApp(
                telefono,
                resultado.escolaridad,
                resultado.municipio,
                resultado.entidad,
                resultado.vacantes
            );

        }


        /*
         * Todas las demás respuestas
         * continúan siendo mensajes normales.
         */
        else {

            await enviarMensajeWhatsApp(
                telefono,
                resultado.respuesta
            );

        }


        console.log(
            "✅ Flujo completo ejecutado"
        );


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