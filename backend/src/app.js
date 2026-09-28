const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");
const chatbotRoutes = require("./routes/chatbot.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const personasRoutes = require("./routes/personas.routes");
const vacantesRoutes = require("./routes/vacantes.routes");
const empresasRoutes = require("./routes/empresas.routes");
const foliosRoutes = require("./routes/folios.routes");
const reportesRoutes = require("./routes/reportes.routes");
const whatsappRoutes = require("./routes/whatsapp.routes");

const app = express();


// Middlewares
app.use(cors());
app.use(express.json());


// Rutas 
app.use("/api/chatbot", chatbotRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/personas", personasRoutes);

app.use("/api/vacantes", vacantesRoutes);

app.use("/api/empresas", empresasRoutes);

app.use("/api/folios", foliosRoutes);

app.use("/api/reportes", reportesRoutes);

app.use("/api/whatsapp", whatsappRoutes);


// Prueba de conexión PostgreSQL
db.query("SELECT NOW()")
.then(()=>{
    console.log("🟢 Base de datos funcionando");
})
.catch(err=>{
    console.log("🔴 Error DB:", err.message);
});


// Ruta de prueba
app.get("/", (req,res)=>{
    res.json({
        sistema:"SNE Chatbot",
        estado:"Activo"
    });
});


// Puerto
const PORT = process.env.PORT || 3000;


app.listen(PORT,()=>{
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});