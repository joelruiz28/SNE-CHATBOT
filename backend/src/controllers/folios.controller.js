const {
    obtenerEstadisticasFolios,
    obtenerFolios,
    obtenerFoliosRecientes,
    buscarFolio,
    obtenerFolioPorId
} = require("../services/folios.service");

// =====================================================
// OBTENER DATOS DE FOLIOS
// =====================================================

async function obtenerDatosFolios(req, res) {

    try {

        const estadisticas =
            await obtenerEstadisticasFolios();


        const folios =
            await obtenerFolios();


        res.status(200).json({

            estadisticas,

            folios

        });

    } catch (error) {

        console.error(
            "❌ Error al obtener folios:",
            error
        );


        res.status(500).json({

            mensaje:
                "Error al obtener los folios"

        });

    }

}


// =====================================================
// BUSCAR FOLIO
// =====================================================

async function buscarFolioController(req, res) {

    try {

        const { folio } =
            req.params;


        if (!folio) {

            return res.status(400).json({

                mensaje:
                    "Debes proporcionar un folio."

            });

        }


        const usuario =
            await buscarFolio(folio);


        if (!usuario) {

            return res.status(404).json({

                mensaje:
                    "No se encontró ningún registro con ese folio."

            });

        }


        res.status(200).json({

            folio: usuario

        });

    } catch (error) {

        console.error(
            "❌ Error al buscar folio:",
            error
        );


        res.status(500).json({

            mensaje:
                "Error al buscar el folio."

        });

    }

}


// =====================================================
// OBTENER FOLIO POR ID
// =====================================================

async function obtenerDetalleFolio(req, res) {

    try {

        const { id } =
            req.params;


        const folio =
            await obtenerFolioPorId(id);


        if (!folio) {

            return res.status(404).json({

                mensaje:
                    "No se encontró el folio"

            });

        }


        res.status(200).json({

            folio

        });

    } catch (error) {

        console.error(
            "❌ Error al obtener detalle del folio:",
            error
        );


        res.status(500).json({

            mensaje:
                "Error al obtener el detalle del folio"

        });

    }

}
// =====================================================
// RESUMEN DE FOLIOS
// =====================================================

async function obtenerResumenFolios(req, res) {

    try {

        const estadisticas =
            await obtenerEstadisticasFolios();

        const foliosRecientes =
            await obtenerFoliosRecientes();


        res.status(200).json({

            estadisticas,

            foliosRecientes

        });


    } catch (error) {

        console.error(
            "❌ Error al obtener resumen de folios:",
            error
        );

        res.status(500).json({

            mensaje:
                "Error al obtener información de folios."

        });

    }

}

// =====================================================
// EXPORTAR
// =====================================================

module.exports = {

    obtenerDatosFolios,

    buscarFolioController,

    obtenerDetalleFolio,

    obtenerResumenFolios

};