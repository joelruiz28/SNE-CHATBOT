const API_URL = "http://localhost:3000/api/personas";


export async function obtenerPersonas() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {

            throw new Error(
                "Error al obtener las personas"
            );

        }

        const data = await response.json();

        return data;

    } catch (error) {

        console.error(
            "Error personas:",
            error
        );

        throw error;
    }
}