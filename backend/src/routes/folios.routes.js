const express = require("express");

const router = express.Router();

const {

    obtenerDatosFolios,

    buscarFolioController,

    obtenerDetalleFolio,

    obtenerResumenFolios

} = require("../controllers/folios.controller");


// =====================================================
// BUSCAR POR FOLIO
// =====================================================

router.get(
    "/buscar/:folio",
    buscarFolioController
);


// =====================================================
// OBTENER LISTADO
// =====================================================

router.get(
    "/",
    obtenerDatosFolios
);


// =====================================================
// OBTENER POR ID
// =====================================================


router.get(
    "/resumen",
    obtenerResumenFolios
);

router.get(
    "/:id",
    obtenerDetalleFolio
);



module.exports = router;