
function obtenerOpcionesActualizacion() {
    return [
        {
            id: "actualizar_correo",
            title: "Actualizar correo",
            description: "Cambiar tu correo electrónico"
        },
        {
            id: "actualizar_codigo_postal",
            title: "Actualizar C.P.",
            description: "Cambiar tu código postal"
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

module.exports = { obtenerOpcionesActualizacion };
