const API_URL = "http://localhost:3000/api/dashboard";

export async function obtenerDashboard() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Error al obtener los datos del dashboard");
        }

        const data = await response.json();

        return data;

    } catch (error) {
        console.error("Error dashboard:", error);

        throw error;
    }
}