const express = require("express");

const router = express.Router();

const {

    obtenerDatosFolios,

    buscarFolioController,

    obtenerDetalleFolio,

    obtenerResumenFolios

} = require("../controllers/folios.controller");



router.get(
    "/buscar/:folio",
    buscarFolioController
);


router.get(
    "/",
    obtenerDatosFolios
);



router.get(
    "/resumen",
    obtenerResumenFolios
);

router.get(
    "/:id",
    obtenerDetalleFolio
);



module.exports = router;