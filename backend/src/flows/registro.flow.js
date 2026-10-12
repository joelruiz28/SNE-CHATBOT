
const {
    buscarPorCURP,
    crearBuscadorCompleto,
    actualizarBuscadorCompletoPorId,
    actualizarCampoPerfilPorId
} = require("../services/buscador.service");

const {
    actualizarDatosTemporales
} = require("../services/sesion.service");

const {
    enviarMensajeWhatsApp,
    subirDocumentoWhatsApp,
    enviarDocumentoWhatsApp
} = require("../services/whatsapp.service");

const {
    validarNombre,
    validarCURP,
    convertirFecha
} = require("../utils/validaciones");

const {
    crearPostulacion,
    obtenerPostulacionPorBuscadorYVacante,
    obtenerDatosComprobante
} = require("../services/postulacion.service");

const {
    generarComprobantePostulacion
} = require("../services/comprobante.service");

const {
    sexo
} = require("../utils/catalogos");

const {
    generarMenu
} = require("../utils/menu");


// ============================================================
// CÓDIGO DE SEGURIDAD
// ============================================================

function generarCodigoSeguridad() {

    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();

}


// ============================================================
// OBTENER PRIMER DATO FALTANTE
// ============================================================

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


// ============================================================
// OBTENER SIGUIENTE PASO DEL PERFIL
// ============================================================

function obtenerSiguientePasoPerfil(usuario) {

    const datoFaltante =
        obtenerPrimerDatoFaltante(usuario);

    switch (datoFaltante) {

        case "nombre":

            return {
                dato: "nombre",
                paso: "esperando_nombre",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

👤 Solo falta tu nombre completo.

Por favor, escribe tu nombre completo:
`
            };


        case "fecha":

            return {
                dato: "fecha",
                paso: "esperando_fecha",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

🎂 Solo falta tu fecha de nacimiento.

Ejemplo:

08 de noviembre de 2003
`
            };


        case "sexo":

            return {
                dato: "sexo",
                paso: "esperando_sexo",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

⚧️ Solo falta registrar tu sexo.

${generarMenu(sexo)}
`
            };


        case "correo":

            return {
                dato: "correo",
                paso: "esperando_correo",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

📧 Solo falta tu correo electrónico.

Escribe tu correo:
`
            };


        case "codigo_postal":

            return {
                dato: "codigo_postal",
                paso: "esperando_codigo_postal",
                respuesta: `
⚠️ *Tu perfil está incompleto.*

📮 Solo falta tu código postal.

Escribe tu código postal:

Ejemplo:

29000
`
            };


        default:

            return null;
    }
}


// ============================================================
// GENERAR Y ENVIAR COMPROBANTE
// ============================================================

async function procesarPostulacionYComprobante(
    buscadorId,
    vacanteId,
    telefono
) {

    try {

        console.log(
            "📝 Procesando postulación automática..."
        );

        console.log(
            "🆔 Buscador:",
            buscadorId
        );

        console.log(
            "🆔 Vacante:",
            vacanteId
        );


        // ----------------------------------------------------
        // Crear postulación
        // ----------------------------------------------------

        let postulacion =
            await crearPostulacion(
                buscadorId,
                vacanteId
            );


        /*
         * Si devuelve null, normalmente significa que
         * la postulación ya existía por el ON CONFLICT.
         *
         * En lugar de considerar que falló, buscamos
         * la postulación existente.
         */

        if (!postulacion) {

            console.log(
                "ℹ️ La postulación ya existía. Buscando registro existente..."
            );


            postulacion =
                await obtenerPostulacionPorBuscadorYVacante(
                    buscadorId,
                    vacanteId
                );
        }


        if (!postulacion) {

            console.error(
                "🔴 No fue posible obtener la postulación."
            );


            return {
                postulacionCreada: false,
                comprobanteEnviado: false
            };
        }


        console.log(
            "✅ Postulación encontrada/creada correctamente."
        );

        console.log(
            "🆔 ID de postulación:",
            postulacion.id
        );


        // ----------------------------------------------------
        // Obtener datos del comprobante
        // ----------------------------------------------------

        const datosComprobante =
            await obtenerDatosComprobante(
                postulacion.id
            );


        if (!datosComprobante) {

            console.error(
                "🔴 No se encontraron datos para generar el comprobante."
            );


            return {
                postulacionCreada: true,
                comprobanteEnviado: false,
                postulacionId: postulacion.id
            };
        }


        console.log(
            "🟢 Datos del comprobante obtenidos correctamente."
        );


        // ----------------------------------------------------
        // Generar PDF
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Subir PDF a WhatsApp
        // ----------------------------------------------------

        const mediaId =
            await subirDocumentoWhatsApp(
                comprobante.rutaArchivo
            );


        console.log(
            "🟢 PDF subido correctamente a WhatsApp."
        );


        // ----------------------------------------------------
        // Enviar PDF al usuario
        // ----------------------------------------------------

        await enviarDocumentoWhatsApp(

            telefono,

            mediaId,

            comprobante.nombreArchivo,

            "📄 Comprobante de postulación"

        );


        console.log(
            "🟢 Comprobante enviado correctamente al usuario."
        );


        // ----------------------------------------------------
        // Eliminar archivo temporal
        // ----------------------------------------------------

        const fs = require("fs");

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
                        "🗑️ PDF temporal eliminado correctamente."
                    );

                }

            }
        );


        return {
            postulacionCreada: true,
            comprobanteEnviado: true,
            postulacionId: postulacion.id,
            comprobante
        };


    } catch (error) {

        /*
         * IMPORTANTE:
         *
         * Si falla la generación, subida o envío del PDF,
         * NO eliminamos ni revertimos la postulación.
         *
         * La postulación ya quedó registrada en PostgreSQL.
         */

        console.error(
            "🔴 Error generando/enviando comprobante:"
        );

        console.error(
            error.response?.data ||
            error.message
        );


        return {
            postulacionCreada: true,
            comprobanteEnviado: false,
            error
        };
    }
}


// ============================================================
// PROCESAR POSTULACIÓN DESPUÉS DE COMPLETAR PERFIL
// ============================================================

async function finalizarPerfilYPostulacion(
    buscador,
    datosTemporales,
    telefono
) {

    let postulacionAutomatica = false;
    let comprobanteEnviado = false;


    if (
        datosTemporales.registro_desde_postulacion &&
        datosTemporales.vacante_seleccionada
    ) {

        console.log(
            "📝 El registro proviene de una postulación."
        );


        const resultado =
            await procesarPostulacionYComprobante(

                buscador.id,

                datosTemporales.vacante_seleccionada,

                telefono

            );


        if (resultado.postulacionCreada) {

            postulacionAutomatica = true;

            comprobanteEnviado =
                resultado.comprobanteEnviado;

        }

    }


    return {
        postulacionAutomatica,
        comprobanteEnviado
    };
}


// ============================================================
// PROCESAR REGISTRO
// ============================================================

async function procesarRegistro(
    sesion,
    mensaje,
    telefono
) {

    let respuesta = "";

    let siguientePaso =
        sesion.paso_actual;

    let datosTemporales =
        sesion.datos_temporales || {};


    // --------------------------------------------------------
    // Convertir datos temporales si vienen como string
    // --------------------------------------------------------

    if (
        typeof datosTemporales === "string"
    ) {

        try {

            datosTemporales =
                JSON.parse(datosTemporales);

        } catch (error) {

            console.error(
                "⚠️ No se pudieron leer los datos temporales:",
                error.message
            );

            datosTemporales = {};
        }
    }


    switch (sesion.paso_actual) {


        // ====================================================
        // CURP
        // ====================================================

        case "esperando_curp": {

            const curp =
                mensaje
                    .trim()
                    .toUpperCase();


            if (!validarCURP(curp)) {

                respuesta =
`⚠️ La CURP no parece válida.

Verifica que tenga 18 caracteres e intenta nuevamente.`;

                break;
            }


            const buscadorExistente =
                await buscarPorCURP(curp);


            // ------------------------------------------------
            // CURP EXISTENTE
            // ------------------------------------------------

            if (buscadorExistente) {

                console.log(
                    "🔎 CURP encontrada:"
                );

                console.log(
                    "🆔 CURP:",
                    curp
                );

                console.log(
                    "📱 Teléfono registrado:",
                    buscadorExistente.telefono
                );

                console.log(
                    "📱 Teléfono actual:",
                    telefono
                );


                // --------------------------------------------
                // MISMO TELÉFONO
                // --------------------------------------------

                if (
                    buscadorExistente.telefono ===
                    telefono
                ) {

                    const perfilCompleto =

                        buscadorExistente.nombre_completo?.trim() &&

                        buscadorExistente.curp?.trim() &&

                        buscadorExistente.fecha_nacimiento &&

                        buscadorExistente.sexo?.trim() &&

                        buscadorExistente.telefono?.trim() &&

                        buscadorExistente.correo?.trim() &&

                        buscadorExistente.codigo_postal?.trim();


                    // ----------------------------------------
                    // PERFIL COMPLETO
                    // ----------------------------------------

                    if (perfilCompleto) {

                        respuesta =
`✅ Tu CURP ya se encuentra registrada en el Sistema Nacional de Empleo.

📄 Folio:

${buscadorExistente.folio || "Aún no asignado"}

Tus datos ya se encuentran registrados.

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Menú principal`;


                        siguientePaso =
                            "menu";


                    } else {

                        // ------------------------------------
                        // PERFIL INCOMPLETO
                        // ------------------------------------

                        datosTemporales.curp =
                            curp;

                        datosTemporales.usuario_existente_id =
                            buscadorExistente.id;

                        datosTemporales.completando_perfil =
                            true;


                        const siguiente =
                            obtenerSiguientePasoPerfil(
                                buscadorExistente
                            );


                        if (siguiente) {

                            console.log(
                                "📋 Dato faltante:",
                                siguiente.dato
                            );


                            datosTemporales.dato_perfil_actual =
                                siguiente.dato;


                            await actualizarDatosTemporales(
                                telefono,
                                datosTemporales
                            );


                            respuesta =
                                siguiente.respuesta;


                            siguientePaso =
                                siguiente.paso;

                        } else {

                            respuesta =
`
✅ Tu perfil ya está completo.
`;

                            siguientePaso =
                                "menu";
                        }
                    }


                    break;
                }


                // --------------------------------------------
                // CURP DE OTRO TELÉFONO
                // --------------------------------------------

                console.log(
                    "⚠️ La CURP pertenece a otro número."
                );


                const codigo =
                    generarCodigoSeguridad();


                console.log(
                    "🔐 CÓDIGO DE SEGURIDAD:",
                    codigo
                );


                const expiracion =
                    Date.now() +
                    (10 * 60 * 1000);


                datosTemporales = {

                    curp: curp,

                    telefono_original:
                        buscadorExistente.telefono,

                    codigo_seguridad:
                        codigo,

                    codigo_expira:
                        expiracion,

                    intentos_codigo: 0

                };


                await actualizarDatosTemporales(
                    telefono,
                    datosTemporales
                );


                try {

                    await enviarMensajeWhatsApp(

                        buscadorExistente.telefono,

`🔐 *Código de seguridad SNE*

Se ha solicitado acceso a tu registro mediante otro número de WhatsApp.

Tu código temporal es:

*${codigo}*

⏱️ Este código es válido durante 10 minutos.

⚠️ No compartas este código con otras personas.

Si tú no realizaste esta solicitud, puedes ignorar este mensaje.`

                    );


                    console.log(
                        "🟢 Código de seguridad enviado."
                    );

                    console.log(
                        "📱 Número original:",
                        buscadorExistente.telefono
                    );


                } catch (error) {

                    console.error(
                        "🔴 No se pudo enviar el código:"
                    );

                    console.error(
                        error.message
                    );


                    await actualizarDatosTemporales(
                        telefono,
                        {}
                    );


                    respuesta =
`❌ No pudimos enviar el código de seguridad.

Por favor intenta nuevamente más tarde.`;


                    siguientePaso =
                        "menu";


                    break;
                }


                respuesta =
`🔐 *Verificación de seguridad*

La CURP que ingresaste ya pertenece a un registro existente, pero está asociada a otro número de WhatsApp.

Por seguridad, enviamos un código temporal al número de WhatsApp que está registrado actualmente.

📩 Solicita el código a la persona propietaria del registro e introdúcelo aquí.

Escribe el código de 6 dígitos para continuar.

⏱️ El código es válido durante 10 minutos.`;


                siguientePaso =
                    "esperando_codigo_seguridad";


                break;
            }


            // ------------------------------------------------
            // CURP NUEVA
            // ------------------------------------------------

            datosTemporales.curp =
                curp;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            respuesta =
`✅ CURP validada y disponible.

¿Cuál es tu nombre completo?`;


            siguientePaso =
                "esperando_nombre";


            break;
        }


        // ====================================================
        // CÓDIGO DE SEGURIDAD
        // ====================================================

        case "esperando_codigo_seguridad": {

            const codigoIngresado =
                mensaje
                    .trim()
                    .replace(/\s/g, "");


            if (
                !/^\d{6}$/.test(
                    codigoIngresado
                )
            ) {

                respuesta =
`⚠️ El código debe contener 6 números.

Escribe el código de seguridad que fue enviado al número registrado.`;


                break;
            }


            if (
                !datosTemporales.codigo_seguridad ||
                !datosTemporales.codigo_expira
            ) {

                respuesta =
`⚠️ No encontramos un código de seguridad activo.

Inicia nuevamente el proceso desde el menú principal.`;


                siguientePaso =
                    "menu";


                break;
            }


            if (
                Date.now() >
                Number(
                    datosTemporales.codigo_expira
                )
            ) {

                console.log(
                    "⏱️ Código de seguridad expirado."
                );


                await actualizarDatosTemporales(
                    telefono,
                    {}
                );


                respuesta =
`⏱️ El código de seguridad ha expirado.

Por seguridad, debes iniciar nuevamente el proceso.`;


                siguientePaso =
                    "menu";


                break;
            }


            const intentos =
                Number(
                    datosTemporales.intentos_codigo || 0
                );


            if (intentos >= 3) {

                await actualizarDatosTemporales(
                    telefono,
                    {}
                );


                respuesta =
`🔒 Se alcanzó el número máximo de intentos.

Por seguridad, el acceso ha sido cancelado.

Puedes iniciar nuevamente desde el menú principal.`;


                siguientePaso =
                    "menu";


                break;
            }


            if (
                codigoIngresado !==
                datosTemporales.codigo_seguridad
            ) {

                datosTemporales.intentos_codigo =
                    intentos + 1;


                await actualizarDatosTemporales(
                    telefono,
                    datosTemporales
                );


                const intentosRestantes =
                    3 -
                    datosTemporales.intentos_codigo;


                respuesta =
`❌ El código de seguridad es incorrecto.

Intentos restantes: ${intentosRestantes}

Verifica el código enviado al número registrado e intenta nuevamente.`;


                break;
            }


            const usuarioAutorizado =
                await buscarPorCURP(
                    datosTemporales.curp
                );


            if (!usuarioAutorizado) {

                console.log(
                    "🔴 No se encontró el registro asociado a la CURP:",
                    datosTemporales.curp
                );


                await actualizarDatosTemporales(
                    telefono,
                    {}
                );


                respuesta =
`❌ No encontramos el registro asociado a esta CURP.

Por seguridad, el acceso ha sido cancelado.

Puedes iniciar nuevamente desde el menú principal.`;


                siguientePaso =
                    "menu";


                break;
            }


            console.log(
                "🟢 Código de seguridad correcto."
            );


            console.log(
                "🆔 CURP autorizada:",
                datosTemporales.curp
            );


            console.log(
                "🆔 Usuario autorizado:",
                usuarioAutorizado.id
            );


            console.log(
                "📱 Teléfono registrado:",
                usuarioAutorizado.telefono
            );


            datosTemporales.seguridad_verificada =
                true;


            datosTemporales.fecha_autorizacion =
                Date.now();


            datosTemporales.usuario_autorizado_id =
                usuarioAutorizado.id;


            datosTemporales.telefono_registrado =
                usuarioAutorizado.telefono;


            delete datosTemporales.codigo_seguridad;

            delete datosTemporales.codigo_expira;

            delete datosTemporales.intentos_codigo;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            respuesta =
`✅ *Verificación exitosa*

Tu identidad fue verificada correctamente.

🔐 El acceso a tu registro ha sido autorizado.

📄 CURP:
${datosTemporales.curp}

⚠️ El número de WhatsApp registrado todavía no ha sido modificado.

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Mis postulaciones
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir`;


            siguientePaso =
                "menu";


            break;
        }


        // ====================================================
        // NOMBRE
        // ====================================================

        case "esperando_nombre": {

            const nombre =
                mensaje
                    .trim()
                    .replace(/\s+/g, " ");


            if (
                !nombre ||
                nombre.length < 3
            ) {

                respuesta =
`⚠️ El nombre no parece válido.

Escribe tu nombre completo.

Ejemplo:

Juan Alberto Pérez López`;


                siguientePaso =
                    "esperando_nombre";


                break;
            }


            datosTemporales.nombre_completo =
                nombre;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            respuesta =
`📅 ¿Cuál es tu fecha de nacimiento?

Puedes escribirla, por ejemplo:

08 de noviembre de 2003`;


            siguientePaso =
                "esperando_fecha";


            break;
        }


        // ====================================================
        // FECHA
        // ====================================================

        case "esperando_fecha": {

            const fecha =
                convertirFecha(mensaje);


            if (!fecha) {

                respuesta =
`⚠️ No pude reconocer la fecha.

Ejemplo:

08 de noviembre de 2003`;


                break;
            }


            // ------------------------------------------------
            // PERFIL EXISTENTE
            // ------------------------------------------------

            if (
                datosTemporales.completando_perfil &&
                datosTemporales.usuario_existente_id
            ) {

                console.log(
                    "🔄 Actualizando solamente fecha..."
                );


                const buscadorActualizado =
                    await actualizarCampoPerfilPorId(

                        datosTemporales.usuario_existente_id,

                        "fecha",

                        fecha

                    );


                const siguiente =
                    obtenerSiguientePasoPerfil(
                        buscadorActualizado
                    );


                if (siguiente) {

                    datosTemporales.dato_perfil_actual =
                        siguiente.dato;


                    await actualizarDatosTemporales(
                        telefono,
                        datosTemporales
                    );


                    respuesta =
                        siguiente.respuesta;


                    siguientePaso =
                        siguiente.paso;


                } else {

                    const resultado =
                        await finalizarPerfilYPostulacion(

                            buscadorActualizado,

                            datosTemporales,

                            telefono

                        );


                    await actualizarDatosTemporales(
                        telefono,
                        {}
                    );


                    if (
                        resultado.postulacionAutomatica
                    ) {

                        respuesta =
`🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

━━━━━━━━━━━━━━━━━━

✅ *¡Postulación registrada!*

La vacante que seleccionaste también fue registrada correctamente.

${
    resultado.comprobanteEnviado
        ? "📄 *Te enviamos tu comprobante de postulación en este chat.*"
        : "⚠️ La postulación quedó registrada, pero no fue posible enviar el comprobante en este momento."
}

Un asesor o reclutador podrá ponerse en contacto contigo.

⚠️ La postulación no garantiza la contratación.

¿Qué deseas hacer?

1️⃣ Buscar más vacantes
6️⃣ Menú principal
7️⃣ Salir
`;

                    } else {

                        respuesta =
`🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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


                    siguientePaso =
                        "menu";
                }


                break;
            }


            // ------------------------------------------------
            // NUEVO REGISTRO
            // ------------------------------------------------

            datosTemporales.fecha_nacimiento =
                fecha;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            respuesta =
`✅ Fecha registrada.

¿Cuál es tu sexo?

${generarMenu(sexo)}`;


            siguientePaso =
                "esperando_sexo";


            break;
        }


        // ====================================================
        // SEXO
        // ====================================================

        case "esperando_sexo": {

            if (!sexo[mensaje]) {

                respuesta =
`⚠️ Selecciona una opción válida:

${generarMenu(sexo)}`;


                break;
            }


            const sexoSeleccionado =
                sexo[mensaje];


            // ------------------------------------------------
            // PERFIL EXISTENTE
            // ------------------------------------------------

            if (
                datosTemporales.completando_perfil &&
                datosTemporales.usuario_existente_id
            ) {

                console.log(
                    "🔄 Actualizando solamente sexo..."
                );


                const buscadorActualizado =
                    await actualizarCampoPerfilPorId(

                        datosTemporales.usuario_existente_id,

                        "sexo",

                        sexoSeleccionado

                    );


                const siguiente =
                    obtenerSiguientePasoPerfil(
                        buscadorActualizado
                    );


                if (siguiente) {

                    datosTemporales.dato_perfil_actual =
                        siguiente.dato;


                    await actualizarDatosTemporales(
                        telefono,
                        datosTemporales
                    );


                    respuesta =
                        siguiente.respuesta;


                    siguientePaso =
                        siguiente.paso;


                } else {

                    const resultado =
                        await finalizarPerfilYPostulacion(

                            buscadorActualizado,

                            datosTemporales,

                            telefono

                        );


                    await actualizarDatosTemporales(
                        telefono,
                        {}
                    );


                    if (
                        resultado.postulacionAutomatica
                    ) {

                        respuesta =
`🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

━━━━━━━━━━━━━━━━━━

✅ *¡Postulación registrada!*

La vacante que seleccionaste también fue registrada correctamente.

${
    resultado.comprobanteEnviado
        ? "📄 *Te enviamos tu comprobante de postulación en este chat.*"
        : "⚠️ La postulación quedó registrada, pero no fue posible enviar el comprobante en este momento."
}

Un asesor o reclutador podrá ponerse en contacto contigo.

⚠️ La postulación no garantiza la contratación.

¿Qué deseas hacer?

1️⃣ Buscar más vacantes
6️⃣ Menú principal
7️⃣ Salir
`;

                    } else {

                        respuesta =
`🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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


                    siguientePaso =
                        "menu";
                }


                break;
            }


            // ------------------------------------------------
            // NUEVO REGISTRO
            // ------------------------------------------------

            datosTemporales.sexo =
                sexoSeleccionado;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            respuesta =
`✅ Sexo registrado: ${sexoSeleccionado}

¿Cuál es tu correo electrónico?`;


            siguientePaso =
                "esperando_correo";


            break;
        }


        // ====================================================
        // CORREO
        // ====================================================

        case "esperando_correo": {

            const correo =
                mensaje.trim();


            const correoValido =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    correo
                );


            if (!correoValido) {

                respuesta =
`⚠️ El correo electrónico no parece válido.

Ejemplo:

nombre@correo.com`;


                break;
            }


            // ------------------------------------------------
            // PERFIL EXISTENTE
            // ------------------------------------------------

            if (
                datosTemporales.completando_perfil &&
                datosTemporales.usuario_existente_id
            ) {

                console.log(
                    "🔄 Actualizando solamente correo..."
                );


                const buscadorActualizado =
                    await actualizarCampoPerfilPorId(

                        datosTemporales.usuario_existente_id,

                        "correo",

                        correo

                    );


                console.log(
                    "📧 Correo actualizado:",
                    buscadorActualizado.correo
                );


                console.log(
                    "📋 Perfil completo:",
                    buscadorActualizado.perfil_completo
                );


                const siguiente =
                    obtenerSiguientePasoPerfil(
                        buscadorActualizado
                    );


                if (siguiente) {

                    datosTemporales.dato_perfil_actual =
                        siguiente.dato;


                    await actualizarDatosTemporales(
                        telefono,
                        datosTemporales
                    );


                    respuesta =
                        siguiente.respuesta;


                    siguientePaso =
                        siguiente.paso;


                } else {

                    const resultado =
                        await finalizarPerfilYPostulacion(

                            buscadorActualizado,

                            datosTemporales,

                            telefono

                        );


                    await actualizarDatosTemporales(
                        telefono,
                        {}
                    );


                    if (
                        resultado.postulacionAutomatica
                    ) {

                        respuesta =
`🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

━━━━━━━━━━━━━━━━━━

✅ *¡Postulación registrada!*

La vacante que seleccionaste también fue registrada correctamente.

${
    resultado.comprobanteEnviado
        ? "📄 *Te enviamos tu comprobante de postulación en este chat.*"
        : "⚠️ La postulación quedó registrada, pero no fue posible enviar el comprobante en este momento."
}

Un asesor o reclutador podrá ponerse en contacto contigo.

⚠️ La postulación no garantiza la contratación.

¿Qué deseas hacer?

1️⃣ Buscar más vacantes
6️⃣ Menú principal
7️⃣ Salir
`;

                    } else {

                        respuesta =
`🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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


                    siguientePaso =
                        "menu";
                }


                break;
            }


            // ------------------------------------------------
            // NUEVO REGISTRO
            // ------------------------------------------------

            datosTemporales.correo =
                correo;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            respuesta =
`✅ Correo registrado.

¿Cuál es tu código postal?

Ejemplo:

29000`;


            siguientePaso =
                "esperando_codigo_postal";


            break;
        }


        // ====================================================
        // CÓDIGO POSTAL
        // ====================================================

        case "esperando_codigo_postal": {

            const codigoPostal =
                mensaje.trim();


            if (!/^\d{5}$/.test(codigoPostal)) {

                respuesta =
`⚠️ El código postal debe contener 5 números.

Ejemplo:

29000`;


                break;
            }


            // ------------------------------------------------
            // PERFIL EXISTENTE
            // ------------------------------------------------

            if (
                datosTemporales.completando_perfil &&
                datosTemporales.usuario_existente_id
            ) {

                console.log(
                    "🔄 Actualizando solamente código postal..."
                );


                const buscadorActualizado =
                    await actualizarCampoPerfilPorId(

                        datosTemporales.usuario_existente_id,

                        "codigo_postal",

                        codigoPostal

                    );


                console.log(
                    "📮 Código postal actualizado:",
                    buscadorActualizado.codigo_postal
                );


                console.log(
                    "📋 Perfil completo:",
                    buscadorActualizado.perfil_completo
                );


                const siguiente =
                    obtenerSiguientePasoPerfil(
                        buscadorActualizado
                    );


                if (siguiente) {

                    datosTemporales.dato_perfil_actual =
                        siguiente.dato;


                    await actualizarDatosTemporales(
                        telefono,
                        datosTemporales
                    );


                    respuesta =
                        siguiente.respuesta;


                    siguientePaso =
                        siguiente.paso;


                } else {

                    const resultado =
                        await finalizarPerfilYPostulacion(

                            buscadorActualizado,

                            datosTemporales,

                            telefono

                        );


                    await actualizarDatosTemporales(
                        telefono,
                        {}
                    );


                    if (
                        resultado.postulacionAutomatica
                    ) {

                        respuesta =
`🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

━━━━━━━━━━━━━━━━━━

✅ *¡Postulación registrada!*

La vacante que seleccionaste también fue registrada correctamente.

${
    resultado.comprobanteEnviado
        ? "📄 *Te enviamos tu comprobante de postulación en este chat.*"
        : "⚠️ La postulación quedó registrada, pero no fue posible enviar el comprobante en este momento."
}

Un asesor o reclutador podrá ponerse en contacto contigo.

⚠️ La postulación no garantiza la contratación.

¿Qué deseas hacer?

1️⃣ Buscar más vacantes
6️⃣ Menú principal
7️⃣ Salir
`;

                    } else {

                        respuesta =
`🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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


                    siguientePaso =
                        "menu";
                }


                break;
            }


            // ------------------------------------------------
            // NUEVO REGISTRO
            // ------------------------------------------------

            datosTemporales.codigo_postal =
                codigoPostal;


            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );


            try {

                console.log(
                    "💾 Intentando crear registro definitivo..."
                );


                console.log(
                    "📦 Datos temporales:",
                    datosTemporales
                );


                let buscadorCreado;


                // --------------------------------------------
                // ACTUALIZAR REGISTRO EXISTENTE
                // --------------------------------------------

                if (
                    datosTemporales.usuario_existente_id
                ) {

                    console.log(
                        "🔄 Actualizando registro existente..."
                    );


                    console.log(
                        "🆔 ID existente:",
                        datosTemporales.usuario_existente_id
                    );


                    buscadorCreado =
                        await actualizarBuscadorCompletoPorId(

                            datosTemporales.usuario_existente_id,

                            datosTemporales

                        );


                    console.log(
                        "✅ Registro existente actualizado correctamente."
                    );


                } else {

                    // ----------------------------------------
                    // CREAR REGISTRO NUEVO
                    // ----------------------------------------

                    console.log(
                        "🆕 Creando nuevo registro..."
                    );


                    buscadorCreado =
                        await crearBuscadorCompleto(

                            datosTemporales,

                            telefono

                        );


                    console.log(
                        "✅ Registro nuevo creado correctamente."
                    );
                }


                // --------------------------------------------
                // POSTULACIÓN AUTOMÁTICA
                // --------------------------------------------

                let postulacionAutomatica = false;
                let comprobanteEnviado = false;


                if (
                    datosTemporales.registro_desde_postulacion &&
                    datosTemporales.vacante_seleccionada
                ) {

                    const resultado =
                        await procesarPostulacionYComprobante(

                            buscadorCreado.id,

                            datosTemporales.vacante_seleccionada,

                            telefono

                        );


                    if (
                        resultado.postulacionCreada
                    ) {

                        postulacionAutomatica = true;

                        comprobanteEnviado =
                            resultado.comprobanteEnviado;
                    }
                }


                // --------------------------------------------
                // LIMPIAR SESIÓN
                // --------------------------------------------

                await actualizarDatosTemporales(
                    telefono,
                    {}
                );


                // --------------------------------------------
                // RESPUESTA FINAL
                // --------------------------------------------

                if (postulacionAutomatica) {

                    respuesta =
`🎉 *¡Registro completado correctamente!*

Tus datos fueron registrados en el Sistema Nacional de Empleo.

🆔 *Tu folio:*
${buscadorCreado.folio}

━━━━━━━━━━━━━━━━━━

✅ *¡Postulación registrada!*

La vacante que seleccionaste también fue registrada correctamente.

${
    comprobanteEnviado
        ? "📄 *Te enviamos tu comprobante de postulación en este chat.*"
        : "⚠️ La postulación quedó registrada, pero no fue posible enviar el comprobante en este momento."
}

Un asesor o reclutador podrá ponerse en contacto contigo.

⚠️ La postulación no garantiza la contratación.

¿Qué deseas hacer?

1️⃣ Buscar más vacantes
6️⃣ Menú principal
7️⃣ Salir
`;

                } else {

                    respuesta =
`🎉 *¡Registro completado correctamente!*

Tus datos fueron registrados en el Sistema Nacional de Empleo.

🆔 *Tu folio:*
${buscadorCreado.folio}

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


                siguientePaso =
                    "menu";


                console.log(
                    "✅ Registro definitivo creado correctamente."
                );


                console.log(
                    "🆔 ID:",
                    buscadorCreado.id
                );


                console.log(
                    "📄 Folio:",
                    buscadorCreado.folio
                );


            } catch (error) {

                console.error(
                    "🔴 Error al crear el registro definitivo:"
                );


                console.error(
                    error.message
                );


                respuesta =
`⚠️ Ocurrió un problema al finalizar tu registro.

No se creó el registro definitivo.

Tus datos siguen guardados temporalmente y puedes intentar nuevamente.

Cuando estés listo, vuelve a enviar tu código postal.`;


                siguientePaso =
                    "esperando_codigo_postal";
            }


            break;
        }



        default:

            respuesta =
`⚠️ No se encontró un paso de registro válido.

Escribe "inicio" para volver al menú principal.`;


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

    procesarRegistro

};
