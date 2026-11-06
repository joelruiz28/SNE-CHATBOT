
function limitarTexto(texto, maximo = 24) {
    const valor = String(texto || "").trim();

    if (valor.length <= maximo) {
        return valor || "Sin información";
    }

    return `${valor.slice(0, maximo - 1).trimEnd()}…`;
}

function obtenerOpcionesListadoPostulaciones(postulaciones) {
    return postulaciones.slice(0, 10).map((postulacion) => ({
        id: `postulacion_${postulacion.id}`,
        title: limitarTexto(postulacion.puesto, 24),
        description: limitarTexto(
            `${postulacion.empresa || "Empresa no especificada"} · ${
                postulacion.estado || "En revisión"
            }`,
            72
        )
    }));
}

function obtenerOpcionesDetallePostulacion() {
    return [
        {
            id: "cancelar_postulacion",
            title: "Cancelar postulación",
            description: "Consultar la opción de cancelación"
        },
        {
            id: "ver_mas_datos",
            title: "Ver más datos",
            description: "Consultar detalles de la vacante"
        },
        {
            id: "regresar_postulaciones",
            title: "Mis postulaciones",
            description: "Volver al listado"
        },
        {
            id: "menu_principal",
            title: "Menú principal",
            description: "Volver a los servicios"
        }
    ];
}

function obtenerOpcionesInformacionPostulacion() {
    return [
        {
            id: "cancelar_postulacion",
            title: "Cancelar postulación",
            description: "Consultar la opción de cancelación"
        },
        {
            id: "regresar_postulaciones",
            title: "Mis postulaciones",
            description: "Volver al listado"
        },
        {
            id: "menu_principal",
            title: "Menú principal",
            description: "Volver a los servicios"
        }
    ];
}

function obtenerOpcionesSinPostulaciones() {
    return [
        {
            id: "buscar_vacantes",
            title: "Buscar vacantes",
            description: "Encuentra oportunidades laborales"
        },
        {
            id: "menu_principal",
            title: "Menú principal",
            description: "Consultar otros servicios"
        }
    ];
}

module.exports = {
    obtenerOpcionesListadoPostulaciones,
    obtenerOpcionesDetallePostulacion,
    obtenerOpcionesInformacionPostulacion,
    obtenerOpcionesSinPostulaciones
};
