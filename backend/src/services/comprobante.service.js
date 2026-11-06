
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const os = require("os");
const LOGO_SNE = path.join(
    __dirname,
    "../assets/logo sne_comprobante.jpg"
);

const COLOR = {
    forest: "#1f4b3b",
    forestDark: "#163a2d",
    handGreen: "#2f6b54",
    gold: "#c9a15c",
    goldSoft: "#e0bd7e",
    goldLight: "#f2e7ce",
    cream: "#faf8f4",
    surface: "#ffffff",
    ink: "#202a25",
    gray: "#6e7a72",
    line: "#e7e2d6"
};

const LAYOUT = {
    pageWidth: 612,
    pageHeight: 792,
    marginX: 50,
    contentWidth: 512,
    headerHeight: 90
};

/**
 * Genera el folio de la postulación.
 * Ejemplo: SNE-POST-2026-000123
 */
function generarFolioPostulacion(postulacionId, fecha) {
    const year = new Date(fecha).getFullYear();

    return `SNE-POST-${year}-${String(postulacionId).padStart(6, "0")}`;
}

/**
 * Formatea la fecha para el comprobante.
 */
function formatearFecha(fecha) {
    if (!fecha) return "No disponible";

    return new Date(fecha).toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

/**
 * Formatea el salario como moneda mexicana.
 */
function formatearSalario(salario) {
    if (
        salario === null ||
        salario === undefined ||
        salario === ""
    ) {
        return "No especificado";
    }

    const numero = Number(salario);

    if (Number.isNaN(numero)) {
        return String(salario);
    }

    return `$${numero.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} MXN`;
}


function dibujarLineaTopografica(doc, x, y, width) {
    const step = 30;
    const amplitude = 3;

    doc.save();

    doc.lineWidth(1.2)
        .strokeColor(COLOR.gold)
        .opacity(0.55);

    doc.moveTo(x, y);

    let cursor = x;
    let up = true;

    while (cursor < x + width) {
        const next = Math.min(cursor + step, x + width);
        const cpY = up ? y - amplitude : y + amplitude;

        doc.quadraticCurveTo(
            cursor + step / 2,
            cpY,
            next,
            y
        );

        cursor = next;
        up = !up;
    }

    doc.stroke();
    doc.opacity(1).restore();
}


function dibujarEncabezado(doc, folio, fecha) {
    const {
        pageWidth,
        marginX,
        contentWidth,
        headerHeight
    } = LAYOUT;

    // Fondo verde institucional.
    doc.rect(0, 0, pageWidth, headerHeight)
        .fill(COLOR.forest);

    // Franja inferior verde oscuro.
    doc.rect(
        0,
        headerHeight - 8,
        pageWidth,
        8
    ).fill(COLOR.forestDark);

    // Logo institucional local.
    if (fs.existsSync(LOGO_SNE)) {
        doc.image(LOGO_SNE, 40, 17, {
            fit: [100, 52],
            align: "center",
            valign: "center"
        });
    } else {
        // Respaldo si no existe el archivo del logo.
        doc.circle(66, 43, 25)
            .fill(COLOR.gold);

        doc.font("Helvetica-Bold")
            .fontSize(17)
            .fillColor(COLOR.forestDark)
            .text("SNE", 41, 35, {
                width: 50,
                align: "center"
            });
    }

    // Nombre institucional.
    doc.font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(COLOR.surface)
        .text(
            "SISTEMA NACIONAL DE EMPLEO",
            153,
            19,
            { width: 405 }
        );

    // Subtítulo.
    doc.font("Helvetica")
        .fontSize(9)
        .fillColor(COLOR.goldSoft)
        .text(
            "Chiapas · Comprobante de postulación",
            153,
            39
        );

    // Folio.
    doc.font("Helvetica")
        .fontSize(8)
        .fillColor("#dce9e2")
        .text(`Folio: ${folio}`, 153, 59, {
            width: 220
        });

    // Fecha.
    doc.font("Helvetica")
        .fontSize(7.5)
        .fillColor("#dce9e2")
        .text(`Fecha: ${fecha}`, 350, 59, {
            width: 208,
            align: "right"
        });

    // Línea decorativa institucional.
    dibujarLineaTopografica(
        doc,
        marginX,
        headerHeight + 7,
        contentWidth
    );

    doc.fillColor(COLOR.ink);
}


function dibujarTituloSeccion(doc, titulo, y, alto = 23) {
    const { marginX, contentWidth } = LAYOUT;

    doc.roundedRect(
        marginX,
        y,
        contentWidth,
        alto,
        4
    ).fill(COLOR.handGreen);

    doc.rect(
        marginX,
        y,
        4,
        alto
    ).fill(COLOR.gold);

    doc.font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLOR.surface)
        .text(
            titulo.toUpperCase(),
            marginX + 13,
            y + 7,
            { characterSpacing: 0.25 }
        );

    doc.fillColor(COLOR.ink);
}


function dibujarCampo(
    doc,
    etiqueta,
    valor,
    x,
    y,
    ancho,
    alto = 30
) {
    const valorTexto =
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
            ? "No disponible"
            : String(valor).trim();

    doc.roundedRect(x, y, ancho, alto, 4)
        .fill(COLOR.surface);

    doc.roundedRect(x, y, ancho, alto, 4)
        .lineWidth(0.6)
        .stroke(COLOR.line);

    doc.font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(COLOR.gray)
        .text(
            etiqueta.toUpperCase(),
            x + 8,
            y + 5,
            {
                width: ancho - 16,
                height: 9,
                ellipsis: true
            }
        );

    doc.font("Helvetica")
        .fontSize(8.5)
        .fillColor(COLOR.ink)
        .text(
            valorTexto,
            x + 8,
            y + 15,
            {
                width: ancho - 16,
                height: alto - 17,
                ellipsis: true,
                lineBreak: false
            }
        );

    doc.fillColor(COLOR.ink);
}


function dibujarBloqueImportante(doc) {
    const x = 50;
    const y = 530;
    const ancho = 512;
    const alto = 75;

    doc.roundedRect(x, y, ancho, alto, 6)
        .fill(COLOR.surface);

    doc.roundedRect(x, y, ancho, alto, 6)
        .lineWidth(0.7)
        .stroke(COLOR.line);

    doc.rect(x, y, 4, alto)
        .fill(COLOR.gold);

    doc.font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLOR.forest)
        .text("IMPORTANTE", x + 15, y + 9);

    doc.moveTo(x + 15, y + 25)
        .lineTo(x + ancho - 15, y + 25)
        .strokeColor(COLOR.line)
        .stroke();

    doc.font("Helvetica")
        .fontSize(7.2)
        .fillColor(COLOR.gray)
        .text(
            "Este documento acredita únicamente el registro de la postulación en el Sistema Nacional de Empleo; no garantiza la contratación. Un asesor o reclutador podrá revisar la información y contactar al buscador de empleo para continuar con el proceso.",
            x + 15,
            y + 31,
            {
                width: ancho - 30,
                height: 39,
                lineGap: 1
            }
        );
}


function dibujarResumen(doc, folioPostulacion) {
    const x = 50;
    const y = 615;
    const ancho = 512;
    const alto = 55;

    doc.roundedRect(x, y, ancho, alto, 6)
        .fill(COLOR.goldLight);

    doc.rect(x, y, 4, alto)
        .fill(COLOR.gold);

    doc.font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(COLOR.gray)
        .text(
            "FOLIO DE POSTULACIÓN",
            x + 16,
            y + 10
        );

    doc.font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLOR.forest)
        .text(
            folioPostulacion,
            x + 16,
            y + 25
        );

    doc.font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(COLOR.gray)
        .text("ESTADO", x + 300, y + 10);

    doc.font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLOR.forest)
        .text(
            "Postulación registrada",
            x + 300,
            y + 25
        );
}

/**
 * Pie de página institucional.
 */
function dibujarPie(doc) {
    const y = 710;

    doc.moveTo(50, y)
        .lineTo(562, y)
        .strokeColor(COLOR.line)
        .stroke();

    doc.font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLOR.gray)
        .text(
            "Sistema Nacional de Empleo · Chiapas",
            50,
            y + 8,
            {
                width: 512,
                align: "center"
            }
        );

    doc.font("Helvetica")
        .fontSize(6.5)
        .fillColor(COLOR.gray)
        .text(
            "Comprobante generado automáticamente. Conserve este documento como constancia de su solicitud.",
            50,
            y + 20,
            {
                width: 512,
                align: "center"
            }
        );
}



/**
 * Genera el comprobante PDF de postulación.
 * El contenido se dibuja en una sola página tamaño carta.
 */
async function generarComprobantePostulacion(datos) {
    return new Promise((resolve, reject) => {
        try {

            const folioPostulacion = generarFolioPostulacion(
                datos.postulacion_id,
                datos.fecha_postulacion
            );

            const nombreArchivo =
                `comprobante-postulacion-${folioPostulacion}.pdf`;

            const rutaArchivo = path.join(
                os.tmpdir(),
                nombreArchivo
            );

            const doc = new PDFDocument({
                size: "LETTER",
                margins: {
                    top: 25,
                    bottom: 35,
                    left: 50,
                    right: 50
                },
                info: {
                    Title: `Comprobante de postulación ${folioPostulacion}`,
                    Author: "Sistema Nacional de Empleo — Chiapas"
                }
            });

            const stream = fs.createWriteStream(rutaArchivo);

            doc.pipe(stream);

            // Fondo de la única página.
            doc.rect(
                0,
                0,
                LAYOUT.pageWidth,
                LAYOUT.pageHeight
            ).fill(COLOR.cream);

            // Encabezado institucional.
            dibujarEncabezado(
                doc,
                folioPostulacion,
                formatearFecha(datos.fecha_postulacion)
            );

            // Estado de la postulación.
            doc.roundedRect(50, 111, 512, 40, 6)
                .fill(COLOR.goldLight);

            doc.rect(50, 111, 4, 40)
                .fill(COLOR.gold);

            doc.font("Helvetica-Bold")
                .fontSize(10)
                .fillColor(COLOR.forest)
                .text(
                    " POSTULACIÓN REGISTRADA",
                    64,
                    119
                );

            doc.font("Helvetica")
                .fontSize(8)
                .fillColor(COLOR.gray)
                .text(
                    "Tu solicitud fue registrada correctamente en el Sistema Nacional de Empleo.",
                    64,
                    134,
                    {
                        width: 480,
                        height: 12,
                        ellipsis: true
                    }
                );

            // Datos del buscador de empleo.
            dibujarTituloSeccion(
                doc,
                "Datos del buscador de empleo",
                162
            );

            const x1 = 58;
            const x2 = 318;
            const anchoColumna = 246;

            dibujarCampo(
                doc,
                "Nombre",
                datos.nombre_completo,
                x1,
                191,
                504,
                30
            );

            dibujarCampo(
                doc,
                "CURP",
                datos.curp,
                x1,
                225,
                anchoColumna,
                30
            );

            dibujarCampo(
                doc,
                "Teléfono",
                datos.telefono,
                x2,
                225,
                anchoColumna,
                30
            );

            dibujarCampo(
                doc,
                "Correo",
                datos.correo,
                x1,
                259,
                anchoColumna,
                30
            );

            dibujarCampo(
                doc,
                "Código postal",
                datos.codigo_postal ||
                    datos.codigoPostal ||
                    datos.cp,
                x2,
                259,
                anchoColumna,
                30
            );

            // Datos de la vacante.
            dibujarTituloSeccion(
                doc,
                "Datos de la vacante",
                300
            );

            dibujarCampo(
    doc,
    "Folio de oferta",
    datos.folio_oferta ||
        datos.foliooferta ||
        datos.folio_oferta_vacante ||
        "No disponible",
    x1,
    329,
    anchoColumna,
    30
);

            dibujarCampo(
                doc,
                "Salario",
                formatearSalario(datos.salario),
                x2,
                329,
                anchoColumna,
                30
            );

            dibujarCampo(
                doc,
                "Puesto",
                datos.puesto,
                x1,
                363,
                504,
                30
            );

            dibujarCampo(
                doc,
                "Empresa",
                datos.empresa,
                x1,
                397,
                504,
                30
            );

            dibujarCampo(
                doc,
                "Ubicación",
                [
                    datos.municipio_vacante,
                    datos.entidad
                ].filter(Boolean).join(", ") || "No disponible",
                x1,
                431,
                504,
                30
            );

            dibujarCampo(
                doc,
                "Escolaridad",
                datos.nivel_estudios_vacante ||
                    datos.nivel_estudios,
                x1,
                465,
                anchoColumna,
                30
            );

            dibujarCampo(
                doc,
                "Experiencia",
                datos.experiencia,
                x2,
                465,
                anchoColumna,
                30
            );

            // Aviso institucional, resumen y pie.
            dibujarBloqueImportante(doc);
            dibujarResumen(doc, folioPostulacion);
            dibujarPie(doc);

            // Finalizar el PDF sin agregar otra página.
            doc.end();

            stream.on("finish", () => {
                resolve({
                    rutaArchivo,
                    nombreArchivo,
                    folioPostulacion
                });
            });

            stream.on("error", reject);
            doc.on("error", reject);

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generarComprobantePostulacion
};
