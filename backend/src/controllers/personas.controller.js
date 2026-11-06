const {
    obtenerPersonas,
    obtenerPersonaPorId
} = require("../services/personas.service");


async function listarPersonas(req, res) {

    try {

        const personas = await obtenerPersonas();

        res.status(200).json({
            total: personas.length,
            personas
        });

    } catch (error) {

        console.error(
            "❌ Error al obtener personas:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener las personas"
        });

    }
}


async function obtenerPersona(req, res) {

    try {

        const { id } = req.params;

        const persona =
            await obtenerPersonaPorId(id);

        if (!persona) {

            return res.status(404).json({
                mensaje: "Persona no encontrada"
            });

        }

        res.status(200).json(persona);

    } catch (error) {

        console.error(
            "❌ Error al obtener persona:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener la persona"
        });

    }
}


module.exports = {
    listarPersonas,
    obtenerPersona
};