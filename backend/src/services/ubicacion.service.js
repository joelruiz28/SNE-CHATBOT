const db = require("../config/database");



async function obtenerUbicacionPorCodigoPostal(codigoPostal) {

    if (!codigoPostal) {
        return null;
    }

    const resultado = await db.query(
        `
        SELECT
            codigo_postal,
            entidad,
            municipio
        FROM zonas_postales_sne
        WHERE codigo_postal = $1
        LIMIT 1
        `,
        [
            codigoPostal.toString().trim()
        ]
    );

    return resultado.rows[0] || null;
}


function obtenerPrioridadProximidad(
    municipioUsuario,
    municipioVacante,
    entidadVacante
) {

    const usuario = municipioUsuario
        ?.toString()
        .trim()
        .toUpperCase();

    const vacante = municipioVacante
        ?.toString()
        .trim()
        .toUpperCase();

    const entidad = entidadVacante
        ?.toString()
        .trim()
        .toUpperCase();


    // =================================================
    // MISMO MUNICIPIO
    // =================================================

    if (usuario === vacante) {
        return 0;
    }


    // =================================================
    // ORDEN DE PROXIMIDAD
    // =================================================

    const proximidad = {

        "PALENQUE": [
            "PALENQUE",
            "OCOSINGO",
            "BENEMERITO DE LAS AMERICAS",
            "COMITAN DE DOMINGUEZ",
            "SAN CRISTOBAL DE LAS CASAS",
            "TUXTLA GUTIERREZ",
            "CHIAPA DE CORZO",
            "TAPACHULA"
        ],

        "OCOSINGO": [
            "OCOSINGO",
            "PALENQUE",
            "BENEMERITO DE LAS AMERICAS",
            "SAN CRISTOBAL DE LAS CASAS",
            "COMITAN DE DOMINGUEZ",
            "TUXTLA GUTIERREZ",
            "CHIAPA DE CORZO",
            "TAPACHULA"
        ],

        "BENEMERITO DE LAS AMERICAS": [
            "BENEMERITO DE LAS AMERICAS",
            "PALENQUE",
            "OCOSINGO",
            "COMITAN DE DOMINGUEZ",
            "SAN CRISTOBAL DE LAS CASAS",
            "TUXTLA GUTIERREZ",
            "CHIAPA DE CORZO",
            "TAPACHULA"
        ],

        "COMITAN DE DOMINGUEZ": [
            "COMITAN DE DOMINGUEZ",
            "SAN CRISTOBAL DE LAS CASAS",
            "CHIAPA DE CORZO",
            "TUXTLA GUTIERREZ",
            "OCOSINGO",
            "PALENQUE",
            "TAPACHULA"
        ],

        "SAN CRISTOBAL DE LAS CASAS": [
            "SAN CRISTOBAL DE LAS CASAS",
            "COMITAN DE DOMINGUEZ",
            "TUXTLA GUTIERREZ",
            "CHIAPA DE CORZO",
            "OCOSINGO",
            "PALENQUE",
            "TAPACHULA"
        ],

        "TUXTLA GUTIERREZ": [
            "TUXTLA GUTIERREZ",
            "CHIAPA DE CORZO",
            "SAN CRISTOBAL DE LAS CASAS",
            "COMITAN DE DOMINGUEZ",
            "OCOSINGO",
            "PALENQUE",
            "TAPACHULA"
        ],

        "CHIAPA DE CORZO": [
            "CHIAPA DE CORZO",
            "TUXTLA GUTIERREZ",
            "SAN CRISTOBAL DE LAS CASAS",
            "COMITAN DE DOMINGUEZ",
            "OCOSINGO",
            "PALENQUE",
            "TAPACHULA"
        ],

        "TAPACHULA": [
            "TAPACHULA",
            "COMITAN DE DOMINGUEZ",
            "SAN CRISTOBAL DE LAS CASAS",
            "TUXTLA GUTIERREZ",
            "CHIAPA DE CORZO",
            "OCOSINGO",
            "PALENQUE"
        ]

    };


    const lista = proximidad[usuario];


    // =================================================
    // MUNICIPIO CONOCIDO
    // =================================================

    if (lista) {

        const posicion = lista.indexOf(vacante);

        if (posicion !== -1) {
            return posicion;
        }

    }


    // =================================================
    // OTRO MUNICIPIO DE CHIAPAS
    // =================================================

    if (entidad === "CHIAPAS") {
        return 50;
    }


    // =================================================
    // OTRO ESTADO
    // =================================================

    return 100;
}


// =====================================================
// ORDENAR VACANTES POR PROXIMIDAD
// =====================================================

function ordenarPorProximidad(
    vacantes,
    municipioUsuario
) {

    return vacantes
        .map(vacante => {

            const prioridad =
                obtenerPrioridadProximidad(
                    municipioUsuario,
                    vacante.municipio,
                    vacante.entidad
                );

            return {
                ...vacante,
                prioridad_proximidad: prioridad
            };

        })
        .sort((a, b) => {

            // Primero la cercanía
            if (
                a.prioridad_proximidad !==
                b.prioridad_proximidad
            ) {

                return (
                    a.prioridad_proximidad -
                    b.prioridad_proximidad
                );

            }

            // Si están igual de cerca,
            // mostrar primero la más reciente
            return (
                new Date(b.fecha_publicacion) -
                new Date(a.fecha_publicacion)
            );

        });

}




module.exports = {

    obtenerUbicacionPorCodigoPostal,

    obtenerPrioridadProximidad,

    ordenarPorProximidad

};