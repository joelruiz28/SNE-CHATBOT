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
    enviarMensajeWhatsApp
} = require("../services/whatsapp.service");

const {
    validarNombre,
    validarCURP,
    convertirFecha
} = require("../utils/validaciones");

const {
    crearPostulacion
} = require("../services/postulacion.service");

const {
    sexo
} = require("../utils/catalogos");

const {
    generarMenu
} = require("../utils/menu");


// =====================================================
// GENERAR CÓDIGO DE SEGURIDAD
// =====================================================

function generarCodigoSeguridad() {

    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();

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

// =====================================================
// PROCESAR REGISTRO
// =====================================================

async function procesarRegistro(
    sesion,
    mensaje,
    telefono
) {

    let respuesta = "";
let siguientePaso = sesion.paso_actual;
let postulacionAutomatica = false;

let datosTemporales =
    sesion.datos_temporales || {};


    // =================================================
    // LEER DATOS TEMPORALES
    // =================================================

    if (typeof datosTemporales === "string") {

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


    // =================================================
    // PROCESAR PASOS
    // =================================================

    switch (sesion.paso_actual) {


        // =============================================
        // ESPERANDO CURP
        // =============================================

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


            // =========================================
            // BUSCAR CURP
            // =========================================

            const buscadorExistente =
                await buscarPorCURP(curp);


            // =========================================
            // CURP YA EXISTE
            // =========================================

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


                
if (
    buscadorExistente.telefono ===
    telefono
) {

    // =====================================
    // VERIFICAR SI EL PERFIL ESTÁ COMPLETO
    // =====================================

    const perfilCompleto =
        buscadorExistente.nombre_completo?.trim() &&
        buscadorExistente.curp?.trim() &&
        buscadorExistente.fecha_nacimiento &&
        buscadorExistente.sexo?.trim() &&
        buscadorExistente.telefono?.trim() &&
        buscadorExistente.correo?.trim() &&
        buscadorExistente.codigo_postal?.trim();


    // =====================================
    // PERFIL COMPLETO
    // =====================================

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

    // =====================================
    // PERFIL INCOMPLETO
    // =====================================

    datosTemporales.curp =
        curp;

    datosTemporales.usuario_existente_id =
        buscadorExistente.id;

    datosTemporales.completando_perfil =
        true;


    // =====================================
    // DETECTAR DATO FALTANTE
    // =====================================

    const siguiente =
        obtenerSiguientePasoPerfil(
            buscadorExistente
        );


    await actualizarDatosTemporales(
        telefono,
        datosTemporales
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

        respuesta = `
✅ Tu perfil ya está completo.
`;

        siguientePaso =
            "menu";
    }
}


    break;
}


                // =====================================
                // TELÉFONO DIFERENTE
                // =====================================

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


                // =====================================
                // GUARDAR DATOS TEMPORALES
                // =====================================

                await actualizarDatosTemporales(
                    telefono,
                    datosTemporales
                );


                // =====================================
                // ENVIAR CÓDIGO AL TELÉFONO ORIGINAL
                // =====================================

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


                    // Limpiamos datos temporales
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


                // =====================================
                // RESPUESTA AL NUEVO NÚMERO
                // =====================================

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


            // =========================================
            // CURP NUEVA
            // =========================================

            datosTemporales.curp = curp;


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


// =============================================
// ESPERANDO CÓDIGO DE SEGURIDAD
// =============================================

case "esperando_codigo_seguridad": {

    const codigoIngresado =
        mensaje
            .trim()
            .replace(/\s/g, "");


    // =========================================
    // VALIDAR FORMATO
    // =========================================

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


    // =========================================
    // VERIFICAR EXISTENCIA DEL CÓDIGO
    // =========================================

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


    // =========================================
    // VERIFICAR EXPIRACIÓN
    // =========================================

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


    // =========================================
    // VERIFICAR INTENTOS
    // =========================================

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


    // =========================================
    // COMPARAR CÓDIGO
    // =========================================

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


    // =========================================
    // BUSCAR REGISTRO AUTORIZADO
    // =========================================

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


    // =========================================
    // CÓDIGO CORRECTO
    // =========================================

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


    // =========================================
    // GUARDAR AUTORIZACIÓN TEMPORAL
    // =========================================

    datosTemporales.seguridad_verificada =
        true;


    datosTemporales.fecha_autorizacion =
        Date.now();


    datosTemporales.usuario_autorizado_id =
        usuarioAutorizado.id;


    datosTemporales.telefono_registrado =
        usuarioAutorizado.telefono;


    // =========================================
    // ELIMINAR DATOS DEL CÓDIGO
    // =========================================

    delete datosTemporales.codigo_seguridad;

    delete datosTemporales.codigo_expira;

    delete datosTemporales.intentos_codigo;


    // =========================================
    // GUARDAR SESIÓN AUTORIZADA
    // =========================================

    await actualizarDatosTemporales(
        telefono,
        datosTemporales
    );


    // =========================================
    // RESPUESTA
    // =========================================

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
4️⃣ Consultar mi folio
5️⃣ Hablar con un asesor
6️⃣ Menú principal
7️⃣ Salir`;


    siguientePaso =
        "menu";


    break;
}

// =============================================
// ESPERANDO NOMBRE
// =============================================

case "esperando_nombre": {

    const nombre =
        mensaje
            .trim()
            .replace(/\s+/g, " ");


    // =========================================
    // VALIDAR NOMBRE
    // =========================================

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


    // =========================================
    // GUARDAR NOMBRE
    // =========================================

    datosTemporales.nombre_completo =
        nombre;


    await actualizarDatosTemporales(
        telefono,
        datosTemporales
    );


    // =========================================
    // RESPUESTA
    // =========================================

    respuesta =
`📅 ¿Cuál es tu fecha de nacimiento?

Puedes escribirla, por ejemplo:

08 de noviembre de 2003`;


    siguientePaso =
        "esperando_fecha";


    break;
}

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


    // =============================================
    // RECUPERACIÓN DE PERFIL EXISTENTE
    // =============================================

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

            await actualizarDatosTemporales(
                telefono,
                {}
            );

            respuesta = `
🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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
        }

        break;
    }


    // =============================================
    // REGISTRO NORMAL
    // =============================================

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


        // =============================================
        // ESPERANDO FECHA
        // =============================================

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


    // =============================================
    // RECUPERACIÓN DE PERFIL EXISTENTE
    // =============================================

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

            await actualizarDatosTemporales(
                telefono,
                {}
            );

            respuesta = `
🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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
        }

        break;
    }


    // =============================================
    // REGISTRO NORMAL
    // =============================================

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


        // =============================================
        // ESPERANDO SEXO
        // =============================================

        case "esperando_sexo": {

    if (!sexo[mensaje]) {

        respuesta =
`⚠️ Selecciona una opción válida:

${generarMenu(sexo)}`;

        break;
    }


    const sexoSeleccionado =
        sexo[mensaje];


    // =============================================
    // RECUPERACIÓN DE PERFIL EXISTENTE
    // =============================================

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

            await actualizarDatosTemporales(
                telefono,
                {}
            );

            respuesta = `
🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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
        }

        break;
    }


    // =============================================
    // REGISTRO NORMAL
    // =============================================

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


        // =============================================
        // ESPERANDO CORREO
        // =============================================

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


    // =============================================
    // RECUPERACIÓN DE PERFIL EXISTENTE
    // =============================================

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

            // =====================================
            // PERFIL YA COMPLETO
            // =====================================

            await actualizarDatosTemporales(
                telefono,
                {}
            );


            respuesta = `
🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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
        }


        break;
    }


    // =============================================
    // REGISTRO NORMAL
    // =============================================

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


        // =============================================
        // ESPERANDO CÓDIGO POSTAL
        // =============================================

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


    // =============================================
    // RECUPERACIÓN DE PERFIL EXISTENTE
    // =============================================

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

            // =====================================
            // PERFIL COMPLETADO
            // =====================================

            await actualizarDatosTemporales(
                telefono,
                {}
            );


            respuesta = `
🎉 *¡Perfil completado correctamente!*

Tu folio es:

🆔 ${buscadorActualizado.folio}

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
        }


        break;
    }


    // =============================================
    // REGISTRO NORMAL
    // =============================================

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


        // =========================================
        // USUARIO EXISTENTE
        // =========================================

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

            // =========================================
            // CURP NUEVA
            // =========================================

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


        // =============================================
       // POSTULACIÓN AUTOMÁTICA
       // =============================================
if (
    datosTemporales.registro_desde_postulacion &&
    datosTemporales.vacante_seleccionada
) {

    console.log(
        "📝 Creando postulación automática..."
    );

    const postulacion =
        await crearPostulacion(
            buscadorCreado.id,
            datosTemporales.vacante_seleccionada
        );

    if (postulacion) {

        postulacionAutomatica = true;

        console.log(
            "✅ Postulación creada correctamente."
        );

        console.log(
            "🆔 Postulación:",
            postulacion.id
        );

        console.log(
            "🆔 Vacante:",
            datosTemporales.vacante_seleccionada
        );

    } else {

        console.log(
            "ℹ️ La postulación ya estaba registrada."
        );

        postulacionAutomatica = true;
    }
}


        await actualizarDatosTemporales(
            telefono,
            {}
        );


        if (postulacionAutomatica) {

    respuesta = `
🎉 *¡Registro completado correctamente!*

Tus datos fueron registrados en el Sistema Nacional de Empleo.

🆔 *Tu folio:*
${buscadorCreado.folio}

━━━━━━━━━━━━━━━━━━

✅ *¡Postulación exitosa!*

La vacante que seleccionaste también fue registrada correctamente.

Un asesor o reclutador podrá ponerse en contacto contigo.

⚠️ La postulación no garantiza la contratación.

¿Qué deseas hacer?

1️⃣ Buscar más vacantes
2️⃣ Menú principal
7️⃣ Salir
`;

} else {

    respuesta = `
🎉 *¡Registro completado correctamente!*

Tus datos fueron registrados en el Sistema Nacional de Empleo.

🆔 *Tu folio:*
${buscadorCreado.folio}

¿Qué deseas hacer?

1️⃣ Buscar vacantes
2️⃣ Ver mis datos
3️⃣ Actualizar mis datos
4️⃣ Consultar mi folio
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