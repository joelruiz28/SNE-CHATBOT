const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const WHATSAPP_API_URL = "https://graph.facebook.com/v25.0";

function obtenerConfiguracionWhatsApp() {
    const phoneNumberId =
        process.env.WHATSAPP_PHONE_NUMBER_ID;

    const accessToken =
        process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        throw new Error(
            "Falta configurar WHATSAPP_PHONE_NUMBER_ID " +
            "o WHATSAPP_ACCESS_TOKEN."
        );
    }

    return {
        url: `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    };
}

async function enviarMensajeWhatsApp(telefono, mensaje) {
    try {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

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
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("🟢 Mensaje enviado por WhatsApp");
        console.log(JSON.stringify(respuesta.data, null, 2));

        return respuesta.data;
    } catch (error) {
        console.error("🔴 Error enviando mensaje por WhatsApp:");
        console.error(error.response?.data || error.message);
        throw error;
    }
}


async function enviarListaVacantesWhatsApp(
    telefono,
    escolaridad,
    municipio,
    entidad,
    vacantes
) {
    try {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        const url =
            `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

        const rows = (Array.isArray(vacantes) ? vacantes : [])
            .slice(0, 10)
            .map((vacante) => {
                const claveSeleccion =
                    vacante.clave_seleccion ||
                    `${vacante.origen_vacante || "postgresql"}_${vacante.id}`;

                return {
                    id: `vacante_${claveSeleccion}`,
                    title: String(
                        vacante.puesto || "Vacante"
                    ).substring(0, 24),
                    description: String(
                        vacante.empresa || "Empresa no especificada"
                    ).substring(0, 72)
                };
            });

        if (rows.length === 0) {
            throw new Error(
                "No hay vacantes para construir la lista de WhatsApp."
            );
        }

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
        text: "SNE Chiapas | Vacantes"
    },
    body: {
        text:
            "🇲🇽 *SERVICIO NACIONAL DE EMPLEO | CHIAPAS*\n\n" +
            "🔎 *Oportunidades laborales para ti*\n\n" +
            "🎓 *Nivel de estudios:*\n" +
            `${escolaridad}\n\n` +
            "📍 *Ubicación de tu perfil:*\n" +
            `${municipio}, ${entidad}\n\n` +
            "Consulta las opciones disponibles y selecciona " +
            "una vacante para conocer sus detalles."
    },
    footer: {
        text: "SNE Chiapas · Oportunidades laborales"
    },
    action: {
        button: "Consultar vacantes",
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
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("🟢 Lista de vacantes enviada por WhatsApp");
        console.log(JSON.stringify(respuesta.data, null, 2));

        return respuesta.data;
    } catch (error) {
        console.error("🔴 Error enviando lista de vacantes:");
        console.error(error.response?.data || error.message);
        throw error;
    }
}

/**
 * Sube un archivo PDF a WhatsApp y devuelve el media_id.
 */
async function subirDocumentoWhatsApp(rutaArchivo) {
    try {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!fs.existsSync(rutaArchivo)) {
            throw new Error(
                `No existe el archivo PDF: ${rutaArchivo}`
            );
        }

        const url =
            `https://graph.facebook.com/v25.0/${phoneNumberId}/media`;

        const formData = new FormData();

        formData.append("messaging_product", "whatsapp");

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
                    Authorization: `Bearer ${accessToken}`,
                    ...formData.getHeaders()
                }
            }
        );

        console.log("🟢 PDF subido correctamente a WhatsApp");
        console.log(JSON.stringify(respuesta.data, null, 2));

        return respuesta.data.id;
    } catch (error) {
        console.error("🔴 Error subiendo PDF a WhatsApp:");
        console.error(error.response?.data || error.message);
        throw error;
    }
}


async function enviarDocumentoWhatsApp(
    telefono,
    mediaId,
    nombreArchivo,
    caption
) {
    try {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

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
                        caption || "📄 Comprobante de postulación",
                    filename:
                        nombreArchivo || "comprobante-postulacion.pdf"
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("🟢 PDF enviado correctamente por WhatsApp");
        console.log(JSON.stringify(respuesta.data, null, 2));

        return respuesta.data;
    } catch (error) {
        console.error("🔴 Error enviando PDF por WhatsApp:");
        console.error(error.response?.data || error.message);
        throw error;
    }
}


async function enviarMenuPrincipalWhatsApp(
    telefono,
    usuarioRegistrado = false,
    contexto = "menu_en_conversacion"
) {
    const { url, headers } = obtenerConfiguracionWhatsApp();

    const filasRegistrado = [
        {
            id: "buscar_vacantes",
            title: "Buscar vacantes",
            description: "Encuentra oportunidades laborales"
        },
        {
            id: "ver_mis_datos",
            title: "Mi perfil",
            description: "Consulta tus datos registrados"
        },
        {
            id: "actualizar_datos",
            title: "Actualizar mis datos",
            description: "Mantén tu perfil actualizado"
        },
        {
            id: "mis_postulaciones",
            title: "Mis postulaciones",
            description: "Consulta tus solicitudes"
        },
        {
            id: "hablar_asesor",
            title: "Atención personalizada",
            description: "Solicita apoyo de un asesor"
        },
        {
            id: "menu_principal",
            title: "Menú principal",
            description: "Consulta los servicios disponibles"
        },
        {
            id: "salir",
            title: "Finalizar atención",
            description: "Termina la conversación"
        }
    ];

    const filasNoRegistrado = [
        {
            id: "buscar_vacantes",
            title: "Buscar vacantes",
            description: "Consulta oportunidades laborales"
        },
        {
            id: "registrar_datos",
            title: "Crear mi perfil",
            description: "Registra tus datos personales"
        },
        {
            id: "salir",
            title: "Finalizar atención",
            description: "Termina la conversación"
        }
    ];

    // Determinar las opciones que se mostrarán.
    let filas;

    if (contexto === "primera_vez") {
        filas = [
            {
                id: "buscar_vacantes",
                title: "Buscar vacantes",
                description: "Encuentra oportunidades laborales"
            },
            {
                id: "registrar_datos",
                title: "Registrar mis datos",
                description: "Registra tu perfil laboral"
            }
        ];
    } else {
        filas = usuarioRegistrado
            ? filasRegistrado
            : filasNoRegistrado;
    }

    // Configurar encabezado y mensaje según el contexto.
    let encabezado = "SNE Chiapas | Servicios de empleo";
    let textoMenu = "";

    if (contexto === "primera_vez") {
        textoMenu =
            "🇲🇽 *¡Hola! Te damos la bienvenida al Servicio Nacional " +
            "de Empleo (SNE) Chiapas* 👋\n\n" +
            "Soy tu asistente virtual y estoy listo para acompañarte " +
            "en la búsqueda de tu próxima oportunidad laboral o en " +
            "el registro de tu perfil.\n\n" +
            "📌 *¿Cómo empezar?*\n\n" +
            "1. Toca el botón *Consultar servicios*.\n" +
            "2. Selecciona la opción de tu interés.\n" +
            "3. Sigue los pasos que te indicaré en el chat.\n\n" +
            "*Puedes revisar las vacantes disponibles de inmediato. " +
            "Si deseas postularte a una oferta, podrás registrar " +
            "tus datos de forma rápida.*\n\n" +
            "👇 *Selecciona un servicio para comenzar:*";

    } else if (contexto === "sesion_finalizada") {
        encabezado = "SNE Chiapas | Menú principal";

        textoMenu =
            "¡Hola de nuevo! 👋 ¿Qué servicio deseas consultar?";

    } else {
        encabezado = "SNE Chiapas | Servicios disponibles";

        textoMenu =
            "*¿Qué servicio deseas consultar en el SNE Chiapas?*\n\n" +
            "Selecciona una opción para continuar.";
    }

    // Construir el mensaje interactivo de WhatsApp.
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: telefono,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: encabezado
            },
            body: {
                text: textoMenu
            },
            footer: {
                text: "SNE Chiapas · Atención digital"
            },
            action: {
                button: "Consultar servicios",
                sections: [
                    {
                        title: "Servicios disponibles",
                        rows: filas
                    }
                ]
            }
        }
    };

    try {
        const respuesta = await axios.post(
            url,
            payload,
            { headers }
        );

        console.log(
            contexto === "primera_vez"
                ? "🟢 Bienvenida y menú inicial SNE enviados."
                : contexto === "sesion_finalizada"
                    ? "🟢 Menú de regreso SNE enviado."
                    : "🟢 Menú de servicios SNE enviado."
        );

        return respuesta.data;

    } catch (error) {
        console.error(
            "🔴 Error enviando menú SNE:",
            error.response?.data || error.message
        );

        throw error;
    }
}


async function enviarListaInteractivaWhatsApp(
    telefono,
    {
        encabezado = "SNE Chiapas | Servicios disponibles",
        texto = "Selecciona una opción para continuar.",
        boton = "Consultar opciones",
        tituloSeccion = "Opciones disponibles",
        filas = []
    } = {}
) {
    const { url, headers } = obtenerConfiguracionWhatsApp();

    if (!Array.isArray(filas) || filas.length === 0) {
        throw new Error(
            "El menú interactivo debe tener al menos una opción."
        );
    }

    if (filas.length > 10) {
        throw new Error(
            "WhatsApp permite un máximo de 10 filas por mensaje de lista."
        );
    }

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: telefono,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: encabezado
            },
            body: {
                text: texto
            },
            footer: {
                text: "SNE Chiapas · Atención digital"
            },
            action: {
                button: boton,
                sections: [
                    {
                        title: tituloSeccion,
                        rows: filas
                    }
                ]
            }
        }
    };

    try {
        const respuesta = await axios.post(
            url,
            payload,
            { headers }
        );

        console.log(
            "🟢 Lista interactiva enviada:",
            encabezado
        );

        return respuesta.data;

    } catch (error) {
        console.error(
            "🔴 Error enviando lista interactiva:",
            error.response?.data || error.message
        );

        throw error;
    }
}




async function enviarImagenWhatsApp(
    telefono,
    urlImagen,
    descripcion = ""
) {
    const { url, headers } = obtenerConfiguracionWhatsApp();

    if (
        typeof urlImagen !== "string" ||
        !urlImagen.startsWith("https://")
    ) {
        throw new Error(
            "La imagen debe tener una URL pública HTTPS."
        );
    }

    await axios.post(
        url,
        {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: telefono,
            type: "image",
            image: {
                link: urlImagen,
                caption: descripcion
            }
        },
        { headers }
    );
}


module.exports = {
    enviarMensajeWhatsApp,
    enviarListaVacantesWhatsApp,
    subirDocumentoWhatsApp,
    enviarMenuPrincipalWhatsApp,
    enviarImagenWhatsApp,
    enviarListaInteractivaWhatsApp,
    enviarDocumentoWhatsApp
};