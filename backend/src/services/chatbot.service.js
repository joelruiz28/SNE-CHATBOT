const {
    reiniciarSesion
} = require("./sesion.service");


const {
    procesarMenu
} = require("../flows/menu.flow");


const {
    procesarRegistro
} = require("../flows/registro.flow");


const {
    procesarActualizacion
} = require("../flows/actualizacion.flow");


const {
    procesarVacantes
} = require("../flows/vacantes.flow");


const {
    procesarPerfil
} = require("../flows/perfil.flow");


const {
    procesarFolio
} = require("../flows/folio.flow");


const {
    procesarPostulaciones
} = require("../flows/postulaciones.flow");


async function procesarMensaje(
    sesion,
    mensaje,
    telefono
) {

    let respuesta = "";

    let siguientePaso =
        sesion.paso_actual;


    let tipoRespuesta = null;
    let vacantes = null;
    let escolaridad = null;
    let municipio = null;
    let entidad = null;


    mensaje =
        String(mensaje ?? "").trim();


    const comando =
        mensaje.toLowerCase();


    if (
        comando === "7" ||
        comando === "salir" ||
        comando === "cancelar"
    ) {

        await reiniciarSesion(telefono);

        return {
            respuesta:
`👋 Gracias por utilizar el Asistente SNE.

Hasta pronto.`,

            siguientePaso: "finalizado"
        };

    }


    if (
        comando === "menu" ||
        comando === "inicio"
    ) {

        return {
            respuesta:
`👋 Bienvenido al Asistente SNE

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Registrar mis datos
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir`,

            siguientePaso: "menu"
        };

    }


    switch (sesion.paso_actual) {


        case "inicio":

            respuesta =
`👋 Hola, soy el asistente del SNE.

¿En qué puedo ayudarte?

1️⃣ Buscar vacantes
2️⃣ Registrar mis datos
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir`;

            siguientePaso = "menu";

            break;


        case "menu": {

            const resultado =
                await procesarMenu(
                    mensaje,
                    telefono,
                    sesion
                );

            respuesta =
                resultado.respuesta;

            siguientePaso =
                resultado.siguientePaso;

            break;
        }


        case "esperando_curp":
        case "esperando_codigo_seguridad":
        case "esperando_nombre":
        case "esperando_fecha":
        case "esperando_sexo":
        case "esperando_correo":
        case "esperando_codigo_postal": {

            const resultado =
                await procesarRegistro(
                    sesion,
                    mensaje,
                    telefono
                );

            respuesta =
                resultado.respuesta;

            siguientePaso =
                resultado.siguientePaso;

            break;
        }


        case "seleccionar_actualizacion":
        case "actualizar_correo":
        case "actualizar_codigo_postal": {

            const resultado =
                await procesarActualizacion(
                    sesion,
                    mensaje,
                    telefono
                );

            respuesta =
                resultado.respuesta;

            siguientePaso =
                resultado.siguientePaso;

            break;
        }


        case "confirmar_completar_perfil":
        case "esperando_colonia":
        case "esperando_carrera":
        case "esperando_experiencia":
        case "perfil_licencia":
        case "perfil_vehiculo":
        case "perfil_viajar":
        case "perfil_horario":
        case "perfil_sueldo": {

            const resultado =
                await procesarPerfil(
                    sesion,
                    mensaje,
                    telefono
                );

            respuesta =
                resultado.respuesta;

            siguientePaso =
                resultado.siguientePaso;

            break;
        }


        case "esperando_escolaridad":
        case "esperando_codigo_postal_busqueda":
        case "buscar_puesto":
        case "seleccionar_vacante":
        case "seleccionando_numero_vacante":
        case "detalle_vacante": {

            const resultado =
                await procesarVacantes(
                    sesion,
                    mensaje,
                    telefono
                );

            respuesta =
                resultado.respuesta;

            siguientePaso =
                resultado.siguientePaso;


            tipoRespuesta =
                resultado.tipoRespuesta || null;

            vacantes =
                resultado.vacantes || null;

            escolaridad =
                resultado.escolaridad || null;

            municipio =
                resultado.municipio || null;

            entidad =
                resultado.entidad || null;


            break;
        }


        case "postulaciones":
        case "seleccionar_postulacion":
        case "detalle_postulacion":
        case "informacion_postulacion": {

            const resultado =
                await procesarPostulaciones(
                    sesion,
                    mensaje,
                    telefono
                );

            respuesta =
                resultado.respuesta;

            siguientePaso =
                resultado.siguientePaso;

            break;
        }


        case "consultar_folio":
        case "folio_opciones":
        case "buscar_vacantes":
        case "opciones_vacantes":
        case "perfil_ya_completo": {

            const resultado =
                await procesarFolio(
                    sesion,
                    mensaje,
                    telefono
                );

            respuesta =
                resultado.respuesta;

            siguientePaso =
                resultado.siguientePaso;

            break;
        }


        case "finalizado":

            respuesta =
`👋 Esta conversación ha finalizado.

Escribe "inicio" para volver a comenzar.`;

            siguientePaso =
                "finalizado";

            break;


        default:

            respuesta =
`⚠️ No entendí tu mensaje.

Por favor, escribe "inicio" para volver al menú principal.`;

            siguientePaso =
                "menu";

            break;

    }


    return {
        respuesta,
        siguientePaso,

        tipoRespuesta,
        vacantes,
        escolaridad,
        municipio,
        entidad
    };

}


module.exports = {
    procesarMensaje
};