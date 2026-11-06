const {
    obtenerBuscadorPorTelefono,
    obtenerBuscadorPorId
} = require("../services/buscador.service");

const {
    mostrarListadoPostulaciones
} = require("./postulaciones.flow");

const {
    actualizarDatosTemporales
} = require("../services/sesion.service");

const {
    obtenerOpcionesActualizacion
} = require("../utils/opciones-actualizacion");


function obtenerOpcionesMenu(usuarioRegistrado) {
    const opcionesRegistrado = [
        {
            id: "buscar_vacantes",
            title: "🔎 Buscar vacantes",
            description: "Encuentra oportunidades laborales"
        },
        {
            id: "ver_mis_datos",
            title: "👤 Mi perfil",
            description: "Consulta tus datos registrados"
        },
        {
            id: "actualizar_datos",
            title: "✏️ Actualizar mis datos",
            description: "Mantén tu perfil actualizado"
        },
        {
            id: "mis_postulaciones",
            title: "📋 Mis postulaciones",
            description: "Consulta tus solicitudes"
        },
        {
            id: "hablar_asesor",
            title: "💬 Atención personalizada",
            description: "Solicita apoyo de un asesor"
        },
        {
            id: "menu_principal",
            title: "🏠 Menú principal",
            description: "Consulta los servicios disponibles"
        },
        {
            id: "salir",
            title: "👋 Finalizar atención",
            description: "Termina la conversación"
        }
    ];

    const opcionesNoRegistrado = [
        {
            id: "buscar_vacantes",
            title: "🔎 Buscar vacantes",
            description: "Consulta oportunidades laborales"
        },
        {
            id: "registrar_datos",
            title: "📝 Registrar mis datos",
            description: "Crea tu perfil en el SNE"
        },
        {
            id: "salir",
            title: "👋 Finalizar atención",
            description: "Termina la conversación"
        }
    ];

    return usuarioRegistrado
        ? opcionesRegistrado
        : opcionesNoRegistrado;
}


function obtenerPrimerDatoFaltante(usuario) {

    if (!usuario.nombre_completo?.trim()) {
        return "nombre";
    }

    if (!usuario.fecha_nacimiento) {
        return "fecha";
    }

    if (!usuario.sexo?.trim()) {
        return "sexo";
    }

    if (!usuario.correo?.trim()) {
        return "correo";
    }

    if (!usuario.codigo_postal?.trim()) {
        return "codigo_postal";
    }

    return null;
}


function obtenerPasoYMensajeDatoFaltante(usuario) {

    const datoFaltante =
        obtenerPrimerDatoFaltante(usuario);

    switch (datoFaltante) {

        case "nombre":

            return {
                siguientePaso: "esperando_nombre",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

👤 Solo falta tu nombre completo.

Por favor, escribe tu nombre completo:
`
            };


        case "fecha":

            return {
                siguientePaso: "esperando_fecha",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

🎂 Solo falta tu fecha de nacimiento.

Ejemplo:

08 de noviembre de 2003
`
            };


        case "sexo":

            return {
                siguientePaso: "esperando_sexo",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

⚧️ Solo falta registrar tu sexo.

Selecciona una opción:

1️⃣ Hombre
2️⃣ Mujer
`
            };


        case "correo":

            return {
                siguientePaso: "esperando_correo",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

📧 Solo falta tu correo electrónico.

Escribe tu correo:
`
            };


        case "codigo_postal":

            return {
                siguientePaso: "esperando_codigo_postal",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

📮 Solo falta tu código postal.

Escribe tu código postal:

Ejemplo:

29000
`
            };


        default:

            return {
                siguientePaso: "menu",
                respuesta: `
✅ Tu perfil ya está completo.
`
            };
    }
}




async function procesarMenu(
    mensaje,
    telefono,
    sesion
) {

    let respuesta = "";
    let siguientePaso = "menu";
    let tipoRespuesta = null;
    let opcionesMenu = null;

    const datosTemporales =
        sesion?.datos_temporales || {};

    const seguridadVerificada =
        datosTemporales.seguridad_verificada === true;

    const usuarioAutorizadoId =
        datosTemporales.usuario_autorizado_id;





    let usuarioActual = null;

    if (
        seguridadVerificada &&
        usuarioAutorizadoId
    ) {

        console.log(
            "🔐 Usuario autorizado detectado."
        );

        console.log(
            "🆔 ID autorizado:",
            usuarioAutorizadoId
        );

        usuarioActual =
            await obtenerBuscadorPorId(
                usuarioAutorizadoId
            );

    } else {

        console.log(
            "📱 Buscando usuario mediante teléfono:",
            telefono
        );

        usuarioActual =
            await obtenerBuscadorPorTelefono(
                telefono
            );
    }


    const usuarioRegistrado =
        usuarioActual !== null;



    switch (mensaje) {
        case "mostrar_menu": {
    respuesta = "Selecciona el servicio que deseas consultar.";
    siguientePaso = "menu";
    tipoRespuesta = "menu_interactivo";
    opcionesMenu = obtenerOpcionesMenu(usuarioRegistrado);
    break;
}



        case "1": {



            if (usuarioRegistrado) {

                console.log(
                    "🔎 Usuario encontrado para buscar vacantes."
                );

                console.log(
                    "🆔 ID:",
                    usuarioActual.id
                );

                console.log(
                    "📋 Perfil completo:",
                    usuarioActual.perfil_completo
                );


                if (usuarioActual.perfil_completo !== true) {

    console.log(
        "⚠️ El perfil está incompleto."
    );

    console.log(
        "🔄 Detectando exactamente qué dato falta..."
    );


    const datoFaltante =
        obtenerPrimerDatoFaltante(usuarioActual);


    console.log(
        "📋 Dato faltante:",
        datoFaltante
    );


    datosTemporales.curp =
        usuarioActual.curp;

    datosTemporales.usuario_existente_id =
        usuarioActual.id;

    datosTemporales.completando_perfil =
        true;



    await actualizarDatosTemporales(
        telefono,
        datosTemporales
    );


    const siguiente =
        obtenerPasoYMensajeDatoFaltante(
            usuarioActual
        );


    respuesta =
        siguiente.respuesta;

    siguientePaso =
        siguiente.siguientePaso;


    break;
}

   

                if (!usuarioActual.codigo_postal) {

                    respuesta = `
⚠️ *No tienes un código postal registrado.*

Para poder mostrarte vacantes cercanas necesitamos conocer tu ubicación.

Primero actualiza tu código postal.
`;

                    siguientePaso =
                        "menu";

                    break;
                }

            }



            
respuesta = "🔎 Buscar vacantes\n\n🎓 Selecciona tu último grado de estudios.";

siguientePaso = "esperando_escolaridad";
tipoRespuesta = "menu_interactivo";

opcionesMenu = [
    {
        id: "1",
        title: "📚 Primaria",
        description: "Educación primaria"
    },
    {
        id: "2",
        title: "📘 Secundaria",
        description: "Educación secundaria"
    },
    {
        id: "3",
        title: "🎓 Preparatoria",
        description: "Preparatoria o vocacional"
    },
    {
        id: "4",
        title: "🎓 Licenciatura",
        description: "Estudios universitarios"
    }
];

break;

        }



        case "2": {



            if (usuarioRegistrado) {

                console.log(
                    "👤 Usuario encontrado."
                );

                console.log(
                    "🆔 ID:",
                    usuarioActual.id
                );

                console.log(
                    "📋 Perfil completo:",
                    usuarioActual.perfil_completo
                );



                if (usuarioActual.perfil_completo !== true) {

    console.log(
        "⚠️ El usuario existe pero su perfil está incompleto."
    );

    console.log(
        "🔄 Detectando exactamente qué dato falta..."
    );


    const datoFaltante =
        obtenerPrimerDatoFaltante(usuarioActual);


    console.log(
        "📋 Dato faltante:",
        datoFaltante
    );


    datosTemporales.curp =
        usuarioActual.curp;

    datosTemporales.usuario_existente_id =
        usuarioActual.id;

    datosTemporales.completando_perfil =
        true;


    await actualizarDatosTemporales(
        telefono,
        datosTemporales
    );


    const siguiente =
        obtenerPasoYMensajeDatoFaltante(
            usuarioActual
        );


    respuesta =
        siguiente.respuesta;

    siguientePaso =
        siguiente.siguientePaso;


    break;
}




                console.log(
                    "✅ Perfil completo. Mostrando datos."
                );


                respuesta = `
👤 *Mis datos*

📄 *CURP:*
${usuarioActual.curp || "No registrada"}

👤 *Nombre:*
${usuarioActual.nombre_completo || "No registrado"}

🎂 *Fecha de nacimiento:*
${
    usuarioActual.fecha_nacimiento
        ? new Date(
            usuarioActual.fecha_nacimiento
        ).toLocaleDateString("es-MX")
        : "No registrada"
}

⚧️ *Género:*
${usuarioActual.sexo || "No registrado"}

📱 *WhatsApp registrado:*
${usuarioActual.telefono || "No registrado"}

📧 *Correo:*
${usuarioActual.correo || "No registrado"}

📮 *Código postal:*
${usuarioActual.codigo_postal || "No registrado"}

📄 *Folio:*
${usuarioActual.folio || "Aún no asignado"}`;

siguientePaso = "menu";
tipoRespuesta = "menu_interactivo";
opcionesMenu = obtenerOpcionesMenu(true);

break;
            }



            else {

                respuesta = `
Perfecto 👍

Vamos a registrar tus datos.

Primero necesitamos verificar si ya estás registrado en el Sistema Nacional de Empleo.

¿Cuál es tu CURP?
`;

                siguientePaso =
                    "esperando_curp";

                break;
            }
        }


        
case "3": {

    if (!usuarioRegistrado) {
        respuesta = `
⚠️ No encontramos ningún registro asociado a este número.

Primero debes registrar tus datos.
`;
        siguientePaso = "menu";
        break;
    }

    console.log(
        "✏️ Usuario encontrado para actualización."
    );

    console.log(
        "🆔 ID:",
        usuarioActual.id
    );

    respuesta =
        "✏️ Selecciona el dato que deseas actualizar.";

    siguientePaso = "seleccionar_actualizacion";
    tipoRespuesta = "menu_interactivo";
    opcionesMenu = obtenerOpcionesActualizacion();

    break;
}



case "4": {

    if (!usuarioRegistrado) {

        respuesta = `
⚠️ No encontramos ningún registro asociado a este número.

Primero debes registrar tus datos.
`;

        siguientePaso = "menu";

        break;
    }

    console.log(
        "📋 Abriendo Mis postulaciones directamente..."
    );

    const resultado = await mostrarListadoPostulaciones(
        sesion,
        telefono
    );

    respuesta = resultado.respuesta;
    siguientePaso = resultado.siguientePaso;
    tipoRespuesta = resultado.tipoRespuesta || null;
    opcionesMenu = resultado.opcionesMenu || null;

    mostrarMenuPrincipal =
        resultado.mostrarMenuPrincipal === true;

    break;
}




        case "5":

            respuesta = `
👨‍💼 Un asesor se pondrá en contacto contigo.
`;

            siguientePaso =
                "asesor";

            break;



        case "6": {
            respuesta = "Volvamos al menú principal.";
            siguientePaso = "menu";
            tipoRespuesta = "menu_principal";
            break;
        }

        case "7": {
            respuesta = `
👋 Gracias por utilizar el asistente SNE.
`;
            siguientePaso = "finalizado";
            break;
        }

        default: {
            respuesta = "⚠️ No reconocí esa opción. Selecciona una opción del menú.";
            siguientePaso = "menu";
            tipoRespuesta = "menu_principal";
            break;
        }
    }

    return {
        respuesta,
        siguientePaso,
        tipoRespuesta,
        opcionesMenu,
        usuarioRegistrado
    };
}

module.exports = {
    procesarMenu,
    obtenerOpcionesMenu
};
