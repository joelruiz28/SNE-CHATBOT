const {
    obtenerVacantes,
    obtenerVacantePorId
} = require("../services/vacantes.service");


async function listarVacantes(req, res) {

    try {

        const vacantes = await obtenerVacantes();

        res.status(200).json({
            total: vacantes.length,
            vacantes
        });

    } catch (error) {

        console.error(
            " Error al obtener vacantes:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener las vacantes"
        });

    }
}


async function obtenerVacante(req, res) {

    try {

        const { id } = req.params;

        const vacante =
            await obtenerVacantePorId(id);


        if (!vacante) {

            return res.status(404).json({
                mensaje: "Vacante no encontrada"
            });

        }


        res.status(200).json(vacante);

    } catch (error) {

        console.error(
            " Error al obtener vacante:",
            error
        );

        res.status(500).json({
            mensaje: "Error al obtener la vacante"
        });

    }
}


async function cambiarEstadoVacante(req, res) {

    try {

        const { id } = req.params;

        const { estado } = req.body;


        if (!estado) {

            return res.status(400).json({
                mensaje:
                    "El estado es obligatorio"
            });

        }


        const vacante =
            await actualizarEstadoVacante(
                id,
                estado
            );


        if (!vacante) {

            return res.status(404).json({
                mensaje:
                    "Vacante no encontrada"
            });

        }


        res.status(200).json({
            mensaje:
                "Estado actualizado correctamente",

            vacante
        });

    } catch (error) {

        console.error(
            " Error al actualizar estado:",
            error.message
        );

        res.status(400).json({
            mensaje: error.message
        });

    }

}


module.exports = {
    listarVacantes,
    obtenerVacante
};