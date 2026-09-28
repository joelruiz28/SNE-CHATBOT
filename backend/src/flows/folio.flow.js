
const {
    obtenerUsuarioPorFolio,
    buscarVacantesPorPuesto,
    buscarVacantesPorPuestoPorId
} = require("../services/buscador.service");

async function procesarFolio(
    sesion,
    mensaje,
    telefono
) {

    let respuesta = "";
    let siguientePaso = sesion.paso_actual;


    const datosTemporales =
        sesion?.datos_temporales || {};

    const seguridadVerificada =
        datosTemporales.seguridad_verificada === true;

    const usuarioAutorizadoId =
        datosTemporales.usuario_autorizado_id;




    switch (sesion.paso_actual) {

        case "consultar_folio": {

            const folio =
                mensaje.trim().toUpperCase();


            if (
                !/^SNE-\d{4}-\d{6}$/.test(folio)
            ) {

                respuesta =
`⚠️ El folio no tiene un formato válido.

Ejemplo:

SNE-2026-000001

Por favor, escribe nuevamente tu folio.

6️⃣ Menú principal
7️⃣ Salir`;

                siguientePaso =
                    "consultar_folio";

                break;
            }


            try {

                const usuario =
                    await obtenerUsuarioPorFolio(
                        folio
                    );



                if (!usuario) {

                    respuesta =
`❌ No encontramos ningún usuario con el folio:

${folio}

Verifica que hayas escrito correctamente tu folio.

Ejemplo:

SNE-2026-000001

6️⃣ Menú principal
7️⃣ Salir`;

                    siguientePaso =
                        "consultar_folio";

                    break;
                }



                respuesta =
`📄 *INFORMACIÓN DE TU FOLIO*

━━━━━━━━━━━━━━━━━━

🆔 *Folio:*
${usuario.folio || "No registrado"}

👤 *DATOS PERSONALES*

Nombre:
${usuario.nombre_completo || "No registrado"}

CURP:
${usuario.curp || "No registrado"}

Fecha de nacimiento:
${
    usuario.fecha_nacimiento
        ? new Date(
            usuario.fecha_nacimiento
        ).toLocaleDateString(
            "es-MX"
        )
        : "No registrado"
}

Sexo:
${usuario.sexo || "No registrado"}

📱 Teléfono:
${usuario.telefono || "No registrado"}

📧 Correo:
${usuario.correo || "No registrado"}

📍 Municipio:
${usuario.municipio || "No registrado"}

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Actualizar datos
2️⃣ Buscar vacantes
6️⃣ Menú principal
7️⃣ Salir`;


                siguientePaso =
                    "folio_opciones";

            } catch (error) {

                console.error(
                    "❌ ERROR AL CONSULTAR FOLIO:",
                    error
                );


                respuesta =
`❌ Ocurrió un error al consultar tu folio.

Por favor, intenta nuevamente más tarde.

6️⃣ Menú principal
7️⃣ Salir`;


                siguientePaso =
                    "consultar_folio";
            }

            break;
        }



        case "folio_opciones": {

            switch (
                mensaje.trim()
            ) {


                case "1": {

                    respuesta =
`✏️ *¿Qué dato deseas actualizar?*

1️⃣ Correo
2️⃣ Código postal

6️⃣ Menú principal
7️⃣ Salir`;


                    siguientePaso =
                        "seleccionar_actualizacion";

                    break;
                }



                case "2": { respuesta = 
                    
                    `🔎 *Buscar vacantes* 

                🎓 Selecciona tu nivel de estudios:
                    1️⃣ Primaria
                    2️⃣ Secundaria 
                    3️⃣ Preparatoria o vocacional
                    4️⃣ Licenciatura 
                    6️⃣ Menú principal
                    7️⃣ Salir`; 
                    
                    siguientePaso = "esperando_escolaridad"; 
                        break;
                     }

                case "6":

                    respuesta =
`📋 *Menú principal*

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


                case "7":

                    respuesta =
`👋 Gracias por utilizar el asistente SNE.

Cuando necesites realizar otra consulta, puedes escribir *inicio*.`;


                    siguientePaso =
                        "finalizado";

                    break;


                default:

                    respuesta =
`⚠️ Opción no válida.

¿Qué deseas hacer?

1️⃣ Actualizar datos
2️⃣ Buscar vacantes
6️⃣ Menú principal
7️⃣ Salir`;


                    siguientePaso =
                        "folio_opciones";

                    break;
            }

            break;
        }



        case "buscar_vacantes": {

            try {

                let textoVacantes;



                if (
                    seguridadVerificada &&
                    usuarioAutorizadoId
                ) {

                    console.log(
                        "🔐 Usuario autorizado: buscando vacantes por ID."
                    );


                    console.log(
                        "🆔 ID autorizado:",
                        usuarioAutorizadoId
                    );


                    textoVacantes =
                        await buscarVacantesPorPuestoPorId(
                            usuarioAutorizadoId
                        );

                }


                else {

                    console.log(
                        "📱 Usuario normal: buscando vacantes por teléfono."
                    );


                    textoVacantes =
                        await buscarVacantesPorPuesto(
                            telefono
                        );
                }


                respuesta =
`${textoVacantes}

━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?

1️⃣ Buscar nuevamente
6️⃣ Menú principal
7️⃣ Salir`;


                siguientePaso =
                    "opciones_vacantes";

            } catch (error) {

                console.error(
                    "❌ ERROR AL BUSCAR VACANTES:",
                    error
                );


                respuesta =
`❌ Ocurrió un error al buscar vacantes.

Por favor, intenta nuevamente más tarde.

6️⃣ Menú principal
7️⃣ Salir`;


                siguientePaso =
                    "menu";
            }

            break;
        }


        case "opciones_vacantes":

            switch (
                mensaje.trim()
            ) {



                case "1":

                    respuesta =
`🔎 Buscando nuevamente vacantes relacionadas con tu perfil...`;


                    siguientePaso =
                        "buscar_vacantes";

                    break;

                case "6":

                    respuesta =
`📋 *Menú principal*

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

                case "7":

                    respuesta =
`👋 Gracias por utilizar el asistente SNE.

Cuando necesites realizar otra consulta, puedes escribir *inicio*.`;


                    siguientePaso =
                        "finalizado";

                    break;

                default:

                    respuesta =
`⚠️ Opción no válida.

Selecciona:

1️⃣ Buscar nuevamente
6️⃣ Menú principal
7️⃣ Salir`;


                    siguientePaso =
                        "opciones_vacantes";

                    break;
            }

            break;


        default:

            respuesta =
`⚠️ No se encontró un proceso válido.

6️⃣ Menú principal
7️⃣ Salir`;


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
    procesarFolio
};

