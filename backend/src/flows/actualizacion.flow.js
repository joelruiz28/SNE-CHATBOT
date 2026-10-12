const {
    actualizarDato,
    actualizarDatoPorId
} = require("../services/buscador.service");

const {
    validarCorreo
} = require("../utils/validaciones");




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


    if (
        seguridadVerificada &&
        usuarioAutorizadoId
    ) {

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

    let siguientePaso =
        sesion.paso_actual;


    switch (sesion.paso_actual) {

        case "seleccionar_actualizacion":

            switch (mensaje) {

                // =====================================
                // CORREO
                // =====================================

                case "1":

                    respuesta = `
📧 Escribe tu nuevo correo electrónico.

Ejemplo:
usuario@gmail.com

6️⃣ Menú principal
7️⃣ Salir
`;

                    siguientePaso =
                        "actualizar_correo";

                    break;


                // =====================================
                // CÓDIGO POSTAL
                // =====================================

                case "2":

                    respuesta = `
📮 Escribe tu nuevo código postal.

Debe contener 5 dígitos.

Ejemplo:
29000

6️⃣ Menú principal
7️⃣ Salir
`;

                    siguientePaso =
                        "actualizar_codigo_postal";

                    break;


                case "6":

                    respuesta = `
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

                    respuesta = `
⚠️ Selecciona una opción válida.

1️⃣ Correo
2️⃣ Código postal
6️⃣ Menú principal
7️⃣ Salir
`;

                    siguientePaso =
                        "seleccionar_actualizacion";

                    break;
            }

            break;


        case "actualizar_correo":


            if (mensaje === "6") {
    respuesta = `📋 *MENÚ PRINCIPAL*

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir`;

    siguientePaso = "menu";
    break;
}


            if (mensaje === "7") {

                respuesta = `
👋 Gracias por utilizar el asistente SNE.
`;

                siguientePaso =
                    "finalizado";

                break;
            }

            if (!validarCorreo(mensaje.trim())) {

                respuesta = `
⚠️ Escribe un correo válido.

Ejemplo:
usuario@gmail.com

6️⃣ Menú principal
7️⃣ Salir
`;

                break;
            }


            await actualizarDatoUsuario(
                sesion,
                telefono,
                "correo",
                mensaje.trim()
            );


            respuesta = `
✅ Correo actualizado correctamente.

📧 Nuevo correo:
${mensaje.trim()}

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;

siguientePaso =
    "menu";

            break;

        case "actualizar_codigo_postal":


            if (mensaje === "6") {

                respuesta = `
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

                siguientePaso =
                    "menu";

                break;
            }



            if (mensaje === "7") {

                respuesta = `
👋 Gracias por utilizar el asistente SNE.
`;

                siguientePaso =
                    "finalizado";

                break;
            }


            const codigoPostal =
                mensaje.trim();


            if (!/^\d{5}$/.test(codigoPostal)) {

                respuesta = `
⚠️ El código postal debe contener exactamente 5 dígitos.

Ejemplo:
29000

6️⃣ Menú principal
7️⃣ Salir
`;

                break;
            }


            await actualizarDatoUsuario(
                sesion,
                telefono,
                "codigo_postal",
                codigoPostal
            );


            respuesta = `
✅ Código postal actualizado correctamente.

📮 Nuevo código postal:
${codigoPostal}

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;

siguientePaso =
    "menu";

            break;

        default:

            respuesta = `
⚠️ No se encontró un proceso de actualización válido.
`;

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
    procesarActualizacion
};