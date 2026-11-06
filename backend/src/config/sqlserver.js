const sql = require("mssql");
require("dotenv").config();

const config = {
    server: process.env.SQLSERVER_SERVER,
    port: Number(process.env.SQLSERVER_PORT || 1433),
    database: process.env.SQLSERVER_DATABASE,
    user: process.env.SQLSERVER_USER,
    password: process.env.SQLSERVER_PASSWORD,
    options: {
        encrypt: process.env.SQLSERVER_ENCRYPT !== "false",
        trustServerCertificate:
            process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE === "true"
    },
    connectionTimeout: 15000,
    requestTimeout: 15000
};

const pool = new sql.ConnectionPool(config);

// Iniciar la conexión una sola vez y reutilizarla.
const poolConectado = pool.connect().catch(error => {
    console.error("Error al conectar con SQL Server:", error.message);
    throw error;
});

// Permitir que el repositorio espere a que la conexión esté lista.
pool.poolConectado = poolConectado;

module.exports = pool;

