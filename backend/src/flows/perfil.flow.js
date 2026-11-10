const {
    actualizarDato,
    completarPerfil,
    generarFolio
} = require("../services/buscador.service");

const {
    respuestaSiNo,
    horario
} = require("../utils/catalogos");

const {
    generarMenu
} = require("../utils/menu");


async function procesarPerfil(
    sesion,
    mensaje,
    telefono
) {

    let respuesta = "";
    let siguientePaso = sesion.paso_actual;


    switch (sesion.paso_actual) {


        case "confirmar_completar_perfil":

            if (mensaje === "1") {

                respuesta = `Perfecto 👍

¿Cuál es tu correo electrónico?`;

                siguientePaso = "esperando_correo";

            } else if (mensaje === "2") {

                respuesta = `De acuerdo.

Regresando al menú principal.`;

                siguientePaso = "menu_principal";

            } else {

                respuesta = `⚠️ Selecciona una opción válida.

1️⃣ Sí
2️⃣ No`;
            }

            break;


        case "esperando_correo":

            if (
                !mensaje.includes("@") ||
                !mensaje.includes(".")
            ) {

                respuesta =
                    "⚠️ Escribe un correo electrónico válido.\n\nEjemplo:\nusuario@gmail.com";

            } else {

                await actualizarDato(
                    telefono,
                    "correo",
                    mensaje
                );

                respuesta = `✅ Correo registrado.

¿Cuál es tu colonia?`;

                siguientePaso = "esperando_colonia";
            }

            break;


        // ==========================================
        // COLONIA
        // ==========================================

        case "esperando_colonia":

            if (mensaje.length < 3) {

                respuesta =
                    "⚠️ Escribe una colonia válida.";

            } else {

                await actualizarDato(
                    telefono,
                    "colonia",
                    mensaje
                );

                respuesta = `✅ Colonia registrada.

¿Cuál es tu carrera o profesión?`;

                siguientePaso = "esperando_carrera";
            }

            break;


        // ==========================================
        // CARRERA
        // ==========================================

        case "esperando_carrera":

            if (mensaje.length < 2) {

                respuesta =
                    "⚠️ Escribe una carrera o profesión válida.";

            } else {

                await actualizarDato(
                    telefono,
                    "carrera",
                    mensaje
                );

                respuesta = `✅ Carrera registrada.

Cuéntame tu experiencia laboral.`;

                siguientePaso =
                    "esperando_experiencia";
            }

            break;


        // ==========================================
        // EXPERIENCIA
        // ==========================================

        case "esperando_experiencia":

            if (mensaje.length < 5) {

                respuesta =
                    "⚠️ Escribe una descripción más detallada de tu experiencia.";

            } else {

                await actualizarDato(
                    telefono,
                    "experiencia",
                    mensaje
                );

                respuesta = `✅ Experiencia registrada.

¿Tienes licencia de conducir?

1️⃣ Sí
2️⃣ No`;

                siguientePaso = "perfil_licencia";
            }

            break;


        // ==========================================
        // LICENCIA
        // ==========================================

        case "perfil_licencia":

            if (respuestaSiNo[mensaje]) {

                await actualizarDato(
                    telefono,
                    "licencia_conducir",
                    mensaje === "1"
                );

                respuesta = `✅ Licencia registrada: ${respuestaSiNo[mensaje]}

¿Tienes vehículo propio?

1️⃣ Sí
2️⃣ No`;

                siguientePaso =
                    "perfil_vehiculo";

            } else {

                respuesta = `⚠️ Selecciona una opción válida.

1️⃣ Sí
2️⃣ No`;
            }

            break;


        // ==========================================
        // VEHÍCULO
        // ==========================================

        case "perfil_vehiculo":

            if (respuestaSiNo[mensaje]) {

                await actualizarDato(
                    telefono,
                    "vehiculo_propio",
                    mensaje === "1"
                );

                respuesta = `✅ Vehículo registrado: ${respuestaSiNo[mensaje]}

¿Tienes disponibilidad para viajar?

1️⃣ Sí
2️⃣ No`;

                siguientePaso = "perfil_viajar";

            } else {

                respuesta = `⚠️ Selecciona una opción válida.

1️⃣ Sí
2️⃣ No`;
            }

            break;


        // ==========================================
        // DISPONIBILIDAD PARA VIAJAR
        // ==========================================

        case "perfil_viajar":

            if (respuestaSiNo[mensaje]) {

                await actualizarDato(
                    telefono,
                    "disponibilidad_viajar",
                    mensaje === "1"
                );

                respuesta = `✅ Disponibilidad registrada: ${respuestaSiNo[mensaje]}

¿Cuál es tu horario disponible?

${generarMenu(horario)}`;

                siguientePaso = "perfil_horario";

            } else {

                respuesta = `⚠️ Selecciona una opción válida.

1️⃣ Sí
2️⃣ No`;
            }

            break;


        // ==========================================
        // HORARIO
        // ==========================================

        case "perfil_horario":

            if (horario[mensaje]) {

                await actualizarDato(
                    telefono,
                    "horario",
                    horario[mensaje]
                );

                respuesta = `✅ Horario registrado: ${horario[mensaje]}

¿Cuál es tu sueldo esperado?

Ejemplo:
$15,000 MXN`;

                siguientePaso = "perfil_sueldo";

            } else {

                respuesta = `⚠️ Selecciona una opción válida:

${generarMenu(horario)}`;
            }

            break;


        // ==========================================
        // SUELDO Y FINALIZAR PERFIL
        // ==========================================

        case "perfil_sueldo": {

            const sueldoLimpio =
                mensaje.replace(/[^0-9]/g, "");

            if (sueldoLimpio.length < 3) {

                respuesta =
                    "⚠️ Escribe un sueldo válido.\n\nEjemplo:\n$15,000 MXN";

            } else {

                await actualizarDato(
                    telefono,
                    "sueldo_deseado",
                    mensaje
                );

                await completarPerfil(telefono);

                const folio =
                    await generarFolio(telefono);

                respuesta = `🎉 ¡Perfil completado exitosamente!

📄 Tu folio: ${folio}

Tu perfil está al 100% y ahora tienes mayores oportunidades de encontrar el empleo ideal.

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Menú principal`;

                siguientePaso = "menu_principal";
            }

            break;
        }


        default:

            respuesta =
                "⚠️ No entendí esa opción.";

            break;
    }


    return {
        respuesta,
        siguientePaso
    };
}


module.exports = {
    procesarPerfil
};