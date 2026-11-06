const API_URL = "http://localhost:3000/api/vacantes";


export async function obtenerVacantes() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {

            throw new Error(
                "Error al obtener las vacantes"
            );

        }

        const data = await response.json();

        return data;

    } catch (error) {

        console.error(
            "Error vacantes:",
            error
        );

        throw error;
    }
}

export async function obtenerVacantePorId(id) {

    try {

        const response = await fetch(
            `${API_URL}/${id}`
        );

        if (!response.ok) {

            throw new Error(
                "Error al obtener la vacante"
            );

        }

        return await response.json();

    } catch (error) {

        console.error(
            "Error al obtener vacante:",
            error
        );

        throw error;
    }
}



export async function actualizarEstadoVacante(
    id,
    estado
) {

    const response = await fetch(
        `${API_URL}/${id}/estado`,
        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                estado
            })
        }
    );


    if (!response.ok) {

        throw new Error(
            "Error al actualizar el estado"
        );

    }


    return await response.json();

}