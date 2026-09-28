const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const os = require("os");

const COLOR = {
    forest: "#1f4b3b",       // verde profundo — encabezados / superficies fuertes
    forestDark: "#163a2d",   // variante oscura — bordes, degradado, franja inferior
    handGreen: "#2f6b54",    // verde medio — acentos, títulos de sección
    gold: "#c9a15c",         // dorado — acento principal de marca
    goldSoft: "#e0bd7e",     // dorado claro — hover / detalles sobre fondo oscuro
    goldLight: "#f2e7ce",    // tinte dorado — fondos suaves sobre crema
    cream: "#faf8f4",        // fondo general
    surface: "#ffffff",      // tarjetas
    ink: "#202a25",          // texto principal (verde-carbón)
    gray: "#6e7a72",         // texto secundario con tinte verde
    line: "#e7e2d6"          // bordes sobre crema
};


const LAYOUT = {
    pageWidth: 612,       // LETTER en puntos
    marginX: 50,
    contentWidth: 512,    // pageWidth - 2 * marginX
    headerHeight: 108,
    topoRuleHeight: 5
};



/** Genera el folio de la postulación, p. ej. SNE-POST-2026-000123 */
function generarFolioPostulacion(postulacionId, fecha) {
    const year = new Date(fecha).getFullYear();
    return `SNE-POST-${year}-${String(postulacionId).padStart(6, "0")}`;
}

/** Formatea una fecha en formato largo es-MX. */
function formatearFecha(fecha) {
    if (!fecha) return "No disponible";
    return new Date(fecha).toLocaleString("es-MX", {
        dateStyle: "long",
        timeStyle: "short"
    });
}

/** Formatea un salario como moneda MXN. */
function formatearSalario(salario) {
    if (salario === null || salario === undefined || salario === "") {
        return "No especificado";
    }
    const numero = Number(salario);
    if (Number.isNaN(numero)) return String(salario);
    return `$${numero.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} MXN`;
}

function dibujarLineaTopografica(doc, x, y, width) {
    const step = 30;
    const amplitude = 3;
    doc.save();
    doc.lineWidth(1.2).strokeColor(COLOR.gold).opacity(0.55);
    doc.moveTo(x, y);
    let cursor = x;
    let up = true;
    while (cursor < x + width) {
        const next = Math.min(cursor + step, x + width);
        const cpY = up ? y - amplitude : y + amplitude;
        doc.quadraticCurveTo(cursor + step / 2, cpY, next, y);
        cursor = next;
        up = !up;
    }
    doc.stroke();
    doc.opacity(1).restore();
}


function dibujarEncabezado(doc, folio, fecha) {
    const { pageWidth, headerHeight, marginX, contentWidth } = LAYOUT;

    // Franja superior con leve degradado (dos tonos de verde)
    doc.rect(0, 0, pageWidth, headerHeight).fill(COLOR.forest);
    doc.rect(0, headerHeight - 18, pageWidth, 18).fill(COLOR.forestDark);

    // Isotipo: círculo dorado con las siglas
    doc.circle(65, 50, 27).fill(COLOR.gold);
    doc.fontSize(18)
        .font("Helvetica-Bold")
        .fillColor(COLOR.forestDark)
        .text("SNE", 38, 41, { width: 54, align: "center" });

    // Nombre institucional
    doc.fontSize(17)
        .font("Helvetica-Bold")
        .fillColor(COLOR.surface)
        .text("SISTEMA NACIONAL DE EMPLEO", 105, 26);

    doc.fontSize(10)
        .font("Helvetica")
        .fillColor(COLOR.goldSoft)
        .text("Chiapas · Comprobante de postulación", 105, 47);

    doc.fontSize(9)
        .fillColor("#dce9e2")
        .text(`Folio: ${folio}`, 105, 65);

    doc.fontSize(8)
        .fillColor("#dce9e2")
        .text(`Fecha: ${fecha}`, pageWidth - marginX - 165, 65, {
            width: 165,
            align: "right"
        });

    // Línea topográfica dorada como remate del encabezado
    dibujarLineaTopografica(doc, marginX, headerHeight + 6, contentWidth);

    doc.fillColor(COLOR.ink);
}


function dibujarTituloSeccion(doc, titulo, y) {
    const { marginX, contentWidth } = LAYOUT;

    doc.roundedRect(marginX, y, contentWidth, 27, 5).fill(COLOR.handGreen);
    doc.rect(marginX, y, 4, 27).fill(COLOR.gold); // acento dorado

    doc.fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(COLOR.surface)
        .text(titulo.toUpperCase(), marginX + 16, y + 8, { characterSpacing: 0.3 });

    doc.fillColor(COLOR.ink);
}


function dibujarDato(doc, etiqueta, valor, x, y, ancho) {
    doc.fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(COLOR.gray)
        .text(etiqueta, x, y, { width: 115 });

    doc.fontSize(9)
        .font("Helvetica")
        .fillColor(COLOR.ink)
        .text(valor || "No disponible", x + 120, y, { width: ancho - 120 });

    doc.fillColor(COLOR.ink);
}


function dibujarEncabezadoSecundario(doc, folio) {
    const { pageWidth } = LAYOUT;

    doc.rect(0, 0, pageWidth, 70).fill(COLOR.forest);
    doc.rect(0, 66, pageWidth, 4).fill(COLOR.gold);

    doc.fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(COLOR.surface)
        .text("SISTEMA NACIONAL DE EMPLEO", 50, 25);

    doc.fontSize(8)
        .font("Helvetica")
        .fillColor(COLOR.goldSoft)
        .text(folio, 400, 28, { width: 112, align: "right" });

    doc.fillColor(COLOR.ink);
}


function dibujarPie(doc) {
    const { pageWidth } = LAYOUT;
    const y = 690;

    doc.moveTo(50, y).lineTo(pageWidth - 50, y).strokeColor(COLOR.line).stroke();

    doc.fontSize(8)
        .font("Helvetica")
        .fillColor(COLOR.gray)
        .text("Sistema Nacional de Empleo · Chiapas", 50, y + 10, {
            width: 512,
            align: "center"
        });

    doc.fontSize(7)
        .fillColor(COLOR.gray)
        .text(
            "Comprobante generado automáticamente. Conserve este documento como constancia del registro de su solicitud.",
            50,
            y + 24,
            { width: 512, align: "center" }
        );
}


async function generarComprobantePostulacion(datos) {
    return new Promise((resolve, reject) => {
        try {
            const folioPostulacion = generarFolioPostulacion(
                datos.postulacion_id,
                datos.fecha_postulacion
            );

            const nombreArchivo = `comprobante-postulacion-${folioPostulacion}.pdf`;
            const rutaArchivo = path.join(os.tmpdir(), nombreArchivo);

            const doc = new PDFDocument({
                size: "LETTER",
                margins: { top: 40, bottom: 45, left: 50, right: 50 },
                info: {
                    Title: `Comprobante de postulación ${folioPostulacion}`,
                    Author: "Sistema Nacional de Empleo — Chiapas"
                }
            });

            const stream = fs.createWriteStream(rutaArchivo);
            doc.pipe(stream);

            /* ---------------- PÁGINA 1 ---------------- */

            dibujarEncabezado(
                doc,
                folioPostulacion,
                formatearFecha(datos.fecha_postulacion)
            );

            // Fondo crema general de la página, debajo del encabezado
            doc.rect(0, LAYOUT.headerHeight + 12, LAYOUT.pageWidth, 700)
                .fill(COLOR.cream);
            doc.fillColor(COLOR.ink);

            // Tarjeta de estado
            doc.roundedRect(50, 132, 512, 55, 7).fill(COLOR.goldLight);
            doc.rect(50, 132, 4, 55).fill(COLOR.gold);

            doc.fontSize(11)
                .font("Helvetica-Bold")
                .fillColor(COLOR.forest)
                .text("✓  POSTULACIÓN REGISTRADA", 68, 146);

            doc.fontSize(9)
                .font("Helvetica")
                .fillColor(COLOR.gray)
                .text(
                    "Tu solicitud fue registrada correctamente en el Sistema Nacional de Empleo.",
                    68,
                    164,
                    { width: 475 }
                );

            doc.fillColor(COLOR.ink);

            // Datos del buscador de empleo
            dibujarTituloSeccion(doc, "Datos del buscador de empleo", 207);

            dibujarDato(doc, "Nombre:", datos.nombre_completo, 60, 249, 490);
            dibujarDato(doc, "CURP:", datos.curp, 60, 270, 490);
            dibujarDato(doc, "Teléfono:", datos.telefono, 60, 291, 490);
            dibujarDato(doc, "Correo:", datos.correo, 60, 312, 490);
            dibujarDato(doc, "Municipio:", datos.municipio_candidato, 60, 333, 490);
            dibujarDato(doc, "Colonia:", datos.colonia, 60, 354, 490);
            dibujarDato(doc, "Escolaridad:", datos.nivel_estudios, 60, 375, 490);

            if (datos.carrera) {
                dibujarDato(doc, "Carrera:", datos.carrera, 60, 396, 490);
            }

            // Datos de la vacante
            dibujarTituloSeccion(doc, "Datos de la vacante", 427);

            dibujarDato(doc, "Folio de oferta:", datos.folio_oferta, 60, 469, 490);
            dibujarDato(doc, "Puesto:", datos.puesto, 60, 490, 490);
            dibujarDato(doc, "Empresa:", datos.empresa, 60, 511, 490);
            dibujarDato(
                doc,
                "Ubicación:",
                `${datos.municipio_vacante || "No disponible"}, ${datos.entidad || ""}`,
                60,
                532,
                490
            );
            dibujarDato(doc, "Salario:", formatearSalario(datos.salario), 60, 553, 490);

            dibujarPie(doc);

            /* ---------------- PÁGINA 2 ---------------- */

            doc.addPage();
            doc.rect(0, 0, LAYOUT.pageWidth, 792).fill(COLOR.cream);

            dibujarEncabezadoSecundario(doc, folioPostulacion);

            // Información adicional de la vacante
            dibujarTituloSeccion(doc, "Información adicional de la vacante", 100);

            dibujarDato(
                doc,
                "Escolaridad:",
                datos.nivel_estudios_vacante,
                60,
                145,
                490
            );
            dibujarDato(doc, "Experiencia:", datos.experiencia, 60, 170, 490);

            // Bloque "Importante"
            doc.roundedRect(50, 220, 512, 150, 8).fill(COLOR.surface);
            doc.rect(50, 220, 4, 150).fill(COLOR.gold);
            doc.roundedRect(50, 220, 512, 150, 8).lineWidth(0.75).stroke(COLOR.line);

            doc.fontSize(11)
                .font("Helvetica-Bold")
                .fillColor(COLOR.forest)
                .text("IMPORTANTE", 70, 240);

            doc.moveTo(70, 260).lineTo(542, 260).strokeColor(COLOR.line).stroke();

            doc.fontSize(9)
                .font("Helvetica")
                .fillColor(COLOR.gray)
                .text(
                    "Este documento únicamente acredita que la postulación fue registrada en el Sistema Nacional de Empleo.",
                    70,
                    280,
                    { width: 450, lineGap: 4 }
                );

            doc.font("Helvetica-Bold")
                .fillColor(COLOR.forest)
                .text("La postulación no garantiza la contratación.", 70, 320, {
                    width: 450
                });

            doc.font("Helvetica")
                .fillColor(COLOR.gray)
                .text(
                    "Un asesor o reclutador podrá revisar la información proporcionada y ponerse en contacto con el buscador de empleo para continuar con el proceso.",
                    70,
                    345,
                    { width: 450, lineGap: 4 }
                );

            // Resumen de la postulación
            dibujarTituloSeccion(doc, "Resumen de la postulación", 405);

            doc.roundedRect(60, 450, 492, 90, 6).fill(COLOR.goldLight);
            doc.rect(60, 450, 4, 90).fill(COLOR.gold);

            doc.fontSize(9)
                .font("Helvetica-Bold")
                .fillColor(COLOR.gray)
                .text("Folio de postulación", 80, 470);

            doc.fontSize(12)
                .font("Helvetica-Bold")
                .fillColor(COLOR.forest)
                .text(folioPostulacion, 80, 487);

            doc.fontSize(9)
                .font("Helvetica-Bold")
                .fillColor(COLOR.gray)
                .text("Estado", 330, 470);

            doc.fontSize(10)
                .font("Helvetica-Bold")
                .fillColor(COLOR.forest)
                .text("Postulación registrada", 330, 487);

            dibujarPie(doc);

            /* ---------------- Finalizar ---------------- */

            doc.end();

            stream.on("finish", () => {
                resolve({ rutaArchivo, nombreArchivo, folioPostulacion });
            });

            stream.on("error", (error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generarComprobantePostulacion
};