const express = require("express");

const router = express.Router();

const whatsappController = require("../controllers/whatsapp.controller");


// Verificación del webhook por Meta
router.get(
    "/webhook",
    whatsappController.verificarWebhook
);


// Recepción de mensajes desde WhatsApp
router.post(
    "/webhook",
    whatsappController.recibirWebhook
);


module.exports = router;