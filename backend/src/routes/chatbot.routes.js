const express = require("express");
const router = express.Router();

const chatbotController = require("../controllers/chatbot.controller");


router.post("/mensaje", chatbotController.recibirMensaje);


module.exports = router;