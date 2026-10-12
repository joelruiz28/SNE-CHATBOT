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


async function obtenerUsuarioSesion(sesion, telefono) {

    const datosTemporales =
        sesion?.datos_temporales || {};

    const seguridadVerificada =
        datosTemporales.seguridad_verificada === true;

    const usuarioAutorizadoId =
        datosTemporales.usuario_autorizado_id;


    if (
        seguridadVerificada &&
        usuarioAutorizadoId
    ) {

        return await obtenerBuscadorPorId(
            usuarioAutorizadoId
        );

    }


    return await obtenerBuscadorPorTelefono(
        telefono
    );
}

async function mostrarListadoPostulaciones(
    sesion,
    telefono
) {

    const inicioProceso = Date.now();


    console.log(
        "📋 Consultando Mis postulaciones..."
    );

    const inicioUsuario = Date.now();

    const usuario =
        await obtenerUsuarioSesion(
            sesion,
            telefono
        );


    console.log(
        `⏱️ Buscar usuario: ${
            Date.now() - inicioUsuario
        } ms`
    );

    if (!usuario) {

        return {

            respuesta:
`⚠️ No encontramos tus datos registrados.

Primero debes registrar tus datos.`,

            siguientePaso: "menu"

        };

    }

    const inicioPostulaciones = Date.now();

    const postulaciones =
        await obtenerPostulacionesPorBuscador(
            usuario.id
        );


    console.log(
        `⏱️ Buscar postulaciones: ${
            Date.now() - inicioPostulaciones
        } ms`
    );


    console.log(
        `📋 Postulaciones encontradas: ${
            postulaciones.length
        }`
    );


    console.log(
        `⏱️ Tiempo total Mis postulaciones: ${
            Date.now() - inicioProceso
        } ms`
    );



    if (!postulaciones.length) {

        return {

            respuesta:
`📋 *MIS POSTULACIONES*

No tienes postulaciones registradas actualmente.

Puedes buscar vacantes para realizar una postulación.

Escribe *menu* para volver.`,

            siguientePaso: "postulaciones"

        };

    }


    let lista =
`📋 *MIS POSTULACIONES*

_Tienes ${postulaciones.length} postulaciones activas_

`;


    postulaciones.forEach(
        (postulacion, indice) => {

            let estado = "🟡";


            if (
                postulacion.estado === "aceptada"
            ) {

                estado = "🟢";

            }


            if (
                postulacion.estado === "rechazada" ||
                postulacion.estado === "cancelada"
            ) {

                estado = "🔴";

            }


            lista +=
`${indice + 1}️⃣ ${postulacion.puesto} ${estado}
`;

        }
    );


    lista +=
`
Responde el número para consultar.

Escribe *menu* para volver.`;


    return {

        respuesta: lista,

        siguientePaso:
            "seleccionar_postulacion"

    };

}


async function procesarPostulaciones(
    sesion,
    mensaje,
    telefono
) {

    // Normalizamos el mensaje
    mensaje = String(mensaje ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");


    if (
        mensaje === "menu" ||
        mensaje === "inicio"
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


    if (
        sesion.paso_actual === "postulaciones"
    ) {

        return await mostrarListadoPostulaciones(
            sesion,
            telefono
        );

    }


    if (
        sesion.paso_actual ===
        "seleccionar_postulacion"
    ) {

        const usuario =
            await obtenerUsuarioSesion(
                sesion,
                telefono
            );


        if (!usuario) {

            return {

                respuesta:
`⚠️ No encontramos tus datos registrados.

Escribe *menu* para volver.`,

                siguientePaso: "menu"

            };

        }


        const postulaciones =
            await obtenerPostulacionesPorBuscador(
                usuario.id
            );


        const numero =
            parseInt(mensaje, 10);


        if (
            isNaN(numero) ||
            numero < 1 ||
            numero > postulaciones.length
        ) {

            return {

                respuesta:
`⚠️ *Selecciona una postulación válida.*

Responde con el número de la postulación que deseas consultar.

Escribe *menu* para volver.`,

                siguientePaso:
                    "seleccionar_postulacion"

            };

        }


        const postulacion =
            postulaciones[numero - 1];


        await actualizarDatosTemporales(
            telefono,
            {
                postulacion_seleccionada:
                    postulacion.id
            }
        );


        const iconoEstado =
            postulacion.estado === "aceptada"
                ? "🟢"
                : postulacion.estado === "rechazada"
                    ? "🔴"
                    : "🟡";


        const estado =
            postulacion.estado ||
            "En revisión";


        const fecha =
            postulacion.fecha_postulacion
                ? new Date(
                    postulacion.fecha_postulacion
                ).toLocaleDateString("es-MX")
                : "No disponible";


        return {

            respuesta:
`📋 *${postulacion.puesto}*

🏢 ${postulacion.empresa}

${iconoEstado} *${estado}*

📅 Postulación: ${fecha}

¿Qué deseas hacer?

1️⃣ Cancelar postulación
2️⃣ Ver más datos
3️⃣ Regresar`,

            siguientePaso:
                "detalle_postulacion"

        };

    }


    if (
        sesion.paso_actual ===
        "detalle_postulacion"
    ) {

        const datosTemporales =
            sesion?.datos_temporales || {};


        const postulacionId =
            datosTemporales.postulacion_seleccionada;


        if (!postulacionId) {

            return {

                respuesta:
`⚠️ No se pudo identificar la postulación.

Escribe *menu* para volver.`,

                siguientePaso: "menu"

            };

        }


        if (mensaje === "1") {

            return {

                respuesta:
`⚠️ La cancelación de la postulación todavía no está habilitada.

Selecciona otra opción.

1️⃣ Cancelar postulación
2️⃣ Ver más datos
3️⃣ Regresar`,

                siguientePaso:
                    "detalle_postulacion"

            };

        }


        if (mensaje === "2") {

            const datos =
                await obtenerDatosComprobante(
                    postulacionId
                );


            if (!datos) {

                return {

                    respuesta:
`⚠️ No encontramos la información de esta postulación.

Escribe *menu* para volver.`,

                    siguientePaso: "menu"

                };

            }


            const iconoEstado =
                datos.estado === "aceptada"
                    ? "🟢"
                    : datos.estado === "rechazada"
                        ? "🔴"
                        : "🟡";


            const estado =
                datos.estado ||
                "En revisión";


            const fecha =
                datos.fecha_postulacion
                    ? new Date(
                        datos.fecha_postulacion
                    ).toLocaleDateString(
                        "es-MX"
                    )
                    : "una fecha no disponible";


            return {

                respuesta:
`💼 *${datos.puesto}*

🏢 ${datos.empresa}

📍 ${datos.municipio_vacante}, ${datos.entidad}

💰 ${datos.salario || "No especificado"}

🕒 ${datos.experiencia || "No especificada"}

🔖 Folio: ${datos.folio_oferta}

${iconoEstado} *${estado} desde el ${fecha}*

1️⃣ Cancelar postulación
2️⃣ Regresar`,

                siguientePaso:
                    "informacion_postulacion"

            };

        }



        if (mensaje === "3") {

            return await mostrarListadoPostulaciones(
                sesion,
                telefono
            );

        }


        return {

            respuesta:
`⚠️ *Selecciona una opción válida.*

1️⃣ Cancelar postulación
2️⃣ Ver más datos
3️⃣ Regresar`,

            siguientePaso:
                "detalle_postulacion"

        };

    }



    if (
        sesion.paso_actual ===
        "informacion_postulacion"
    ) {


        if (mensaje === "1") {

            return {

                respuesta:
`⚠️ La cancelación de la postulación todavía no está habilitada.

1️⃣ Cancelar postulación
2️⃣ Regresar`,

                siguientePaso:
                    "informacion_postulacion"

            };

        }


        if (mensaje === "2") {

            return await mostrarListadoPostulaciones(
                sesion,
                telefono
            );

        }


        return {

            respuesta:
`⚠️ *Selecciona una opción válida.*

1️⃣ Cancelar postulación
2️⃣ Regresar`,

            siguientePaso:
                "informacion_postulacion"

        };

    }

    return {

        respuesta:
`⚠️ No se pudo abrir Mis postulaciones.

Escribe *menu* para volver.`,

        siguientePaso: "menu"

    };

}


module.exports = {

    procesarPostulaciones,

    mostrarListadoPostulaciones

};