const {
    obtenerEstadisticasDashboard,
    obtenerRegistrosRecientes
} = require("../services/dashboard.service");


async function obtenerDashboard(req, res) {

    try {

        const estadisticas =
            await obtenerEstadisticasDashboard();

        const registrosRecientes =
            await obtenerRegistrosRecientes();


        res.status(200).json({
            estadisticas,
            registrosRecientes
        });

    } catch (error) {

        console.error(
            "Error al obtener datos del dashboard:",
            error
        );

        res.status(500).json({
            mensaje:
                "Error al obtener los datos del dashboard"
        });

    }

}


module.exports = {
    obtenerDashboard
};