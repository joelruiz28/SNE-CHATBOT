function normalizarTexto(texto = "") {
  return texto
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function contiene(texto, palabras) {
  return palabras.some((palabra) => texto.includes(palabra));
}

function clasificarImagenVacante(vacante = {}) {
  const puesto = normalizarTexto(vacante.puesto);
  const area = normalizarTexto(vacante.area);
  const subarea = normalizarTexto(vacante.subarea);

  /*
   * ============================================================
   * 1. SUBÁREA
   * ============================================================
   */

  // Administración / Finanzas
  if (
    contiene(subarea, [
      "credito y cobranza",
      "oficina",
      "apoyo escolar",
      "atencion al cliente",
    ])
  ) {
    return "administracion";
  }

  // Ventas / Comercio
  if (
    contiene(subarea, [
      "comercial",
      "ventas",
      "promociones",
      "asistencia a la venta",
      "comercio",
    ])
  ) {
    return "ventas";
  }

  // Transporte / Logística
  if (
    contiene(subarea, [
      "transporte por carretera",
      "embarque",
      "distribucion",
      "logistica",
      "entregas y empaques",
    ])
  ) {
    return "transporte";
  }

  // Oficios / Mantenimiento
  if (
    contiene(subarea, [
      "mantenimiento general",
      "mecanica automotriz",
      "soldadores",
      "industria de la construccion",
      "oficios calificados",
    ])
  ) {
    return "oficios";
  }

  // Campo / Agricultura
  if (
    contiene(subarea, [
      "agronomia",
      "servicios agricolas",
      "agricola",
      "campo",
    ])
  ) {
    return "campo";
  }

  // Turismo / Restaurantes
  if (
    contiene(subarea, [
      "cocina",
      "servicio de bar",
      "bebidas",
      "servicio de mesa",
      "meseros",
      "mantenimiento de hoteles",
      "restaurantes",
    ])
  ) {
    return "turismo";
  }

  // Tecnología
  if (
    contiene(subarea, [
      "redes",
      "sistemas",
      "seguridad",
      "conectividad",
      "accesibilidad",
      "ingenieria electrica",
      "enseñanza universitaria",
    ])
  ) {
    return "tecnologia";
  }

  /*
   * ============================================================
   * 2. ÁREA
   * ============================================================
   */

  if (
    contiene(area, [
      "administracion",
      "servicios bancarios",
      "financieros",
    ])
  ) {
    return "administracion";
  }

  if (contiene(area, ["ventas", "comercio"])) {
    return "ventas";
  }

  if (contiene(area, ["transporte", "distribucion", "logistica"])) {
    return "transporte";
  }

  if (contiene(area, ["oficios y servicios"])) {
    return "oficios";
  }

  if (contiene(area, ["conservacion agricola", "animales"])) {
    return "campo";
  }

  if (
    contiene(area, [
      "turismo",
      "hospedaje",
      "restaurantes",
    ])
  ) {
    return "turismo";
  }

  if (
    contiene(area, [
      "tecnologias de la informacion",
      "ingenieria",
      "educacion",
      "capacitacion",
    ])
  ) {
    return "tecnologia";
  }

  /*
   * ============================================================
   * 3. PUESTO
   * ============================================================
   */

  if (
    contiene(puesto, [
      "administrativo",
      "administracion",
      "recepcionista",
      "credito",
      "cobranza",
    ])
  ) {
    return "administracion";
  }

  if (
    contiene(puesto, [
      "ventas",
      "vendedor",
      "mostrador",
      "asesoria de ventas",
      "asesoria profesional de ventas",
    ])
  ) {
    return "ventas";
  }

  if (
    contiene(puesto, [
      "chofer",
      "conduccion",
      "conduccion",
      "reparto",
      "operador de tractor",
      "logistica",
      "almacen",
    ])
  ) {
    return "transporte";
  }

  if (
    contiene(puesto, [
      "mecanica",
      "mecanico",
      "mantenimiento",
      "soldadura",
      "soldador",
      "hojalateria",
      "obra",
    ])
  ) {
    return "oficios";
  }

  if (
    contiene(puesto, [
      "campo",
      "agricola",
      "tractor",
      "frutos",
    ])
  ) {
    return "campo";
  }

  if (
    contiene(puesto, [
      "mesero",
      "mesa",
      "cocina",
      "barra",
      "hotel",
      "turismo",
    ])
  ) {
    return "turismo";
  }

  if (
    contiene(puesto, [
      "red",
      "sistemas",
      "conectividad",
      "electrico",
      "docente",
      "profesor",
    ])
  ) {
    return "tecnologia";
  }

  /*
   * ============================================================
   * 4. CATEGORÍA GENERAL
   * ============================================================
   */

  return "produccion";
}

module.exports = clasificarImagenVacante;