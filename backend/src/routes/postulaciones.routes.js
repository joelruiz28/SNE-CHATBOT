
const express = require("express");
const router = express.Router();

const db = require("../config/database");

// Obtener todas las postulaciones
router.get("/", async (req, res) => {
    try {
        const consulta = `
            SELECT
                p.id,
                p.buscador_id,
                p.vacante_id,
                p.cve_vacante_sqlserver,
                p.origen_vacante,
                p.estado,
                p.fecha_postulacion,

                b.nombre_completo,
                b.folio,

                COALESCE(v.puesto, ve.puesto) AS puesto,
                COALESCE(v.empresa, ve.empresa) AS empresa,
                COALESCE(v.folio_oferta, ve.folio_oferta) AS folio_oferta

            FROM postulaciones p

            INNER JOIN buscadores_empleo b
                ON b.id = p.buscador_id

            LEFT JOIN vacantes v
                ON v.id = p.vacante_id

            LEFT JOIN vacantes_externas ve
                ON ve.cve_vacante_sqlserver = p.cve_vacante_sqlserver

            ORDER BY p.fecha_postulacion DESC, p.id DESC;
        `;

        const resultado = await db.query(consulta);

        res.json({
            total: resultado.rows.length,
            postulaciones: resultado.rows
        });
    } catch (error) {
        console.error("Error al consultar postulaciones:", error.message);

        res.status(500).json({
            mensaje: "No se pudieron obtener las postulaciones"
        });
    }
});

// Obtener una postulación por ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({
                mensaje: "El ID de la postulación no es válido"
            });
        }

        const consulta = `
            SELECT
                p.id,
                p.buscador_id,
                p.vacante_id,
                p.cve_vacante_sqlserver,
                p.origen_vacante,
                p.estado,
                p.fecha_postulacion,

                b.nombre_completo,
                b.folio,
                b.curp,
                b.telefono,
                b.correo,
                b.municipio,

                COALESCE(v.puesto, ve.puesto) AS puesto,
                COALESCE(v.empresa, ve.empresa) AS empresa,
                COALESCE(v.folio_oferta, ve.folio_oferta) AS folio_oferta,
                COALESCE(v.municipio, ve.municipio) AS municipio_vacante

            FROM postulaciones p

            INNER JOIN buscadores_empleo b
                ON b.id = p.buscador_id

            LEFT JOIN vacantes v
                ON v.id = p.vacante_id

            LEFT JOIN vacantes_externas ve
                ON ve.cve_vacante_sqlserver = p.cve_vacante_sqlserver

            WHERE p.id = $1
            LIMIT 1;
        `;

        const resultado = await db.query(consulta, [Number(id)]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró la postulación"
            });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error("Error al consultar la postulación:", error.message);

        res.status(500).json({
            mensaje: "No se pudo obtener la postulación"
        });
    }
});

module.exports = router;
