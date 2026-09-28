const express = require("express");

const router = express.Router();

const {
    obtenerResumen,
    personasPorMunicipio,
    puestosMasSolicitados,
    vacantesPorMunicipio,
    vacantesPorArea,
    empresasConMasVacantes,
    demandaVsOferta,
    obtenerDashboard
} = require("../controllers/reportes.controller");


router.get(
    "/dashboard",
    obtenerDashboard
);

// ==========================================
// RESUMEN
// ==========================================

router.get(
    "/resumen",
    obtenerResumen
);


// ==========================================
// PERSONAS POR MUNICIPIO
// ==========================================

router.get(
    "/municipios",
    personasPorMunicipio
);


// ==========================================
// PUESTOS MÁS SOLICITADOS
// ==========================================

router.get(
    "/puestos",
    puestosMasSolicitados
);


// ==========================================
// VACANTES POR MUNICIPIO
// ==========================================

router.get(
    "/vacantes-municipio",
    vacantesPorMunicipio
);


// ==========================================
// VACANTES POR ÁREA
// ==========================================

router.get(
    "/areas",
    vacantesPorArea
);


// ==========================================
// EMPRESAS
// ==========================================

router.get(
    "/empresas",
    empresasConMasVacantes
);


// ==========================================
// DEMANDA VS OFERTA
// ==========================================

router.get(
    "/demanda-oferta",
    demandaVsOferta
);


module.exports = router;