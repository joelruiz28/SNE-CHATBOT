const API_URL = "http://localhost:3000/api/empresas";


export async function obtenerEmpresas() {

    try {

        const response =
            await fetch(API_URL);

        if (!response.ok) {

            throw new Error(
                "Error al obtener las empresas"
            );

        }

        const data =
            await response.json();

        return data;

    } catch (error) {

        console.error(
            "Error empresas:",
            error
        );

        throw error;

    }

}

export async function obtenerEmpresaPorNombre(nombre) {

    try {

        const response =
            await fetch(
                `${API_URL}/${encodeURIComponent(nombre)}`
            );

        if (!response.ok) {

            throw new Error(
                "Error al obtener la empresa"
            );

        }

        const data =
            await response.json();

        return data;

    } catch (error) {

        console.error(
            "Error detalle empresa:",
            error
        );

        throw error;

    }

}