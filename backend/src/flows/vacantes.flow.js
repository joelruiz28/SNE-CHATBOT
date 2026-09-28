const {
    buscarVacantes,
    obtenerVacantePorId
} = require("../services/vacante.service");

const {
    obtenerUbicacionPorCodigoPostal,
    ordenarPorProximidad
} = require("../services/ubicacion.service");

const {
    actualizarDatosTemporales
} = require("../services/sesion.service");

const {
    crearPostulacion,
    obtenerDatosComprobante
} = require("../services/postulacion.service");

const {
    generarComprobantePostulacion
} = require("../services/comprobante.service");

const {
    subirDocumentoWhatsApp,
    enviarDocumentoWhatsApp
} = require("../services/whatsapp.service");

const db = require("../config/database");


async function procesarVacantes(
    sesion,
    mensaje,
    telefono
) {

    let respuesta = "";
    let siguientePaso = sesion.paso_actual;

    const datosTemporales =
        sesion.datos_temporales || {};

    // Datos para respuesta interactiva de WhatsApp
    let tipoRespuesta = null;
    let vacantesRespuesta = null;
    let escolaridadRespuesta = null;
    let municipioRespuesta = null;
    let entidadRespuesta = null;


    // Normalizar mensaje
    mensaje = String(mensaje || "")
        .trim()
        .toLowerCase();


    switch (sesion.paso_actual) {


        case "esperando_escolaridad": {

            // Menú principal
            if (mensaje === "6") {

                respuesta = `
📋 *MENÚ PRINCIPAL*

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Consultar mi folio
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso = "menu";
                break;
            }


            // Salir
            if (mensaje === "7") {

                respuesta = `
👋 Gracias por utilizar el Sistema Nacional de Empleo.

Cuando necesites nuevamente nuestros servicios, aquí estaremos.

¡Hasta pronto!
`;

                siguientePaso = "finalizado";
                break;
            }


            let escolaridad = "";


            switch (mensaje) {

                case "1":
                    escolaridad = "Primaria";
                    break;

                case "2":
                    escolaridad = "Secundaria";
                    break;

                case "3":
                    escolaridad =
                        "Preparatoria o vocacional";
                    break;

                case "4":
                    escolaridad = "Licenciatura";
                    break;

                default:

                    respuesta = `
⚠️ *Selecciona una opción válida.*

🎓 Nivel de estudios:

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


            if (!escolaridad) {
                break;
            }


            datosTemporales.escolaridad =
                escolaridad;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            let codigoPostal =
                datosTemporales.codigo_postal;


            if (!codigoPostal) {

                let usuario = null;


                if (
                    datosTemporales.usuario_autorizado_id
                ) {

                    const resultado =
                        await db.query(
                            `
                            SELECT
                                id,
                                codigo_postal
                            FROM buscadores_empleo
                            WHERE id = $1
                            LIMIT 1
                            `,
                            [
                                datosTemporales
                                    .usuario_autorizado_id
                            ]
                        );

                    usuario =
                        resultado.rows[0] || null;

                } else {

                    const resultado =
                        await db.query(
                            `
                            SELECT
                                id,
                                codigo_postal
                            FROM buscadores_empleo
                            WHERE telefono = $1
                            LIMIT 1
                            `,
                            [telefono]
                        );

                    usuario =
                        resultado.rows[0] || null;
                }


                if (usuario) {

                    codigoPostal =
                        usuario.codigo_postal;

                }
            }


            if (!codigoPostal) {

                respuesta = `
📍 *Código postal*

Para mostrarte vacantes cercanas necesitamos conocer tu ubicación.

Escribe tu código postal:

Ejemplo:

29000

6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "esperando_codigo_postal_busqueda";

                break;
            }


            const ubicacion =
                await obtenerUbicacionPorCodigoPostal(
                    codigoPostal
                );


            if (!ubicacion) {

                respuesta = `
⚠️ No pudimos identificar tu municipio mediante tu código postal.

Verifica que tu código postal esté registrado correctamente.

6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso = "menu";

                break;
            }


            let vacantes =
                await buscarVacantes(
                    escolaridad
                );


            vacantes =
                ordenarPorProximidad(
                    vacantes,
                    ubicacion.municipio
                );


            if (vacantes.length === 0) {

                respuesta = `
😕 No encontramos vacantes activas para:

🎓 ${escolaridad}

📍 Tu ubicación:
${ubicacion.municipio}, ${ubicacion.entidad}

Puedes intentar con otro nivel de estudios.

1️⃣ Nueva búsqueda
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "seleccionar_vacante";

                break;
            }


            const vacantesMostrar =
                vacantes.slice(0, 10);


            // Guardar IDs de las vacantes encontradas
            datosTemporales.vacantes_encontradas =
                vacantesMostrar.map(
                    v => v.id
                );


            datosTemporales.municipio_busqueda =
                ubicacion.municipio;


            datosTemporales.entidad_busqueda =
                ubicacion.entidad;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            // Preparar respuesta interactiva
            respuesta = `
🔎 *Encontré ${vacantesMostrar.length} vacantes para ti*

🎓 *Escolaridad:*
${escolaridad}

📍 *Ubicación de tu perfil:*
${ubicacion.municipio}, ${ubicacion.entidad}

Selecciona una vacante para consultar sus detalles.
`;


            tipoRespuesta =
                "lista_vacantes";

            vacantesRespuesta =
                vacantesMostrar;

            escolaridadRespuesta =
                escolaridad;

            municipioRespuesta =
                ubicacion.municipio;

            entidadRespuesta =
                ubicacion.entidad;


            siguientePaso =
                "seleccionar_vacante";

            break;
        }


        case "esperando_codigo_postal_busqueda": {

            // Menú principal
            if (mensaje === "6") {

                respuesta = `
📋 *MENÚ PRINCIPAL*

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Consultar mi folio
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso = "menu";

                break;
            }


            // Salir
            if (mensaje === "7") {

                respuesta = `
👋 Gracias por utilizar el Sistema Nacional de Empleo.

Cuando necesites nuevamente nuestros servicios, aquí estaremos.

¡Hasta pronto!
`;

                siguientePaso = "finalizado";

                break;
            }


            // Validar 5 dígitos
            if (!/^\d{5}$/.test(mensaje)) {

                respuesta = `
⚠️ *Código postal no válido.*

El código postal debe tener exactamente 5 dígitos.

Por favor, escríbelo nuevamente.

Ejemplo:

29000

6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "esperando_codigo_postal_busqueda";

                break;
            }


            // Buscar ubicación
            const ubicacion =
                await obtenerUbicacionPorCodigoPostal(
                    mensaje
                );


            if (!ubicacion) {

                respuesta = `
⚠️ *Código postal no encontrado.*

No pudimos identificar tu municipio mediante el código postal:

${mensaje}

Verifica que sea correcto y escríbelo nuevamente.

Ejemplo:

29000

6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "esperando_codigo_postal_busqueda";

                break;
            }


            // Guardar CP
            datosTemporales.codigo_postal =
                mensaje;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            const escolaridad =
                datosTemporales.escolaridad;


            if (!escolaridad) {

                respuesta = `
⚠️ No pudimos recuperar tu nivel de estudios.

Por favor inicia nuevamente la búsqueda.

6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "menu";

                break;
            }


            // Buscar vacantes
            let vacantes =
                await buscarVacantes(
                    escolaridad
                );


            vacantes =
                ordenarPorProximidad(
                    vacantes,
                    ubicacion.municipio
                );


            if (vacantes.length === 0) {

                respuesta = `
😕 No encontramos vacantes activas para:

🎓 ${escolaridad}

📍 Tu ubicación:
${ubicacion.municipio}, ${ubicacion.entidad}

Puedes intentar con otro nivel de estudios.

1️⃣ Nueva búsqueda
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "seleccionar_vacante";

                break;
            }


            const vacantesMostrar =
                vacantes.slice(0, 10);


            // Guardar IDs de las vacantes encontradas
            datosTemporales.vacantes_encontradas =
                vacantesMostrar.map(
                    v => v.id
                );


            datosTemporales.municipio_busqueda =
                ubicacion.municipio;


            datosTemporales.entidad_busqueda =
                ubicacion.entidad;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            // Preparar respuesta interactiva
            respuesta = `
🔎 *Encontré ${vacantesMostrar.length} vacantes para ti*

🎓 *Escolaridad:*
${escolaridad}

📍 *Ubicación de tu perfil:*
${ubicacion.municipio}, ${ubicacion.entidad}

Selecciona una vacante para consultar sus detalles.
`;


            tipoRespuesta =
                "lista_vacantes";

            vacantesRespuesta =
                vacantesMostrar;

            escolaridadRespuesta =
                escolaridad;

            municipioRespuesta =
                ubicacion.municipio;

            entidadRespuesta =
                ubicacion.entidad;


            siguientePaso =
                "seleccionar_vacante";

            break;
        }


        case "seleccionar_vacante": {

            if (mensaje === "menu") {

                respuesta = `
📋 *MENÚ PRINCIPAL*

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Consultar mi folio
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso = "menu";

                break;
            }


            if (mensaje === "salir") {

                respuesta = `
👋 Gracias por utilizar el Sistema Nacional de Empleo.

Cuando necesites nuevamente nuestros servicios, aquí estaremos.

¡Hasta pronto!
`;

                siguientePaso = "finalizado";

                break;
            }


            let idVacante = null;

            if (
                mensaje.startsWith("vacante_")
            ) {

                const idTexto =
                    mensaje.replace(
                        "vacante_",
                        ""
                    );


                if (
                    !/^\d+$/.test(idTexto)
                ) {

                    respuesta = `
⚠️ No pudimos identificar la vacante seleccionada.

Realiza nuevamente la búsqueda.

6️⃣ Menú principal
7️⃣ Salir
`;

                    siguientePaso =
                        "menu";

                    break;
                }


                idVacante =
                    parseInt(idTexto);


                // Verificar que la vacante
                // pertenezca a las encontradas
                const ids =
                    datosTemporales
                        .vacantes_encontradas || [];


                if (
                    !ids.includes(idVacante)
                ) {

                    respuesta = `
⚠️ La vacante seleccionada ya no está disponible en esta búsqueda.

Realiza una nueva búsqueda.

1️⃣ Buscar vacantes
6️⃣ Menú principal
7️⃣ Salir
`;

                    siguientePaso =
                        "menu";

                    break;
                }

            }

            else if (
                /^\d+$/.test(mensaje)
            ) {

                const numero =
                    parseInt(mensaje);


                const ids =
                    datosTemporales
                        .vacantes_encontradas || [];


                if (
                    numero < 1 ||
                    numero > ids.length
                ) {

                    respuesta =
                        `⚠️ Esa vacante no existe.

📋 Selecciona un número entre 1 y ${ids.length}.

Ejemplo:

1

Puedes escribir *menu* para regresar al menú principal.
Puedes escribir *salir* para terminar.
`;

                    siguientePaso =
                        "seleccionar_vacante";

                    break;
                }


                idVacante =
                    ids[numero - 1];

            }


            else {

                respuesta = `
⚠️ *Opción no válida.*

Selecciona una vacante de la lista.

También puedes escribir el número de una vacante.

Puedes escribir *menu* para regresar al menú principal.
`;

                siguientePaso =
                    "seleccionar_vacante";

                break;
            }


            datosTemporales.vacante_seleccionada =
                idVacante;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            const vacante =
                await obtenerVacantePorId(
                    idVacante
                );


            if (!vacante) {

                respuesta = `
⚠️ No pudimos encontrar esa vacante.

Puedes realizar una nueva búsqueda.

2️⃣ Nueva búsqueda
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "seleccionar_vacante";

                break;
            }


            respuesta = `
📋 *DETALLE DE VACANTE*

💼 Puesto:
${vacante.puesto}

🏢 Empresa:
${vacante.empresa}

📍 Ubicación:
${vacante.municipio}, ${vacante.entidad}

🎓 Escolaridad:
${vacante.nivel_estudios}

📚 Experiencia:
${vacante.experiencia || "No especificada"}

💰 Salario:
$${vacante.salario || "No especificado"}

👥 Plazas disponibles:
${vacante.numero_plazas || "No especificado"}

¿Qué deseas hacer?

1️⃣ Postularme
2️⃣ Buscar otra vacante
6️⃣ Menú principal
7️⃣ Salir
`;


            siguientePaso =
                "detalle_vacante";

            break;
        }


        case "detalle_vacante": {

            switch (mensaje) {

                case "6":

                    respuesta = `
📋 *MENÚ PRINCIPAL*

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Consultar mi folio
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;

                    siguientePaso = "menu";

                    break;


                case "7":

                    respuesta = `
👋 Gracias por utilizar el Sistema Nacional de Empleo.

Cuando necesites nuevamente nuestros servicios, aquí estaremos.

¡Hasta pronto!
`;

                    siguientePaso =
                        "finalizado";

                    break;


                case "1": {

                    let buscadorId = null;


                    if (
                        datosTemporales
                            .usuario_autorizado_id
                    ) {

                        buscadorId =
                            datosTemporales
                                .usuario_autorizado_id;

                    }


                    else {

                        const resultado =
                            await db.query(
                                `
                                SELECT id
                                FROM buscadores_empleo
                                WHERE telefono = $1
                                LIMIT 1
                                `,
                                [telefono]
                            );

                        buscadorId =
                            resultado.rows[0]?.id ||
                            null;
                    }


                    if (!buscadorId) {

                        datosTemporales
                            .registro_desde_postulacion =
                            true;


                        await actualizarDatosTemporales(
                            telefono,
                            datosTemporales
                        );


                        respuesta = `
📝 *Registro necesario*

Para postularte a esta vacante necesitamos registrar tus datos en el Sistema Nacional de Empleo.

La vacante que seleccionaste se conservará durante el proceso.

Comencemos con tu registro.

Escribe tu CURP:

6️⃣ Menú principal
7️⃣ Salir
`;

                        siguientePaso =
                            "esperando_curp";

                        break;
                    }


                    const vacanteId =
                        datosTemporales
                            .vacante_seleccionada;


                    if (!vacanteId) {

                        respuesta = `
⚠️ No pudimos identificar la vacante seleccionada.

Por favor realiza una nueva búsqueda.

2️⃣ Nueva búsqueda
6️⃣ Menú principal
7️⃣ Salir
`;

                        siguientePaso =
                            "menu";

                        break;
                    }


                                        const postulacion =
                        await crearPostulacion(
                            buscadorId,
                            vacanteId
                        );


                    /*
                     * Verificar si ya estaba postulado
                     */

                    if (!postulacion) {

                        respuesta = `
ℹ️ Ya tienes una postulación registrada para esta vacante.

No es necesario volver a postularte.

¿Qué deseas hacer?

1️⃣ Buscar más vacantes
2️⃣ Menú principal
7️⃣ Salir
`;

                        siguientePaso =
                            "menu";

                        break;
                    }


                    /*
                     * ==========================================
                     * POSTULACIÓN REGISTRADA CORRECTAMENTE
                     * ==========================================
                     */

                    try {

                        /*
                         * Obtener información completa
                         * de la postulación
                         */

                        const datosComprobante =
                            await obtenerDatosComprobante(
                                postulacion.id
                            );


                        if (!datosComprobante) {

                            console.error(
                                "🔴 No se encontraron datos para generar el comprobante."
                            );

                        } else {

                            /*
                             * Generar PDF
                             */

                            const comprobante =
                                await generarComprobantePostulacion(
                                    datosComprobante
                                );


                            console.log(
                                "🟢 Comprobante generado correctamente:"
                            );

                            console.log(
                                comprobante.rutaArchivo
                            );


                            /*
                             * Subir PDF a WhatsApp
                             */

                            const mediaId =
                                await subirDocumentoWhatsApp(
                                    comprobante.rutaArchivo
                                );


                            /*
                             * Enviar PDF al usuario
                             */

                            await enviarDocumentoWhatsApp(

                                telefono,

                                mediaId,

                                comprobante.nombreArchivo,

                                "📄 Comprobante de postulación"

                            );


                            /*
                             * Eliminar PDF temporal
                             */

                            const fs =
                                require("fs");


                            fs.unlink(
                                comprobante.rutaArchivo,
                                (error) => {

                                    if (error) {

                                        console.error(
                                            "⚠️ No se pudo eliminar el PDF temporal:",
                                            error.message
                                        );

                                    } else {

                                        console.log(
                                            "🗑️ PDF temporal eliminado."
                                        );

                                    }

                                }
                            );

                        }


                    } catch (error) {

                        /*
                         * IMPORTANTE:
                         *
                         * La postulación ya fue registrada
                         * en la base de datos.
                         *
                         * Si falla el PDF o WhatsApp,
                         * NO debemos decir que falló
                         * la postulación.
                         */

                        console.error(
                            "🔴 Error generando o enviando comprobante:"
                        );

                        console.error(
                            error.response?.data ||
                            error.message
                        );

                    }


                    /*
                     * ==========================================
                     * MENSAJE FINAL AL USUARIO
                     * ==========================================
                     */

                    respuesta = `
✅ *¡Postulación exitosa!*

Tu solicitud ha sido registrada correctamente.

📄 Te hemos enviado tu *comprobante de postulación*.

📌 *Importante:*
Este comprobante confirma que tu solicitud fue registrada. Un asesor o reclutador revisará tu información y podrá ponerse en contacto contigo para continuar con el proceso.

⚠️ La postulación no garantiza la contratación.

¿Qué deseas hacer?

1️⃣ Buscar más vacantes
2️⃣ Menú principal
7️⃣ Salir
`;


                    siguientePaso =
                        "menu";


                    break;
                }


                case "2": {

                    respuesta = `
🔎 *Nueva búsqueda*

🎓 Selecciona tu nivel de estudios:

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


                default:

                    respuesta = `
⚠️ *Selecciona una opción válida.*

1️⃣ Postularme
2️⃣ Buscar otra vacante
6️⃣ Menú principal
7️⃣ Salir
`;

                    siguientePaso =
                        "detalle_vacante";

                    break;
            }

            break;
        }


        case "seleccionando_numero_vacante": {

            if (mensaje === "menu") {

                respuesta = `
📋 *MENÚ PRINCIPAL*

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Consultar mi folio
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "menu";

                break;
            }


            if (mensaje === "salir") {

                respuesta = `
👋 Gracias por utilizar el Sistema Nacional de Empleo.

Cuando necesites nuevamente nuestros servicios, aquí estaremos.

¡Hasta pronto!
`;

                siguientePaso =
                    "finalizado";

                break;
            }


            if (!/^\d+$/.test(mensaje)) {

                respuesta = `
⚠️ Opción no válida.

📋 Escribe el número de la vacante que deseas consultar.

Ejemplo:

1
`;

                siguientePaso =
                    "seleccionando_numero_vacante";

                break;
            }


            const numero =
                parseInt(mensaje);


            const ids =
                datosTemporales
                    .vacantes_encontradas || [];


            if (
                numero < 1 ||
                numero > ids.length
            ) {

                respuesta =
                    `⚠️ Esa vacante no existe.

📋 Selecciona un número entre 1 y ${ids.length}.

Ejemplo:

1
`;

                siguientePaso =
                    "seleccionando_numero_vacante";

                break;
            }


            const idVacante =
                ids[numero - 1];


            datosTemporales.vacante_seleccionada =
                idVacante;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            const vacante =
                await obtenerVacantePorId(
                    idVacante
                );


            if (!vacante) {

                respuesta = `
⚠️ No pudimos encontrar esa vacante.

2️⃣ Nueva búsqueda
6️⃣ Menú principal
7️⃣ Salir
`;

                siguientePaso =
                    "seleccionar_vacante";

                break;
            }


            respuesta = `
📋 *DETALLE DE VACANTE*

💼 Puesto:
${vacante.puesto}

🏢 Empresa:
${vacante.empresa}

📍 Ubicación:
${vacante.municipio}, ${vacante.entidad}

🎓 Escolaridad:
${vacante.nivel_estudios}

📚 Experiencia:
${vacante.experiencia || "No especificada"}

💰 Salario:
$${vacante.salario || "No especificado"}

👥 Plazas disponibles:
${vacante.numero_plazas || "No especificado"}

¿Qué deseas hacer?

1️⃣ Postularme
2️⃣ Buscar otra vacante
6️⃣ Menú principal
7️⃣ Salir
`;

            siguientePaso =
                "detalle_vacante";

            break;
        }
    }


    if (!respuesta || !respuesta.trim()) {

        console.error(
            "❌ procesarVacantes generó una respuesta vacía."
        );

        respuesta = `
⚠️ Ocurrió un problema al procesar tu opción.

Regresaremos al menú principal.

6️⃣ Menú principal
7️⃣ Salir
`;

        siguientePaso = "menu";
    }


    return {
        respuesta,
        siguientePaso,

        // Datos para WhatsApp Interactive List
        tipoRespuesta,
        vacantes: vacantesRespuesta,
        escolaridad: escolaridadRespuesta,
        municipio: municipioRespuesta,
        entidad: entidadRespuesta
    };
}


module.exports = {
    procesarVacantes
};