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
    obtenerPostulacionPorBuscadorYVacante,
    obtenerDatosComprobante
} = require("../services/postulacion.service");

const {
    generarComprobantePostulacion
} = require("../services/comprobante.service");

const {
    subirDocumentoWhatsApp,
    enviarDocumentoWhatsApp
} = require("../services/whatsapp.service");

const {
    obtenerOpcionesEscolaridad,
    obtenerOpcionesDetalleVacante,
    obtenerOpcionesSinVacantes
} = require("../utils/opciones-vacantes");

const db = require("../config/database");


function interpretarClaveVacante(valor) {
    if (valor && typeof valor === "object") {
        const id = Number(valor.id);
        const origen = valor.origen || "postgresql";

        if (
            Number.isSafeInteger(id) &&
            id > 0 &&
            ["postgresql", "sqlserver"].includes(origen)
        ) {
            return { id, origen };
        }

        return null;
    }

    const texto = String(valor ?? "");

    // Compatibilidad con sesiones antiguas que solo guardaban el ID.
    if (/^\d+$/.test(texto)) {
        const id = Number(texto);

        return Number.isSafeInteger(id) && id > 0
            ? { id, origen: "postgresql" }
            : null;
    }

    const coincidencia = texto.match(
        /^(postgresql|sqlserver)_(\d+)$/
    );

    if (!coincidencia) {
        return null;
    }

    const id = Number(coincidencia[2]);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return null;
    }

    return {
        id,
        origen: coincidencia[1]
    };
}


function obtenerClaveSeleccion(vacante) {
    if (vacante.clave_seleccion) {
        return vacante.clave_seleccion;
    }

    const origen = vacante.origen_vacante || "postgresql";

    return `${origen}_${vacante.id}`;
}


function respuestaDespedida() {
    return `
👋 Gracias por utilizar el Sistema Nacional de Empleo.

Cuando necesites nuevamente nuestros servicios, aquí estaremos.

¡Hasta pronto!
`;
}


function respuestaDetalleVacante(vacante) {
    const salario = Number(vacante.salario);

    const salarioTexto =
        vacante.salario !== null &&
        vacante.salario !== undefined &&
        vacante.salario !== "" &&
        Number.isFinite(salario)
            ? salario.toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN",
                minimumFractionDigits: 2
            })
            : "No especificado";

    const ubicacion =
        [vacante.municipio, vacante.entidad]
            .filter(Boolean)
            .join(", ") || "No especificada";

    return `
📋 *DETALLE DE VACANTE*

💼 *Puesto:* ${vacante.puesto || "No especificado"}
🏢 *Empresa:* ${vacante.empresa || "No especificada"}
📍 *Ubicación:* ${ubicacion}
🎓 *Escolaridad requerida:* ${vacante.nivel_estudios || "No especificada"}
📚 *Experiencia:* ${vacante.experiencia || "No especificada"}
💰 *Salario:* ${salarioTexto}
👥 *Plazas disponibles:* ${vacante.numero_plazas ?? "No especificado"}
📅 *Vigencia:* ${vacante.vigencia || "No especificada"}

Selecciona una opción en el menú para continuar.
`;
}


async function buscarYPrepararVacantes(
    escolaridad,
    codigoPostal,
    telefono,
    datosTemporales
) {
    const ubicacion = await obtenerUbicacionPorCodigoPostal(
        codigoPostal
    );

    if (!ubicacion) {
        return {
            error: "ubicacion",
            respuesta: `
⚠️ No pudimos identificar tu municipio mediante tu código postal.

Verifica que tu código postal esté registrado correctamente.
`
        };
    }

    let vacantes = await buscarVacantes(escolaridad);

    vacantes = ordenarPorProximidad(
        vacantes,
        ubicacion.municipio
    );

    if (vacantes.length === 0) {
        return {
            error: "sin_vacantes",
            ubicacion,
            respuesta: `
😕 No encontramos vacantes activas para:

🎓 ${escolaridad}

📍 Tu ubicación:
${ubicacion.municipio}, ${ubicacion.entidad}

Puedes intentar con otro nivel de estudios.
`
        };
    }

    const vacantesMostrar = vacantes.slice(0, 10);

    datosTemporales.vacantes_encontradas =
        vacantesMostrar.map(obtenerClaveSeleccion);

    datosTemporales.municipio_busqueda =
        ubicacion.municipio;

    datosTemporales.entidad_busqueda =
        ubicacion.entidad;

    datosTemporales.escolaridad = escolaridad;

    await actualizarDatosTemporales(
        telefono,
        datosTemporales
    );

    return {
        error: null,
        ubicacion,
        vacantes: vacantesMostrar,
        respuesta: `
🔎 *Encontré ${vacantesMostrar.length} vacantes para ti*

🎓 *Escolaridad:*
${escolaridad}

📍 *Ubicación de tu perfil:*
${ubicacion.municipio}, ${ubicacion.entidad}

Selecciona una vacante para consultar sus detalles.
`
    };
}

async function procesarVacantes(
    sesion,
    mensaje,
    telefono
) {
    let respuesta = "";
    let siguientePaso = sesion.paso_actual;

    const datosTemporales = sesion.datos_temporales || {};

    let tipoRespuesta = null;
    let opcionesMenu = null;
    let vacantesRespuesta = null;
    let escolaridadRespuesta = null;
    let municipioRespuesta = null;
    let entidadRespuesta = null;
    let mostrarMenuPrincipal = false;

    mensaje = String(mensaje || "")
        .trim()
        .toLowerCase();

    switch (sesion.paso_actual) {
        case "esperando_escolaridad": {
            if (["menu_principal", "menu", "6"].includes(mensaje)) {
                respuesta = "Volviendo al menú principal...";
                siguientePaso = "menu";
                mostrarMenuPrincipal = true;
                break;
            }

            if (["salir", "7"].includes(mensaje)) {
                respuesta = respuestaDespedida();
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
                    escolaridad = "Preparatoria o vocacional";
                    break;

                case "4":
                    escolaridad = "Licenciatura";
                    break;

                default:
                    respuesta = "⚠️ Selecciona un grado de estudios de la lista.";
                    tipoRespuesta = "menu_interactivo";
                    opcionesMenu = obtenerOpcionesEscolaridad();
                    siguientePaso = "esperando_escolaridad";
                    break;
            }

            if (!escolaridad) {
                break;
            }

            datosTemporales.escolaridad = escolaridad;

            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );

            let codigoPostal = datosTemporales.codigo_postal;

            if (!codigoPostal) {
                let usuario = null;

                if (datosTemporales.usuario_autorizado_id) {
                    const resultado = await db.query(
                        `
                        SELECT id, codigo_postal
                        FROM buscadores_empleo
                        WHERE id = $1
                        LIMIT 1
                        `,
                        [datosTemporales.usuario_autorizado_id]
                    );

                    usuario = resultado.rows[0] || null;
                } else {
                    const resultado = await db.query(
                        `
                        SELECT id, codigo_postal
                        FROM buscadores_empleo
                        WHERE telefono = $1
                        LIMIT 1
                        `,
                        [telefono]
                    );

                    usuario = resultado.rows[0] || null;
                }

                if (usuario) {
                    codigoPostal = usuario.codigo_postal;
                }
            }

            if (!codigoPostal) {
                respuesta = `
📍 *Código postal*

Para mostrarte vacantes cercanas necesitamos conocer tu ubicación.

Escribe tu código postal de 5 dígitos. Por ejemplo: 29000.
`;
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "esperando_codigo_postal_busqueda";
                break;
            }

            const resultadoBusqueda =
                await buscarYPrepararVacantes(
                    escolaridad,
                    codigoPostal,
                    telefono,
                    datosTemporales
                );

            respuesta = resultadoBusqueda.respuesta;

            if (resultadoBusqueda.error === "ubicacion") {
                respuesta = "⚠️ No pudimos identificar tu ubicación. Escribe un código postal válido de 5 dígitos, por ejemplo 29000.";
                siguientePaso = "esperando_codigo_postal_busqueda";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                break;
            }

            if (resultadoBusqueda.error === "sin_vacantes") {
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionar_vacante";
                break;
            }

            tipoRespuesta = "lista_vacantes";
            vacantesRespuesta = resultadoBusqueda.vacantes;
            escolaridadRespuesta = escolaridad;
            municipioRespuesta =
                resultadoBusqueda.ubicacion.municipio;
            entidadRespuesta =
                resultadoBusqueda.ubicacion.entidad;

            siguientePaso = "seleccionar_vacante";
            break;
        }

        case "esperando_codigo_postal_busqueda": {
            if (["menu_principal", "menu", "6"].includes(mensaje)) {
                respuesta = "Volviendo al menú principal...";
                siguientePaso = "menu";
                mostrarMenuPrincipal = true;
                break;
            }

            if (["buscar_vacantes", "nueva_busqueda"].includes(mensaje)) {
                respuesta = "🎓 Selecciona tu último grado de estudios:";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesEscolaridad();
                siguientePaso = "esperando_escolaridad";
                break;
            }

            if (["salir", "7"].includes(mensaje)) {
                respuesta = respuestaDespedida();
                siguientePaso = "finalizado";
                break;
            }

            if (!/^\d{5}$/.test(mensaje)) {
                respuesta = `
⚠️ *Código postal no válido.*

El código postal debe tener exactamente 5 dígitos. Escríbelo nuevamente; por ejemplo: 29000.
`;
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "esperando_codigo_postal_busqueda";
                break;
            }

            const ubicacion = await obtenerUbicacionPorCodigoPostal(
                mensaje
            );

            if (!ubicacion) {
                respuesta = `
⚠️ *Código postal no encontrado.*

No pudimos identificar tu municipio mediante el código postal ${mensaje}. Verifica que sea correcto y escríbelo nuevamente.
`;
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "esperando_codigo_postal_busqueda";
                break;
            }

            datosTemporales.codigo_postal = mensaje;

            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );

            const escolaridad = datosTemporales.escolaridad;

            if (!escolaridad) {
                respuesta = "⚠️ No pudimos recuperar tu nivel de estudios. Regresaremos al menú principal.";
                siguientePaso = "menu";
                mostrarMenuPrincipal = true;
                break;
            }

            const resultadoBusqueda =
                await buscarYPrepararVacantes(
                    escolaridad,
                    mensaje,
                    telefono,
                    datosTemporales
                );

            respuesta = resultadoBusqueda.respuesta;

            if (resultadoBusqueda.error === "ubicacion") {
                respuesta = "⚠️ No pudimos identificar tu ubicación. Escribe un código postal válido de 5 dígitos, por ejemplo 29000.";
                siguientePaso = "esperando_codigo_postal_busqueda";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                break;
            }

            if (resultadoBusqueda.error === "sin_vacantes") {
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionar_vacante";
                break;
            }

            tipoRespuesta = "lista_vacantes";
            vacantesRespuesta = resultadoBusqueda.vacantes;
            escolaridadRespuesta = escolaridad;
            municipioRespuesta =
                resultadoBusqueda.ubicacion.municipio;
            entidadRespuesta =
                resultadoBusqueda.ubicacion.entidad;

            siguientePaso = "seleccionar_vacante";
            break;
        }

        case "seleccionar_vacante": {
            if (["menu_principal", "menu", "6"].includes(mensaje)) {
                respuesta = "Volviendo al menú principal...";
                siguientePaso = "menu";
                mostrarMenuPrincipal = true;
                break;
            }

            if (["buscar_vacantes", "nueva_busqueda"].includes(mensaje)) {
                respuesta = "🎓 Selecciona tu último grado de estudios:";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesEscolaridad();
                siguientePaso = "esperando_escolaridad";
                break;
            }

            if (["salir", "7"].includes(mensaje)) {
                respuesta = respuestaDespedida();
                siguientePaso = "finalizado";
                break;
            }

            const ids = datosTemporales.vacantes_encontradas || [];
            let claveVacante = null;

            if (mensaje.startsWith("vacante_")) {
                claveVacante = mensaje.slice("vacante_".length);

                if (!ids.includes(claveVacante)) {
                    respuesta = "⚠️ La vacante seleccionada no pertenece a esta búsqueda. Selecciona una opción para continuar.";
                    tipoRespuesta = "menu_interactivo";
                    opcionesMenu = obtenerOpcionesSinVacantes();
                    siguientePaso = "seleccionar_vacante";
                    break;
                }
            } else if (/^\d+$/.test(mensaje)) {
                const numero = Number(mensaje);

                if (numero < 1 || numero > ids.length) {
                    respuesta = "⚠️ Esa vacante no existe. Selecciona una opción del menú para continuar.";
                    tipoRespuesta = "menu_interactivo";
                    opcionesMenu = obtenerOpcionesSinVacantes();
                    siguientePaso = "seleccionar_vacante";
                    break;
                }

                claveVacante = ids[numero - 1];
            } else {
                respuesta = "⚠️ Selecciona una vacante de la lista o elige una opción del menú.";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionar_vacante";
                break;
            }

            const seleccion = interpretarClaveVacante(claveVacante);

            if (!seleccion) {
                respuesta = "⚠️ No pudimos identificar la vacante seleccionada. Puedes iniciar una nueva búsqueda.";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionar_vacante";
                break;
            }

            datosTemporales.vacante_seleccionada = seleccion;

            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );

            const vacante = await obtenerVacantePorId(
                seleccion.id,
                seleccion.origen
            );

            if (!vacante) {
                respuesta = "⚠️ No pudimos encontrar esa vacante. Puedes realizar una nueva búsqueda.";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionar_vacante";
                break;
            }

            respuesta = respuestaDetalleVacante(vacante);
            tipoRespuesta = "menu_interactivo";
            opcionesMenu = obtenerOpcionesDetalleVacante();
            siguientePaso = "detalle_vacante";
            break;
        }
        case "detalle_vacante": {
            switch (mensaje) {
                case "6":
                case "menu":
                case "menu_principal":
                    respuesta = "Volviendo al menú principal...";
                    siguientePaso = "menu";
                    mostrarMenuPrincipal = true;
                    break;

                case "7":
                case "salir":
                    respuesta = respuestaDespedida();
                    siguientePaso = "finalizado";
                    break;

                case "1":
                case "postularme_vacante": {
                    let buscadorId = null;

                    if (datosTemporales.usuario_autorizado_id) {
                        buscadorId =
                            datosTemporales.usuario_autorizado_id;
                    } else {
                        const resultado = await db.query(
                            `
                            SELECT id
                            FROM buscadores_empleo
                            WHERE telefono = $1
                            LIMIT 1
                            `,
                            [telefono]
                        );

                        buscadorId = resultado.rows[0]?.id || null;
                    }

                    if (!buscadorId) {
                        datosTemporales.registro_desde_postulacion = true;

                        await actualizarDatosTemporales(
                            telefono,
                            datosTemporales
                        );

                        respuesta = `
📝 *Registro necesario*

Para postularte a esta vacante necesitamos registrar tus datos en el Sistema Nacional de Empleo.

La vacante que seleccionaste se conservará durante el proceso.

Escribe tu CURP para comenzar el registro.
`;
                        tipoRespuesta = "menu_interactivo";
                        opcionesMenu = obtenerOpcionesSinVacantes();
                        siguientePaso = "esperando_curp";
                        break;
                    }

                    const seleccion = interpretarClaveVacante(
                        datosTemporales.vacante_seleccionada
                    );

                    if (!seleccion) {
                        respuesta = "⚠️ No pudimos identificar la vacante seleccionada. Puedes realizar una nueva búsqueda.";
                        tipoRespuesta = "menu_interactivo";
                        opcionesMenu = obtenerOpcionesSinVacantes();
                        siguientePaso = "seleccionar_vacante";
                        break;
                    }

                    let postulacion = await crearPostulacion(
                        buscadorId,
                        seleccion.id,
                        seleccion.origen
                    );

                    // Registrar si se creó una postulación nueva.
                    const postulacionNueva = Boolean(postulacion);

                    // Si ya existía, recuperar la postulación.
                    if (!postulacionNueva) {
                        postulacion =
                            await obtenerPostulacionPorBuscadorYVacante(
                                buscadorId,
                                seleccion.id,
                                seleccion.origen
                            );
                    }

                    if (!postulacion) {
                        respuesta = "⚠️ No pudimos recuperar los datos de tu postulación. Intenta nuevamente más tarde o inicia una nueva búsqueda.";
                        tipoRespuesta = "menu_interactivo";
                        opcionesMenu = obtenerOpcionesSinVacantes();
                        siguientePaso = "seleccionar_vacante";
                        break;
                    }

                    // Se conserva la ruta para eliminar el PDF
                    // incluso si falla la subida o el envío.
                    let rutaComprobanteTemporal = null;

                    try {
                        const datosComprobante =
                            await obtenerDatosComprobante(
                                postulacion.id
                            );

                        if (!datosComprobante) {
                            console.error(
                                "No se encontraron datos para generar el comprobante."
                            );
                        } else {
                            const comprobante =
                                await generarComprobantePostulacion(
                                    datosComprobante
                                );

                            rutaComprobanteTemporal =
                                comprobante.rutaArchivo;

                            console.log(
                                "Comprobante generado correctamente:",
                                comprobante.rutaArchivo
                            );

                            const mediaId =
                                await subirDocumentoWhatsApp(
                                    comprobante.rutaArchivo
                                );

                            await enviarDocumentoWhatsApp(
                                telefono,
                                mediaId,
                                comprobante.nombreArchivo,
                                "📄 Comprobante de postulación"
                            );

                            console.log(
                                "Comprobante enviado correctamente."
                            );
                        }
                    } catch (error) {
                        console.error(
                            "Error generando o enviando comprobante:"
                        );

                        console.error(
                            error.response?.data || error.message
                        );
                    } finally {
                        if (rutaComprobanteTemporal) {
                            const fs = require("fs");

                            try {
                                await fs.promises.unlink(
                                    rutaComprobanteTemporal
                                );

                                console.log(
                                    "PDF temporal eliminado correctamente."
                                );
                            } catch (error) {
                                if (error.code !== "ENOENT") {
                                    console.error(
                                        "No se pudo eliminar el PDF temporal:",
                                        error.message
                                    );
                                }
                            }
                        }
                    }

                    respuesta = postulacionNueva
                        ? `
✅ *¡Postulación registrada!*

Tu solicitud ha sido registrada correctamente.

📄 Hemos intentado enviarte tu comprobante de postulación por este medio.

📌 *Importante:*
El comprobante confirma el registro de tu solicitud. Un asesor o reclutador revisará tu información y podrá ponerse en contacto contigo.

⚠️ La postulación no garantiza la contratación.

Selecciona una opción del menú para continuar.
`
                        : `
ℹ️ *Ya te habías postulado a esta vacante.*

Tu solicitud ya se encuentra registrada. No creamos una postulación duplicada.

📄 Hemos intentado enviarte nuevamente el comprobante por este medio.

Selecciona una opción del menú para continuar.
`;

                    siguientePaso = "menu";
                    tipoRespuesta = "menu_interactivo";
                    opcionesMenu = obtenerOpcionesSinVacantes();
                    break;
                }

                case "2":
                case "buscar_vacantes":
                case "nueva_busqueda":
                    respuesta = "🎓 Selecciona tu último grado de estudios:";
                    tipoRespuesta = "menu_interactivo";
                    opcionesMenu = obtenerOpcionesEscolaridad();
                    siguientePaso = "esperando_escolaridad";
                    break;

                default:
                    respuesta = "⚠️ Selecciona una opción del menú para continuar.";
                    tipoRespuesta = "menu_interactivo";
                    opcionesMenu = obtenerOpcionesDetalleVacante();
                    siguientePaso = "detalle_vacante";
                    break;
            }

            break;
        }

        case "seleccionando_numero_vacante": {
            if (["menu_principal", "menu", "6"].includes(mensaje)) {
                respuesta = "Volviendo al menú principal...";
                siguientePaso = "menu";
                mostrarMenuPrincipal = true;
                break;
            }

            if (["buscar_vacantes", "nueva_busqueda"].includes(mensaje)) {
                respuesta = "🎓 Selecciona tu último grado de estudios:";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesEscolaridad();
                siguientePaso = "esperando_escolaridad";
                break;
            }

            if (["salir", "7"].includes(mensaje)) {
                respuesta = respuestaDespedida();
                siguientePaso = "finalizado";
                break;
            }

            if (!/^\d+$/.test(mensaje)) {
                respuesta = "⚠️ Selecciona una vacante de la lista para consultar sus detalles.";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionando_numero_vacante";
                break;
            }

            const numero = Number(mensaje);
            const ids = datosTemporales.vacantes_encontradas || [];

            if (numero < 1 || numero > ids.length) {
                respuesta = "⚠️ Esa vacante no existe. Selecciona una opción del menú para continuar.";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionando_numero_vacante";
                break;
            }

            const seleccion = interpretarClaveVacante(
                ids[numero - 1]
            );

            if (!seleccion) {
                respuesta = "⚠️ No pudimos identificar la vacante seleccionada. Inicia una nueva búsqueda.";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionar_vacante";
                break;
            }

            datosTemporales.vacante_seleccionada = seleccion;

            await actualizarDatosTemporales(
                telefono,
                datosTemporales
            );

            const vacante = await obtenerVacantePorId(
                seleccion.id,
                seleccion.origen
            );

            if (!vacante) {
                respuesta = "⚠️ No pudimos encontrar esa vacante. Inicia una nueva búsqueda.";
                tipoRespuesta = "menu_interactivo";
                opcionesMenu = obtenerOpcionesSinVacantes();
                siguientePaso = "seleccionar_vacante";
                break;
            }

            respuesta = respuestaDetalleVacante(vacante);
            tipoRespuesta = "menu_interactivo";
            opcionesMenu = obtenerOpcionesDetalleVacante();
            siguientePaso = "detalle_vacante";
            break;
        }

        default:
            respuesta = "⚠️ No pudimos identificar el paso actual. Regresaremos al menú principal.";
            siguientePaso = "menu";
            mostrarMenuPrincipal = true;
            break;
    }

    if (!respuesta || !respuesta.trim()) {
        console.error(
            "❌ procesarVacantes generó una respuesta vacía."
        );

        respuesta = "⚠️ Ocurrió un problema al procesar tu opción. Regresaremos al menú principal.";
        siguientePaso = "menu";
        mostrarMenuPrincipal = true;
    }

    return {
        respuesta,
        siguientePaso,
        tipoRespuesta,
        opcionesMenu,
        mostrarMenuPrincipal,
        vacantes: vacantesRespuesta,
        escolaridad: escolaridadRespuesta,
        municipio: municipioRespuesta,
        entidad: entidadRespuesta
    };
}

module.exports = {
    procesarVacantes
};      
