const express = require("express");

const router = express.Router();

const {
    obtenerEmpresasController,
    obtenerEmpresaController
} = require("../controllers/empresas.controller");


router.get(
    "/",
    obtenerEmpresasController
);


router.get(
    "/:nombre",
    obtenerEmpresaController
);


module.exports = router;