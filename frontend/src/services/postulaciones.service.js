
const API_URL = "http://localhost:3000/api/postulaciones";

// Obtener estadísticas y listado de postulaciones
export async function obtenerPostulaciones() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("No se pudieron obtener las postulaciones");
    }

    return await response.json();
}

// Obtener el detalle de una postulación
export async function obtenerPostulacionPorId(id) {
    const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`
    );

    if (!response.ok) {
        throw new Error("No se pudo obtener la postulación");
    }

    return await response.json();
}
