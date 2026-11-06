export async function obtenerDashboardReportes() {

    const response = await fetch(
        "http://localhost:3000/api/reportes/dashboard"
    );

    if (!response.ok) {

        const error = await response.json().catch(() => ({}));

        throw new Error(
            error.mensaje ||
            "No se pudo obtener el dashboard de reportes"
        );

    }

    return await response.json();

}