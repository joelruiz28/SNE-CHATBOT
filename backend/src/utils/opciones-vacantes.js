
function obtenerOpcionesEscolaridad() {
    return [
        {
            id: "1",
            title: "📚 Primaria",
            description: "Educación primaria"
        },
        {
            id: "2",
            title: "📘 Secundaria",
            description: "Educación secundaria"
        },
        {
            id: "3",
            title: "🎓 Preparatoria",
            description: "Preparatoria o vocacional"
        },
        {
            id: "4",
            title: "🎓 Licenciatura",
            description: "Estudios universitarios"
        }
    ];
}

function obtenerOpcionesDetalleVacante() {
    return [
        {
            id: "postularme_vacante",
            title: "Postularme",
            description: "Registrar mi solicitud"
        },
        {
            id: "buscar_vacantes",
            title: "Nueva búsqueda",
            description: "Consultar otras vacantes"
        },
        {
            id: "menu_principal",
            title: "Menú principal",
            description: "Volver a los servicios"
        },
        {
            id: "salir",
            title: "Finalizar atención",
            description: "Terminar la conversación"
        }
    ];
}

function obtenerOpcionesSinVacantes() {
    return [
        {
            id: "buscar_vacantes",
            title: "Nueva búsqueda",
            description: "Probar otro nivel de estudios"
        },
        {
            id: "menu_principal",
            title: "Menú principal",
            description: "Volver a los servicios"
        },
        {
            id: "salir",
            title: "Finalizar atención",
            description: "Terminar la conversación"
        }
    ];
}

module.exports = {
    obtenerOpcionesEscolaridad,
    obtenerOpcionesDetalleVacante,
    obtenerOpcionesSinVacantes
};
