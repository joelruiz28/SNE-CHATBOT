const express = require("express");

const router = express.Router();

const {
    obtenerEmpresasController,
    obtenerEmpresaController
} = require("../controllers/empresas.controller");


// GET /api/empresas

router.get(
    "/",
    obtenerEmpresasController
);


// GET /api/empresas/:nombre

router.get(
    "/:nombre",
    obtenerEmpresaController
);


module.exports = router;