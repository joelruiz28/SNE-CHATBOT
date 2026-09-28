const express = require("express");

const router = express.Router();


const {
    obtenerDashboard
} = require("../controllers/dashboard.controller");


// ==========================================
// RUTA DEL DASHBOARD
// ==========================================

router.get(
    "/",
    obtenerDashboard
);


module.exports = router;