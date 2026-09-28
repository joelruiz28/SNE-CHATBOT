const express = require("express");

const {
    listarVacantes,
    obtenerVacante,
    cambiarEstadoVacante
} = require("../controllers/vacantes.controller");


const router = express.Router();


router.get("/", listarVacantes);

router.get("/:id", obtenerVacante);

router.put(
    "/:id/estado",
    cambiarEstadoVacante
);


module.exports = router;