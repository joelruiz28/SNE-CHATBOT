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

function obtenerMenuPrincipal(usuarioRegistrado) {

    if (usuarioRegistrado) {

        return `
👋 *Menú principal*

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;
    }

    return `
👋 *¡Bienvenido al Sistema Nacional de Empleo!*

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Registrar mis datos
`;
}


function obtenerMenuInvalido(usuarioRegistrado) {

    if (usuarioRegistrado) {

        return `
⚠️ *Selecciona una opción válida.*

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;
    }

    return `
⚠️ *Selecciona una opción válida.*

1️⃣ Buscar vacantes
2️⃣ Registrar mis datos
`;
}


async function procesarMenu(
    mensaje,
    telefono,
    sesion
) {

    let respuesta = "";
    let siguientePaso = "menu";

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



            respuesta = `
🔎 *Buscar vacantes*

Para mostrarte las vacantes más cercanas a tu ubicación, primero necesitamos conocer tu nivel de estudios.

🎓 Selecciona una opción:

1️⃣ Primaria
2️⃣ Secundaria
3️⃣ Preparatoria o vocacional
4️⃣ Licenciatura

6️⃣ Menú principal
7️⃣ Salir
`;

            siguientePaso =
                "esperando_escolaridad";

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
${usuarioActual.folio || "Aún no asignado"}

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Buscar vacantes
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "menu";

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

                siguientePaso =
                    "menu";

                break;
            }


            console.log(
                "✏️ Usuario encontrado para actualización."
            );

            console.log(
                "🆔 ID:",
                usuarioActual.id
            );


            respuesta = `
✏️ *¿Qué dato deseas actualizar?*

1️⃣ Correo
2️⃣ Código postal

6️⃣ Menú principal
7️⃣ Salir
`;

            siguientePaso =
                "seleccionar_actualizacion";

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


    const resultado =
        await mostrarListadoPostulaciones(
            sesion,
            telefono
        );


    respuesta =
        resultado.respuesta;


    siguientePaso =
        resultado.siguientePaso;


    break;
}




        case "5":

            respuesta = `
👨‍💼 Un asesor se pondrá en contacto contigo.
`;

            siguientePaso =
                "asesor";

            break;


        case "6":

    respuesta =
        obtenerMenuPrincipal(usuarioRegistrado);

    siguientePaso =
        "menu";

    break;


        case "7":

            respuesta = `
👋 Gracias por utilizar el asistente SNE.
`;

            siguientePaso =
                "finalizado";

            break;


        default:

    respuesta =
        obtenerMenuInvalido(usuarioRegistrado);

    siguientePaso =
        "menu";

    break;

    }


    return {
        respuesta,
        siguientePaso
    };
}


module.exports = {
    procesarMenu
};