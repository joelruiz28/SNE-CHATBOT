const {
    obtenerResumenReportes,
    obtenerPersonasPorMunicipio,
    obtenerPuestosMasSolicitados,
    obtenerVacantesPorMunicipio,
    obtenerVacantesPorArea,
    obtenerEmpresasConMasVacantes,
    obtenerDemandaVsOferta,
    obtenerDashboardReportes
} = require("../services/reportes.service");


// =====================================================
// RESUMEN
// =====================================================

async function obtenerResumen(req, res) {

    try {

        const datos =
            await obtenerResumenReportes();

        res.status(200).json(datos);

    } catch (error) {

        console.error(
            "❌ Error en resumen de reportes:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener el resumen de reportes"
        });

    }
}


// =====================================================
// PERSONAS POR MUNICIPIO
// =====================================================

async function personasPorMunicipio(req, res) {

    try {

        const datos =
            await obtenerPersonasPorMunicipio();

        res.status(200).json(datos);

    } catch (error) {

        console.error(
            "❌ Error personas por municipio:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener personas por municipio"
        });

    }
}


// =====================================================
// PUESTOS MÁS SOLICITADOS
// =====================================================

async function puestosMasSolicitados(req, res) {

    try {

        const datos =
            await obtenerPuestosMasSolicitados();

        res.status(200).json(datos);

    } catch (error) {

        console.error(
            "❌ Error puestos más solicitados:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener puestos solicitados"
        });

    }
}


// =====================================================
// VACANTES POR MUNICIPIO
// =====================================================

async function vacantesPorMunicipio(req, res) {

    try {

        const datos =
            await obtenerVacantesPorMunicipio();

        res.status(200).json(datos);

    } catch (error) {

        console.error(
            "❌ Error vacantes por municipio:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener vacantes por municipio"
        });

    }
}


// =====================================================
// VACANTES POR ÁREA
// =====================================================

async function vacantesPorArea(req, res) {

    try {

        const datos =
            await obtenerVacantesPorArea();

        res.status(200).json(datos);

    } catch (error) {

        console.error(
            "❌ Error vacantes por área:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener vacantes por área"
        });

    }
}


// =====================================================
// EMPRESAS
// =====================================================

async function empresasConMasVacantes(req, res) {

    try {

        const datos =
            await obtenerEmpresasConMasVacantes();

        res.status(200).json(datos);

    } catch (error) {

        console.error(
            "❌ Error empresas con más vacantes:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener empresas"
        });

    }
}


// =====================================================
// DEMANDA VS OFERTA
// =====================================================

async function demandaVsOferta(req, res) {

    try {

        const datos =
            await obtenerDemandaVsOferta();

        res.status(200).json(datos);

    } catch (error) {

        console.error(
            "❌ Error demanda vs oferta:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener demanda vs oferta"
        });

    }
}
// =====================================================
// DASHBOARD GENERAL
// =====================================================

async function obtenerDashboard(req, res) {

    try {

        const datos =
            await obtenerDashboardReportes();

        res.status(200).json(datos);

    } catch (error) {

        console.error(
            "❌ Error en dashboard de reportes:",
            error
        );

        res.status(500).json({

            mensaje:
                "Error al obtener dashboard de reportes"

        });

    }

}

module.exports = {
    obtenerResumen,
    personasPorMunicipio,
    puestosMasSolicitados,
    vacantesPorMunicipio,
    vacantesPorArea,
    empresasConMasVacantes,
    demandaVsOferta,
    obtenerDashboard
};