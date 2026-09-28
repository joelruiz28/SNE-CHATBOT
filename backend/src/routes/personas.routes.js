const express = require("express");

const {
    listarPersonas,
    obtenerPersona
} = require("../controllers/personas.controller");


const router = express.Router();


// Obtener todas las personas
router.get("/", listarPersonas);


// Obtener una persona específica
router.get("/:id", obtenerPersona);


module.exports = router;