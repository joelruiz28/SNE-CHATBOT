const whatsappService = require('./whatsapp.service');

async function enviarBienvenida(telefono) {
  const mensaje = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: telefono,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: 'Asistente SNE'
      },
      body: {
        text:
          '¡Hola! 👋 Bienvenido al Servicio Nacional de Empleo.\n\n' +
          'Encuentra oportunidades laborales y consulta tus postulaciones.\n\n' +
          '¿Qué deseas hacer hoy?'
      },
      footer: {
        text: 'Atención digital SNE'
      },
      action: {
        button: 'Ver servicios',
        sections: [
          {
            title: 'Servicios disponibles',
            rows: [
              {
                id: 'buscar_vacantes',
                title: 'Buscar vacantes',
                description: 'Encuentra oportunidades laborales'
              },
              {
                id: 'registrar_datos',
                title: 'Registrar mis datos',
                description: 'Crea tu perfil de candidato'
              },
              {
                id: 'actualizar_datos',
                title: 'Actualizar mis datos',
                description: 'Modifica tu información'
              },
              {
                id: 'mis_postulaciones',
                title: 'Mis postulaciones',
                description: 'Consulta tus solicitudes'
              },
              {
                id: 'hablar_asesor',
                title: 'Hablar con un asesor',
                description: 'Solicita atención personalizada'
              },
              {
                id: 'menu_principal',
                title: 'Menú principal',
                description: 'Regresa al inicio'
              }
            ]
          }
        ]
      }
    }
  };

  return whatsappService.enviarMensaje(mensaje);
}

async function enviarTexto(telefono, texto) {
  return whatsappService.enviarTexto(telefono, texto);
}

async function enviarImagen(telefono, url, descripcion) {
  return whatsappService.enviarImagen(
    telefono,
    url,
    descripcion
  );
}

module.exports = {
  enviarBienvenida,
  enviarTexto,
  enviarImagen
};