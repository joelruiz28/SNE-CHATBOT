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


router.get(
    "/resumen",
    obtenerResumen
);


router.get(
    "/municipios",
    personasPorMunicipio
);

router.get(
    "/puestos",
    puestosMasSolicitados
);


router.get(
    "/vacantes-municipio",
    vacantesPorMunicipio
);

router.get(
    "/areas",
    vacantesPorArea
);



router.get(
    "/empresas",
    empresasConMasVacantes
);



router.get(
    "/demanda-oferta",
    demandaVsOferta
);


module.exports = router;