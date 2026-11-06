const {
    obtenerPostulacionesPorBuscador,
    obtenerDatosComprobante
} = require("../services/postulacion.service");

const {
    obtenerBuscadorPorId,
    obtenerBuscadorPorTelefono
} = require("../services/buscador.service");

const {
    actualizarDatosTemporales
} = require("../services/sesion.service");

const {
    obtenerOpcionesListadoPostulaciones,
    obtenerOpcionesDetallePostulacion,
    obtenerOpcionesInformacionPostulacion,
    obtenerOpcionesSinPostulaciones
} = require("../utils/opciones-postulaciones");


async function obtenerUsuarioSesion(sesion, telefono) {
    const datosTemporales = sesion?.datos_temporales || {};

    const seguridadVerificada =
        datosTemporales.seguridad_verificada === true;

    const usuarioAutorizadoId =
        datosTemporales.usuario_autorizado_id;

    if (seguridadVerificada && usuarioAutorizadoId) {
        return await obtenerBuscadorPorId(usuarioAutorizadoId);
    }

    return await obtenerBuscadorPorTelefono(telefono);
}


function normalizarMensaje(mensaje) {
    return String(mensaje ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function obtenerIconoEstado(estado) {
    const estadoNormalizado = normalizarMensaje(estado);

    if (
        estadoNormalizado === "aceptada" ||
        estadoNormalizado === "revisada"
    ) {
        return "🟢";
    }

    if (
        estadoNormalizado === "rechazada" ||
        estadoNormalizado === "cancelada"
    ) {
        return "🔴";
    }

    return "🟡";
}


function obtenerOpcionesDetalle() {
    return obtenerOpcionesDetallePostulacion();
}


function obtenerOpcionesInformacion() {
    return obtenerOpcionesInformacionPostulacion();
}


async function mostrarListadoPostulaciones(sesion, telefono) {
    const inicioProceso = Date.now();

    console.log("📋 Consultando Mis postulaciones...");

    const inicioUsuario = Date.now();

    const usuario = await obtenerUsuarioSesion(sesion, telefono);

    console.log(
        `⏱️ Buscar usuario: ${Date.now() - inicioUsuario} ms`
    );

    if (!usuario) {
        return {
            respuesta:
`⚠️ No encontramos tus datos registrados.

Primero debes registrar tus datos.`,
            siguientePaso: "menu",
            mostrarMenuPrincipal: true
        };
    }

    const inicioPostulaciones = Date.now();

    const postulaciones = await obtenerPostulacionesPorBuscador(
        usuario.id
    );

    console.log(
        `⏱️ Buscar postulaciones: ${Date.now() - inicioPostulaciones} ms`
    );

    console.log(
        `📋 Postulaciones encontradas: ${postulaciones.length}`
    );

    console.log(
        `⏱️ Tiempo total Mis postulaciones: ${Date.now() - inicioProceso} ms`
    );

    if (!postulaciones.length) {
        return {
            respuesta:
`📋 *MIS POSTULACIONES*

Todavía no tienes postulaciones registradas.

Puedes buscar vacantes para encontrar oportunidades laborales.`,
            siguientePaso: "postulaciones",
            tipoRespuesta: "menu_interactivo",
            opcionesMenu: obtenerOpcionesSinPostulaciones()
        };
    }

    const opcionesMenu =
        obtenerOpcionesListadoPostulaciones(postulaciones);

    const textoListado = postulaciones.length > 10
        ? `Mostrando tus primeras 10 postulaciones de ${postulaciones.length}.`
        : `Tienes ${postulaciones.length} ${
            postulaciones.length === 1
                ? "postulación registrada"
                : "postulaciones registradas"
        }.`;

    return {
        respuesta:
`📋 *MIS POSTULACIONES*

${textoListado}

Selecciona una vacante para consultar su estado y detalles.`,
        siguientePaso: "seleccionar_postulacion",
        tipoRespuesta: "menu_interactivo",
        opcionesMenu
    };
}


async function procesarPostulaciones(sesion, mensaje, telefono) {
    mensaje = normalizarMensaje(mensaje);

    if (
        mensaje === "menu" ||
        mensaje === "inicio" ||
        mensaje === "menu_principal"
    ) {
        return {
            respuesta: "Volvamos al menú principal.",
            siguientePaso: "menu",
            mostrarMenuPrincipal: true
        };
    }

    // Abrir o actualizar el listado.
    if (sesion.paso_actual === "postulaciones") {
        return await mostrarListadoPostulaciones(sesion, telefono);
    }

    // Seleccionar una postulación desde la lista interactiva.
    if (sesion.paso_actual === "seleccionar_postulacion") {
        const usuario = await obtenerUsuarioSesion(sesion, telefono);

        if (!usuario) {
            return {
                respuesta: "No encontramos tus datos registrados.",
                siguientePaso: "menu",
                mostrarMenuPrincipal: true
            };
        }

        const postulaciones = await obtenerPostulacionesPorBuscador(
            usuario.id
        );

        let postulacion = null;

        if (mensaje.startsWith("postulacion_")) {
            const idSeleccionado = mensaje.slice("postulacion_".length);

            postulacion = postulaciones.find(
                item => String(item.id) === idSeleccionado
            );
        } else {
            // Compatibilidad con el listado numérico anterior.
            const numero = Number.parseInt(mensaje, 10);

            if (
                Number.isInteger(numero) &&
                numero >= 1 &&
                numero <= postulaciones.length
            ) {
                postulacion = postulaciones[numero - 1];
            }
        }

        if (!postulacion) {
            if (!postulaciones.length) {
                return await mostrarListadoPostulaciones(sesion, telefono);
            }

            return {
                respuesta: "Selecciona una postulación de la lista para continuar.",
                siguientePaso: "seleccionar_postulacion",
                tipoRespuesta: "menu_interactivo",
                opcionesMenu:
                    obtenerOpcionesListadoPostulaciones(postulaciones)
            };
        }

        await actualizarDatosTemporales(telefono, {
            postulacion_seleccionada: postulacion.id
        });

        const iconoEstado = obtenerIconoEstado(postulacion.estado);
        const estado = postulacion.estado || "En revisión";

        const fecha = postulacion.fecha_postulacion
            ? new Date(postulacion.fecha_postulacion)
                .toLocaleDateString("es-MX")
            : "No disponible";

        return {
            respuesta:
`📋 *${postulacion.puesto || "Vacante"}*

🏢 ${postulacion.empresa || "Empresa no especificada"}

${iconoEstado} *${estado}*

📅 Postulación: ${fecha}

Selecciona una opción para continuar.`,
            siguientePaso: "detalle_postulacion",
            tipoRespuesta: "menu_interactivo",
            opcionesMenu: obtenerOpcionesDetalle()
        };
    }

    // Acciones del detalle de la postulación.
    if (sesion.paso_actual === "detalle_postulacion") {
        const datosTemporales = sesion?.datos_temporales || {};
        const postulacionId = datosTemporales.postulacion_seleccionada;

        if (!postulacionId) {
            return {
                respuesta: "No se pudo identificar la postulación. Volvamos al listado.",
                siguientePaso: "postulaciones"
            };
        }

        if (
            mensaje === "cancelar_postulacion" ||
            mensaje === "1"
        ) {
            return {
                respuesta:
`⚠️ La cancelación de postulaciones todavía no está habilitada.

Puedes consultar más datos o regresar a tu listado.`,
                siguientePaso: "detalle_postulacion",
                tipoRespuesta: "menu_interactivo",
                opcionesMenu: obtenerOpcionesDetalle()
            };
        }

        if (
            mensaje === "ver_mas_datos" ||
            mensaje === "2"
        ) {
            const datos = await obtenerDatosComprobante(postulacionId);

            if (!datos) {
                return {
                    respuesta: "No encontramos la información de esta postulación.",
                    siguientePaso: "postulaciones"
                };
            }

            const iconoEstado = obtenerIconoEstado(datos.estado);
            const estado = datos.estado || "En revisión";

            const fecha = datos.fecha_postulacion
                ? new Date(datos.fecha_postulacion)
                    .toLocaleDateString("es-MX")
                : "una fecha no disponible";

            return {
                respuesta:
`💼 *${datos.puesto || "Vacante"}*

🏢 ${datos.empresa || "Empresa no especificada"}

📍 ${datos.municipio_vacante || "Municipio no especificado"}, ${datos.entidad || "Entidad no especificada"}

💰 ${datos.salario || "No especificado"}

🕒 ${datos.experiencia || "No especificada"}

🔖 Folio: ${datos.folio_oferta || "No disponible"}

${iconoEstado} *${estado} desde el ${fecha}*`,
                siguientePaso: "informacion_postulacion",
                tipoRespuesta: "menu_interactivo",
                opcionesMenu: obtenerOpcionesInformacion()
            };
        }

        if (
            mensaje === "regresar_postulaciones" ||
            mensaje === "3"
        ) {
            return await mostrarListadoPostulaciones(sesion, telefono);
        }

        if (mensaje === "menu_principal") {
            return {
                respuesta: "Volvamos al menú principal.",
                siguientePaso: "menu",
                mostrarMenuPrincipal: true
            };
        }

        return {
            respuesta: "Selecciona una de las opciones disponibles.",
            siguientePaso: "detalle_postulacion",
            tipoRespuesta: "menu_interactivo",
            opcionesMenu: obtenerOpcionesDetalle()
        };
    }

    // Acciones desde la información ampliada.
    if (sesion.paso_actual === "informacion_postulacion") {
        if (
            mensaje === "cancelar_postulacion" ||
            mensaje === "1"
        ) {
            return {
                respuesta:
`⚠️ La cancelación de postulaciones todavía no está habilitada.`,
                siguientePaso: "informacion_postulacion",
                tipoRespuesta: "menu_interactivo",
                opcionesMenu: obtenerOpcionesInformacion()
            };
        }

        if (
            mensaje === "regresar_postulaciones" ||
            mensaje === "2"
        ) {
            return await mostrarListadoPostulaciones(sesion, telefono);
        }

        if (mensaje === "menu_principal") {
            return {
                respuesta: "Volvamos al menú principal.",
                siguientePaso: "menu",
                mostrarMenuPrincipal: true
            };
        }

        return {
            respuesta: "Selecciona una de las opciones disponibles.",
            siguientePaso: "informacion_postulacion",
            tipoRespuesta: "menu_interactivo",
            opcionesMenu: obtenerOpcionesInformacion()
        };
    }

    return {
        respuesta: "No se pudo abrir Mis postulaciones.",
        siguientePaso: "menu",
        mostrarMenuPrincipal: true
    };
}


module.exports = {
    procesarPostulaciones,
    mostrarListadoPostulaciones
};
