const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");


async function enviarMensajeWhatsApp(telefono, mensaje) {

    try {

        const phoneNumberId =
            process.env.WHATSAPP_PHONE_NUMBER_ID;

        const accessToken =
            process.env.WHATSAPP_ACCESS_TOKEN;


        const url =
            `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;


        const respuesta = await axios.post(

            url,

            {
                messaging_product: "whatsapp",

                to: telefono,

                type: "text",

                text: {
                    body: mensaje
                }
            },

            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"
                }
            }

        );


        console.log(
            "🟢 Mensaje enviado por WhatsApp"
        );


        console.log(
            JSON.stringify(
                respuesta.data,
                null,
                2
            )
        );


        return respuesta.data;


    } catch (error) {

        console.error(
            "🔴 Error enviando mensaje por WhatsApp:"
        );


        console.error(
            error.response?.data ||
            error.message
        );


        throw error;

    }

}


/**
 * Envía una lista interactiva de vacantes
 */
async function enviarListaVacantesWhatsApp(
    telefono,
    escolaridad,
    municipio,
    entidad,
    vacantes
) {

    try {

        const phoneNumberId =
            process.env.WHATSAPP_PHONE_NUMBER_ID;

        const accessToken =
            process.env.WHATSAPP_ACCESS_TOKEN;


        const url =
            `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;


        const rows =
            vacantes.slice(0, 10).map(v => ({

                id: `vacante_${v.id}`,

                title: String(
                    v.puesto || "Vacante"
                ).substring(0, 24),

                description: String(
                    v.empresa || "Empresa no especificada"
                ).substring(0, 72)

            }));


        const respuesta = await axios.post(

            url,

            {

                messaging_product: "whatsapp",

                to: telefono,

                type: "interactive",

                interactive: {

                    type: "list",

                    header: {

                        type: "text",

                        text: "Vacantes disponibles"

                    },

                    body: {

                        text:
                            `🔎 *Encontré vacantes para ti*\n\n` +

                            `🎓 *Escolaridad:*\n` +
                            `${escolaridad}\n\n` +

                            `📍 *Ubicación de tu perfil:*\n` +
                            `${municipio}, ${entidad}\n\n` +

                            `Selecciona una vacante para consultar sus detalles.`

                    },

                    footer: {

                        text: "Sistema Nacional de Empleo"

                    },

                    action: {

                        button: "📋 Ver vacantes",

                        sections: [

                            {

                                title: "Vacantes disponibles",

                                rows

                            }

                        ]

                    }

                }

            },

            {

                headers: {

                    Authorization:
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"

                }

            }

        );


        console.log(
            "🟢 Lista de vacantes enviada por WhatsApp"
        );


        console.log(
            JSON.stringify(
                respuesta.data,
                null,
                2
            )
        );


        return respuesta.data;


    } catch (error) {

        console.error(
            "🔴 Error enviando lista de vacantes:"
        );


        console.error(
            error.response?.data ||
            error.message
        );


        throw error;

    }

}


/**
 * Sube un archivo PDF a WhatsApp
 * y devuelve el media_id.
 */
async function subirDocumentoWhatsApp(
    rutaArchivo
) {

    try {

        const phoneNumberId =
            process.env.WHATSAPP_PHONE_NUMBER_ID;

        const accessToken =
            process.env.WHATSAPP_ACCESS_TOKEN;


        const url =
            `https://graph.facebook.com/v25.0/${phoneNumberId}/media`;


        const formData =
            new FormData();


        formData.append(
            "messaging_product",
            "whatsapp"
        );


        formData.append(
            "file",
            fs.createReadStream(rutaArchivo),
            {
                filename: "comprobante-postulacion.pdf",
                contentType: "application/pdf"
            }
        );


        const respuesta = await axios.post(

            url,

            formData,

            {
                headers: {

                    Authorization:
                        `Bearer ${accessToken}`,

                    ...formData.getHeaders()

                }

            }

        );


        console.log(
            "🟢 PDF subido correctamente a WhatsApp"
        );


        console.log(
            JSON.stringify(
                respuesta.data,
                null,
                2
            )
        );


        return respuesta.data.id;


    } catch (error) {

        console.error(
            "🔴 Error subiendo PDF a WhatsApp:"
        );


        console.error(
            error.response?.data ||
            error.message
        );


        throw error;

    }

}


/**
 * Envía un documento PDF al usuario
 * utilizando el media_id obtenido de WhatsApp.
 */
async function enviarDocumentoWhatsApp(
    telefono,
    mediaId,
    nombreArchivo,
    caption
) {

    try {

        const phoneNumberId =
            process.env.WHATSAPP_PHONE_NUMBER_ID;

        const accessToken =
            process.env.WHATSAPP_ACCESS_TOKEN;


        const url =
            `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;


        const respuesta = await axios.post(

            url,

            {

                messaging_product: "whatsapp",

                to: telefono,

                type: "document",

                document: {

                    id: mediaId,

                    caption:
                        caption ||
                        "📄 Comprobante de postulación",

                    filename:
                        nombreArchivo

                }

            },

            {

                headers: {

                    Authorization:
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json"

                }

            }

        );


        console.log(
            "🟢 PDF enviado correctamente por WhatsApp"
        );


        console.log(
            JSON.stringify(
                respuesta.data,
                null,
                2
            )
        );


        return respuesta.data;


    } catch (error) {

        console.error(
            "🔴 Error enviando PDF por WhatsApp:"
        );


        console.error(
            error.response?.data ||
            error.message
        );


        throw error;

    }

}


module.exports = {

    enviarMensajeWhatsApp,

    enviarListaVacantesWhatsApp,

    subirDocumentoWhatsApp,

    enviarDocumentoWhatsApp

};
