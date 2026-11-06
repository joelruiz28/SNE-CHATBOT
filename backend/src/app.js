const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");
const {
    sincronizarVacantesExternas
} = require("./services/vacantes-externas.service");
const {
    iniciarServicioInactividad
} = require("./services/inactividad.service");
const chatbotRoutes = require("./routes/chatbot.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const personasRoutes = require("./routes/personas.routes");
const vacantesRoutes = require("./routes/vacantes.routes");
const empresasRoutes = require("./routes/empresas.routes");
const foliosRoutes = require("./routes/folios.routes");
const reportesRoutes = require("./routes/reportes.routes");
const whatsappRoutes = require("./routes/whatsapp.routes");
const postulacionesRoutes = require("./routes/postulaciones.routes");

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

app.use("/api/postulaciones", postulacionesRoutes);

//sincornizacion de vacantes externas

const INTERVALO_SINCRONIZACION_VACANTES = 30 * 60 * 1000;

let sincronizacionVacantesEnCurso = false;

async function ejecutarSincronizacionVacantes(origen) {
    if (sincronizacionVacantesEnCurso) {
        console.log(
            "[SYNC VACANTES] Ya existe una sincronización en curso. Se omite esta ejecución."
        );
        return;
    }

    sincronizacionVacantesEnCurso = true;

    try {
        console.log(
            `[SYNC VACANTES] Sincronización automática iniciada: ${origen}`
        );

        const resultado = await sincronizarVacantesExternas(100);

        console.log(
            "[SYNC VACANTES] Sincronización automática completada:",
            resultado
        );
    } catch (error) {
        console.error(
            "[SYNC VACANTES] Error en la sincronización automática:",
            error.message
        );
    } finally {
        sincronizacionVacantesEnCurso = false;
    }
}

function iniciarSincronizacionAutomaticaVacantes() {
    // Primera sincronización al iniciar el servidor.
    ejecutarSincronizacionVacantes("inicio del servidor");

    // Sincronizaciones posteriores cada 30 minutos.
    setInterval(() => {
        ejecutarSincronizacionVacantes("intervalo de 30 minutos");
    }, INTERVALO_SINCRONIZACION_VACANTES);

    console.log(
        "[SYNC VACANTES] Sincronización automática programada cada 30 minutos."
    );
}



// Prueba de conexión PostgreSQL
db.query("SELECT NOW()")
.then(()=>{
    console.log("🟢 Base de datos funcionando");
})
.catch(err=>{
    console.log("🔴 Error DB:", err.message);
});



app.get("/", (req,res)=>{
    res.json({
        sistema:"SNE Chatbot",
        estado:"Activo"
    });
});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);

    // Sincronización automática de vacantes
    iniciarSincronizacionAutomaticaVacantes();

    // Control automático de sesiones por inactividad
    iniciarServicioInactividad();
});
