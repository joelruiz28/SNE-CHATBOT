
const db = require("../config/database");
const { obtenerVacantesSQLServer } = require("../repositories/vacantes.repository");

async function sincronizarVacantesExternas(limite = 100) {
    const cantidad = Math.max(
        1,
        Math.min(100, Number(limite) || 100)
    );
    

    const cliente = await db.connect();

    let offset = 0;
    let totalConsultadas = 0;
    let totalSincronizadas = 0;
    let lotes = 0;

    // Identificadores oficiales de las vacantes que sí deben publicarse.
    const idsPublicables = [];

    try {
        while (true) {
            // El filtro del repositorio devuelve solamente:
            // Estatus = 1 y Vigencia >= hoy.
            // No activar incluirTodosLosEstatus.
            const vacantes = await obtenerVacantesSQLServer(
                cantidad,
                null,
                { offset }
            );
        

            if (vacantes.length === 0) {
                break;
            }

            await cliente.query("BEGIN");

            try {
                for (const vacante of vacantes) {
                    if (vacante.id == null) {
                        throw new Error(
                            "Se recibió una vacante sin CveVacante."
                        );
                    }

                    idsPublicables.push(Number(vacante.id));

                    await cliente.query(
                        `
                        INSERT INTO vacantes_externas (
                            cve_vacante_sqlserver,
                            folio_oferta,
                            empresa,
                            puesto,
                            descripcion,
                            area,
                            subarea,
                            nivel_estudios,
                            experiencia,
                            entidad,
                            municipio,
                            numero_plazas,
                            salario,
                            fecha_publicacion,
                            vigencia,
                            estado,
                            fecha_sincronizacion
                        )
                        VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9,
                            $10, $11, $12, $13, $14, $15, $16,
                            CURRENT_TIMESTAMP
                        )
                        ON CONFLICT (cve_vacante_sqlserver)
                        DO UPDATE SET
                            folio_oferta = COALESCE(
                          EXCLUDED.folio_oferta,
                         vacantes_externas.folio_oferta
                               ),
                            empresa = EXCLUDED.empresa,
                            puesto = EXCLUDED.puesto,
                            descripcion = EXCLUDED.descripcion,
                            area = EXCLUDED.area,
                            subarea = EXCLUDED.subarea,
                            nivel_estudios = EXCLUDED.nivel_estudios,
                            experiencia = EXCLUDED.experiencia,
                            entidad = EXCLUDED.entidad,
                            municipio = EXCLUDED.municipio,
                            numero_plazas = EXCLUDED.numero_plazas,
                            salario = EXCLUDED.salario,
                            fecha_publicacion = EXCLUDED.fecha_publicacion,
                            vigencia = EXCLUDED.vigencia,
                            estado = EXCLUDED.estado,
                            fecha_sincronizacion = CURRENT_TIMESTAMP
                        `,
                        [
                            vacante.id,
                            vacante.folio_oferta,
                            vacante.empresa,
                            vacante.puesto,
                            vacante.descripcion,
                            vacante.area,
                            vacante.subarea,
                            vacante.nivel_estudios,
                            vacante.experiencia,
                            vacante.entidad,
                            vacante.municipio,
                            vacante.numero_plazas,
                            vacante.salario,
                            vacante.fecha_publicacion,
                            vacante.vigencia,
                            vacante.estado
                        ]
                    );
                }

                await cliente.query("COMMIT");
            } catch (errorLote) {
                await cliente.query("ROLLBACK");
                throw errorLote;
            }

            totalConsultadas += vacantes.length;
            totalSincronizadas += vacantes.length;
            lotes++;

            if (vacantes.length < cantidad) {
                break;
            }

            offset += vacantes.length;
        }

        // ninguna vacante. Investigar primero ese escenario.
        if (idsPublicables.length === 0) {
            throw new Error(
                "La sincronización no encontró vacantes publicables. " +
                "Se conserva la caché de PostgreSQL."
            );
        }

        // Retirar de la caché las vacantes vencidas, desactivadas
        const resultadoLimpieza = await cliente.query(
            `
            DELETE FROM vacantes_externas
            WHERE NOT (
                cve_vacante_sqlserver = ANY($1::bigint[])
            )
            `,
            [idsPublicables]
        );
        

        return {
            consultadas: totalConsultadas,
            sincronizadas: totalSincronizadas,
            lotes,
            retiradasDeCache: resultadoLimpieza.rowCount
        };
    } finally {
        cliente.release();
    }
}



module.exports = { sincronizarVacantesExternas };
