
const {
    actualizarDato,
    actualizarDatoPorId
} = require("../services/buscador.service");

const {
    validarCorreo
} = require("../utils/validaciones");

const {
    obtenerOpcionesActualizacion
} = require("../utils/opciones-actualizacion");


async function actualizarDatoUsuario(
    sesion,
    telefono,
    campo,
    valor
) {
    const datosTemporales =
        sesion.datos_temporales || {};

    const usuarioAutorizadoId =
        datosTemporales.usuario_autorizado_id;

    const seguridadVerificada =
        datosTemporales.seguridad_verificada === true;

    if (seguridadVerificada && usuarioAutorizadoId) {
        console.log(
            "🔐 Actualizando registro autorizado."
        );

        console.log(
            "🆔 ID del usuario:",
            usuarioAutorizadoId
        );

        await actualizarDatoPorId(
            usuarioAutorizadoId,
            campo,
            valor
        );

        return;
    }

    console.log(
        "📱 Actualizando usuario mediante teléfono:",
        telefono
    );

    await actualizarDato(
        telefono,
        campo,
        valor
    );
}


async function procesarActualizacion(
    sesion,
    mensaje,
    telefono
) {
    let respuesta = "";
    let siguientePaso = sesion.paso_actual;
    let mostrarMenuPrincipal = false;
    let tipoRespuesta = null;
    let opcionesMenu = null;

    const seleccion = String(mensaje).trim();

    switch (sesion.paso_actual) {

        // =====================================
        // SELECCIONAR DATO
        // =====================================

        case "seleccionar_actualizacion":

            switch (seleccion) {

                case "actualizar_correo":
                case "1":

                    respuesta = `
📧 *Actualizar correo*

Escribe tu nuevo correo electrónico.

Ejemplo:
usuario@gmail.com
`;

                    siguientePaso = "actualizar_correo";

                    break;


                case "actualizar_codigo_postal":
                case "2":

                    respuesta = `
📮 *Actualizar código postal*

Escribe tu nuevo código postal.

Debe contener exactamente 5 dígitos.

Ejemplo:
29000
`;

                    siguientePaso = "actualizar_codigo_postal";

                    break;


                case "menu_principal":
                case "6":

                    respuesta =
                        "Volvamos al menú principal.";

                    siguientePaso = "menu";
                    mostrarMenuPrincipal = true;

                    break;


                case "salir":
                case "7":

                    respuesta = `
👋 Gracias por utilizar el asistente del SNE Chiapas.
`;

                    siguientePaso = "finalizado";

                    break;


                default:

                    respuesta =
                        "⚠️ Selecciona una opción del menú de actualización.";

                    siguientePaso =
                        "seleccionar_actualizacion";

                    tipoRespuesta = "menu_interactivo";
                    opcionesMenu =
                        obtenerOpcionesActualizacion();

                    break;
            }

            break;


        // =====================================
        // ACTUALIZAR CORREO
        // =====================================

        case "actualizar_correo": {

            if (
                seleccion === "menu_principal" ||
                seleccion === "6"
            ) {
                respuesta =
                    "Volvamos al menú principal.";

                siguientePaso = "menu";
                mostrarMenuPrincipal = true;

                break;
            }

            if (
                seleccion === "salir" ||
                seleccion === "7"
            ) {
                respuesta = `
👋 Gracias por utilizar el asistente del SNE Chiapas.
`;

                siguientePaso = "finalizado";

                break;
            }

            const correo = seleccion;

            if (!validarCorreo(correo)) {
                respuesta = `
⚠️ Escribe un correo electrónico válido.

Ejemplo:
usuario@gmail.com

También puedes elegir Menú principal o Finalizar atención en las opciones.
`;

                siguientePaso = "actualizar_correo";

                break;
            }

            await actualizarDatoUsuario(
                sesion,
                telefono,
                "correo",
                correo
            );

            respuesta = `✅ *Correo actualizado correctamente.*

📧 *Nuevo correo:*
${correo}`;

            siguientePaso = "menu";
            mostrarMenuPrincipal = true;

            break;
        }


        // =====================================
        // ACTUALIZAR CÓDIGO POSTAL
        // =====================================

        case "actualizar_codigo_postal": {

            if (
                seleccion === "menu_principal" ||
                seleccion === "6"
            ) {
                respuesta =
                    "Volvamos al menú principal.";

                siguientePaso = "menu";
                mostrarMenuPrincipal = true;

                break;
            }

            if (
                seleccion === "salir" ||
                seleccion === "7"
            ) {
                respuesta = `
👋 Gracias por utilizar el asistente del SNE Chiapas.
`;

                siguientePaso = "finalizado";

                break;
            }

            const codigoPostal = seleccion;

            if (!/^\d{5}$/.test(codigoPostal)) {
                respuesta = `
⚠️ El código postal debe contener exactamente 5 dígitos.

Ejemplo:
29000

También puedes elegir Menú principal o Finalizar atención en las opciones.
`;

                siguientePaso = "actualizar_codigo_postal";

                break;
            }

            await actualizarDatoUsuario(
                sesion,
                telefono,
                "codigo_postal",
                codigoPostal
            );

            respuesta = `✅ *Código postal actualizado correctamente.*

📮 *Nuevo código postal:*
${codigoPostal}`;

            siguientePaso = "menu";
            mostrarMenuPrincipal = true;

            break;
        }


        default:

            respuesta = `
⚠️ No se encontró un proceso de actualización válido.
`;

            siguientePaso = "menu";
            mostrarMenuPrincipal = true;

            break;
    }

    return {
        respuesta,
        siguientePaso,
        mostrarMenuPrincipal,
        tipoRespuesta,
        opcionesMenu
    };
}


module.exports = {
    procesarActualizacion
};
