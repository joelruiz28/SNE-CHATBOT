const { reiniciarSesion } = require("./sesion.service");

const {
    procesarMenu,
    obtenerOpcionesMenu
} = require("../flows/menu.flow");
const { procesarRegistro } = require("../flows/registro.flow");
const { procesarActualizacion } = require("../flows/actualizacion.flow");
const { procesarVacantes } = require("../flows/vacantes.flow");
const { procesarPerfil } = require("../flows/perfil.flow");
const { procesarFolio } = require("../flows/folio.flow");
const { procesarPostulaciones } = require("../flows/postulaciones.flow");


async function obtenerResultadoMenu(telefono, sesion) {
    const resultado = await procesarMenu(
        "mostrar_menu",
        telefono,
        sesion
    );

    return {
        ...resultado,
        tipoRespuesta: "menu_interactivo",
        opcionesMenu: resultado.opcionesMenu ||
            obtenerOpcionesMenu(
                resultado.usuarioRegistrado === true
            )
    };
}



async function procesarMensaje(sesion, mensaje, telefono) {
    let respuesta = "";
    let siguientePaso = sesion.paso_actual;
    let usuarioRegistrado = false;


    let tipoRespuesta = null;
let opcionesMenu = null;
let mostrarMenuPrincipal = false;
let vacantes = null;
let escolaridad = null;
let municipio = null;
let entidad = null;

    mensaje = String(mensaje ?? "").trim();

    let comando = mensaje.toLowerCase();

    // Identificadores del menú interactivo de WhatsApp.
    
    // Identificadores de las opciones interactivas de WhatsApp.
    const opcionesMenuIds = {
        buscar_vacantes: "1",
        registrar_datos: "2",
        ver_mis_datos: "2",
        actualizar_datos: "3",
        mis_postulaciones: "4",
        hablar_asesor: "5",
        menu_principal: "6",
        salir: "7"
    };

    // Traducir las selecciones del menú a las opciones existentes.
    // Conserva la compatibilidad con quienes escriben números.
    if (
        sesion.paso_actual === "menu" &&
        Object.prototype.hasOwnProperty.call(
            opcionesMenuIds,
            comando
        )
    ) {
        mensaje = opcionesMenuIds[comando];
        comando = mensaje;
    }


    // Salir o cancelar.
    if (
        comando === "7" ||
        comando === "salir" ||
        comando === "cancelar"
    ) {
        await reiniciarSesion(telefono);

        return {
            respuesta: "👋 Gracias por utilizar el Asistente SNE.\n\nHasta pronto.",
            siguientePaso: "finalizado"
        };
    }

    
    // Mostrar el menú cuando se solicita explícitamente
    // o cuando el controlador inicia una nueva interacción.
    if (
        comando === "mostrar_menu" ||
        comando === "menu" ||
        comando === "menú" ||
        comando === "inicio" ||
        comando === "menu_principal" ||
        (
            sesion.paso_actual === "menu" &&
            comando === "6"
        )
    ) {
        return await obtenerResultadoMenu(telefono, sesion);
    }



    switch (sesion.paso_actual) {
        case "inicio": {
            return await obtenerResultadoMenu(telefono, sesion);
        }

        
        case "menu": {
            const resultado = await procesarMenu(
    mensaje,
    telefono,
    sesion
);

respuesta = resultado.respuesta;
siguientePaso = resultado.siguientePaso;
tipoRespuesta = resultado.tipoRespuesta || null;
opcionesMenu = resultado.opcionesMenu || null;
mostrarMenuPrincipal = resultado.mostrarMenuPrincipal === true;
vacantes = resultado.vacantes || null;
escolaridad = resultado.escolaridad || null;
municipio = resultado.municipio || null;
entidad = resultado.entidad || null;
usuarioRegistrado = resultado.usuarioRegistrado === true;

break;
        }


        case "esperando_curp":
        case "esperando_codigo_seguridad":
        case "esperando_nombre":
        case "esperando_fecha":
        case "esperando_sexo":
        case "esperando_correo":
        case "esperando_codigo_postal": {
            const resultado = await procesarRegistro(
                sesion,
                mensaje,
                telefono
            );

            respuesta = resultado.respuesta;
            siguientePaso = resultado.siguientePaso;
            break;
        }

        

case "seleccionar_actualizacion":
case "actualizar_correo":
case "actualizar_codigo_postal": {
    const resultado = await procesarActualizacion(
        sesion,
        mensaje,
        telefono
    );

    if (resultado.mostrarMenuPrincipal === true) {
        const menu = await obtenerResultadoMenu(
            telefono,
            { ...sesion, paso_actual: "menu" }
        );

        return {
            ...menu,
            respuesta: resultado.respuesta || menu.respuesta,
            siguientePaso: "menu",
            tipoRespuesta: "menu_interactivo",
            opcionesMenu: menu.opcionesMenu
        };
    }

    respuesta = resultado.respuesta;
    siguientePaso = resultado.siguientePaso;
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
            const resultado = await procesarPerfil(
                sesion,
                mensaje,
                telefono
            );

            respuesta = resultado.respuesta;
            siguientePaso = resultado.siguientePaso;
            break;
        }

        case "esperando_escolaridad":
case "esperando_codigo_postal_busqueda":
case "buscar_puesto":
case "seleccionar_vacante":
case "seleccionando_numero_vacante":
case "detalle_vacante": {
    const resultado = await procesarVacantes(
        sesion,
        mensaje,
        telefono
    );

    // Conservar la respuesta del flujo de vacantes.
    respuesta = resultado.respuesta;
    siguientePaso = resultado.siguientePaso;
    opcionesMenu = resultado.opcionesMenu || null;
    tipoRespuesta = resultado.tipoRespuesta || null;
    vacantes = resultado.vacantes || null;
    escolaridad = resultado.escolaridad || null;
    municipio = resultado.municipio || null;
    entidad = resultado.entidad || null;

    // Si el flujo solicita volver al menú principal,
    // utilizar el menú interactivo estándar.
    if (resultado.mostrarMenuPrincipal === true) {
        const menu = await obtenerResultadoMenu(
            telefono,
            { ...sesion, paso_actual: "menu" }
        );

        return {
            ...menu,
            respuesta: resultado.respuesta || menu.respuesta,
            siguientePaso: "menu",
            tipoRespuesta: "menu_interactivo",
            opcionesMenu: menu.opcionesMenu
        };
    }

    break;
}

        
case "postulaciones":
case "seleccionar_postulacion":
case "detalle_postulacion":
case "informacion_postulacion": {
    const resultado = await procesarPostulaciones(
        sesion,
        mensaje,
        telefono
    );

    // Si el flujo solicita volver al menú principal,
    // obtener el menú interactivo estándar.
    if (resultado.mostrarMenuPrincipal === true) {
        const menu = await obtenerResultadoMenu(
            telefono,
            { ...sesion, paso_actual: "menu" }
        );

        return {
            ...menu,
            respuesta: resultado.respuesta || menu.respuesta,
            siguientePaso: "menu",
            tipoRespuesta: "menu_interactivo",
            opcionesMenu: menu.opcionesMenu
        };
    }

    // Conservar todos los datos de la respuesta del flujo.
    respuesta = resultado.respuesta;
    siguientePaso = resultado.siguientePaso;
    tipoRespuesta = resultado.tipoRespuesta || null;
    opcionesMenu = resultado.opcionesMenu || null;
    usuarioRegistrado = resultado.usuarioRegistrado === true;

    break;
}


        case "consultar_folio":
        case "folio_opciones":
        case "buscar_vacantes":
        case "opciones_vacantes":
        case "perfil_ya_completo": {
            const resultado = await procesarFolio(
                sesion,
                mensaje,
                telefono
            );

            respuesta = resultado.respuesta;
            siguientePaso = resultado.siguientePaso;
            break;
        }

        case "finalizado": {
    return await obtenerResultadoMenu(
        telefono,
        { ...sesion, paso_actual: "menu" }
    );
}

        default: {
            respuesta =
                '⚠️ No entendí tu mensaje.\n\nPor favor, escribe "inicio" para volver al menú principal.';

            siguientePaso = "menu";
            break;
        }
    }

    return {
    respuesta,
    siguientePaso,
    tipoRespuesta,
    opcionesMenu,
    mostrarMenuPrincipal,
    vacantes,
    escolaridad,
    municipio,
    entidad,
    usuarioRegistrado
};
}

module.exports = {
    procesarMensaje
};

