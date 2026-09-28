const {
    obtenerEmpresas,
    obtenerEmpresaPorNombre,
    obtenerEstadisticasEmpresas
} = require("../services/empresas.service");


// =====================================================
// OBTENER EMPRESAS
// =====================================================

async function obtenerEmpresasController(req, res) {

    try {

        const empresas =
            await obtenerEmpresas();

        const estadisticas =
            await obtenerEstadisticasEmpresas();

        res.status(200).json({

            estadisticas,

            empresas

        });

    } catch (error) {

        console.error(
            "❌ Error al obtener empresas:",
            error
        );

        res.status(500).json({

            mensaje:
                "Error al obtener las empresas"

        });

    }

}


// =====================================================
// OBTENER EMPRESA POR NOMBRE
// =====================================================

async function obtenerEmpresaController(req, res) {

    try {

        const { nombre } = req.params;

        const vacantes =
            await obtenerEmpresaPorNombre(nombre);

        res.status(200).json({

            empresa: nombre,

            totalVacantes:
                vacantes.length,

            vacantes

        });

    } catch (error) {

        console.error(
            "❌ Error al obtener detalle de empresa:",
            error
        );

        res.status(500).json({

            mensaje:
                "Error al obtener la empresa"

        });

    }

}


module.exports = {

    obtenerEmpresasController,

    obtenerEmpresaController

};