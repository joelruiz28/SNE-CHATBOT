export async function obtenerResumenFolios() {

    const response = await fetch(
        "http://localhost:3000/api/folios"
    );

    if (!response.ok) {

        throw new Error(
            "No se pudo obtener el resumen de folios"
        );

    }

    const datos = await response.json();

    console.log(
        "📊 RESPUESTA COMPLETA /api/folios:",
        datos
    );

    return datos;
}


export async function buscarFolio(folio) {

    const response = await fetch(
        `http://localhost:3000/api/folios/buscar/${encodeURIComponent(folio)}`
    );

    if (!response.ok) {

        let error;

        try {

            error = await response.json();

        } catch {

            error = {};

        }

        throw new Error(
            error.mensaje ||
            "Folio no encontrado"
        );

    }

    const datos = await response.json();

    console.log(
        "🔎 RESPUESTA BUSCAR FOLIO:",
        datos
    );

    return datos;
}