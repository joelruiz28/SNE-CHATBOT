const db = require("../config/database");


// =====================================================
// RESUMEN GENERAL
// =====================================================

async function obtenerResumenReportes() {

    const personas = await db.query(`
        SELECT
            COUNT(*) AS total,

            COUNT(*) FILTER (
                WHERE perfil_completo = TRUE
            ) AS completos,

            COUNT(*) FILTER (
                WHERE perfil_completo = FALSE
                OR perfil_completo IS NULL
            ) AS pendientes

        FROM buscadores_empleo
    `);


    const folios = await db.query(`
        SELECT
            COUNT(*) AS total

        FROM buscadores_empleo

        WHERE folio IS NOT NULL
        AND TRIM(folio) <> ''
    `);


    const vacantes = await db.query(`
        SELECT
            COUNT(*) AS total,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(estado, 'activa')) = 'activa'
            ) AS activas,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(estado, 'activa')) = 'inactiva'
            ) AS inactivas,

            COALESCE(
                SUM(
                    CASE
                        WHEN numero_plazas IS NOT NULL
                        THEN numero_plazas
                        ELSE 0
                    END
                ),
                0
            ) AS plazas

        FROM vacantes
    `);


    const empresas = await db.query(`
        SELECT
            COUNT(DISTINCT empresa) AS total

        FROM vacantes

        WHERE empresa IS NOT NULL
        AND TRIM(empresa) <> ''
    `);


    return {

        personas: {
            total: Number(personas.rows[0].total),
            completos: Number(personas.rows[0].completos),
            pendientes: Number(personas.rows[0].pendientes)
        },

        folios: {
            total: Number(folios.rows[0].total)
        },

        vacantes: {
            total: Number(vacantes.rows[0].total),
            activas: Number(vacantes.rows[0].activas),
            inactivas: Number(vacantes.rows[0].inactivas),
            plazas: Number(vacantes.rows[0].plazas)
        },

        empresas: {
            total: Number(empresas.rows[0].total)
        }

    };
}


// =====================================================
// PERSONAS POR MUNICIPIO
// =====================================================

async function obtenerPersonasPorMunicipio() {

    const resultado = await db.query(`
        SELECT
            INITCAP(TRIM(municipio)) AS municipio,
            COUNT(*) AS total

        FROM buscadores_empleo

        WHERE municipio IS NOT NULL
        AND TRIM(municipio) <> ''

        GROUP BY INITCAP(TRIM(municipio))

        ORDER BY total DESC, municipio ASC
    `);

    return resultado.rows.map((item) => ({
        municipio: item.municipio,
        total: Number(item.total)
    }));
}


// =====================================================
// PUESTOS MÁS SOLICITADOS
// =====================================================

async function obtenerPuestosMasSolicitados() {

    const resultado = await db.query(`
        SELECT
            INITCAP(TRIM(puesto_solicitado)) AS puesto,
            COUNT(*) AS total

        FROM buscadores_empleo

        WHERE puesto_solicitado IS NOT NULL
        AND TRIM(puesto_solicitado) <> ''

        GROUP BY INITCAP(TRIM(puesto_solicitado))

        ORDER BY total DESC, puesto ASC

        LIMIT 10
    `);

    return resultado.rows.map((item) => ({
        puesto: item.puesto,
        total: Number(item.total)
    }));
}


// =====================================================
// VACANTES POR MUNICIPIO
// =====================================================

async function obtenerVacantesPorMunicipio() {

    const resultado = await db.query(`
        SELECT
            INITCAP(TRIM(municipio)) AS municipio,
            COUNT(*) AS total

        FROM vacantes

        WHERE municipio IS NOT NULL
        AND TRIM(municipio) <> ''

        GROUP BY INITCAP(TRIM(municipio))

        ORDER BY total DESC, municipio ASC
    `);

    return resultado.rows.map((item) => ({
        municipio: item.municipio,
        total: Number(item.total)
    }));
}


// =====================================================
// VACANTES POR ÁREA
// =====================================================

async function obtenerVacantesPorArea() {

    const resultado = await db.query(`
        SELECT
            INITCAP(TRIM(area)) AS area,
            COUNT(*) AS total

        FROM vacantes

        WHERE area IS NOT NULL
        AND TRIM(area) <> ''

        GROUP BY INITCAP(TRIM(area))

        ORDER BY total DESC, area ASC
    `);

    return resultado.rows.map((item) => ({
        area: item.area,
        total: Number(item.total)
    }));
}


// =====================================================
// EMPRESAS CON MÁS VACANTES
// =====================================================

async function obtenerEmpresasConMasVacantes() {

    const resultado = await db.query(`
        SELECT
            TRIM(empresa) AS empresa,

            COUNT(*) AS total_vacantes,

            COUNT(*) FILTER (
                WHERE LOWER(COALESCE(estado, 'activa')) = 'activa'
            ) AS vacantes_activas,

            COALESCE(
                SUM(
                    CASE
                        WHEN numero_plazas IS NOT NULL
                        THEN numero_plazas
                        ELSE 0
                    END
                ),
                0
            ) AS plazas

        FROM vacantes

        WHERE empresa IS NOT NULL
        AND TRIM(empresa) <> ''

        GROUP BY TRIM(empresa)

        ORDER BY total_vacantes DESC, empresa ASC

        LIMIT 10
    `);

    return resultado.rows.map((item) => ({
        empresa: item.empresa,
        totalVacantes: Number(item.total_vacantes),
        vacantesActivas: Number(item.vacantes_activas),
        plazas: Number(item.plazas)
    }));
}


// =====================================================
// DEMANDA VS OFERTA POR PUESTO
// =====================================================

async function obtenerDemandaVsOferta() {

    const resultado = await db.query(`
        WITH demanda AS (

            SELECT
                LOWER(TRIM(puesto_solicitado)) AS puesto,
                COUNT(*) AS personas

            FROM buscadores_empleo

            WHERE puesto_solicitado IS NOT NULL
            AND TRIM(puesto_solicitado) <> ''

            GROUP BY LOWER(TRIM(puesto_solicitado))

        ),

        oferta AS (

            SELECT
                LOWER(TRIM(puesto)) AS puesto,
                COUNT(*) AS vacantes

            FROM vacantes

            WHERE puesto IS NOT NULL
            AND TRIM(puesto) <> ''

            GROUP BY LOWER(TRIM(puesto))

        )

        SELECT

            INITCAP(
                COALESCE(d.puesto, o.puesto)
            ) AS puesto,

            COALESCE(d.personas, 0) AS personas,

            COALESCE(o.vacantes, 0) AS vacantes

        FROM demanda d

        FULL OUTER JOIN oferta o
            ON d.puesto = o.puesto

        ORDER BY
            (COALESCE(d.personas, 0) + COALESCE(o.vacantes, 0)) DESC,

            puesto ASC

        LIMIT 10
    `);

    return resultado.rows.map((item) => {

        const personas = Number(item.personas);
        const vacantes = Number(item.vacantes);

        let oportunidad = "Sin datos";

        if (personas === 0 && vacantes > 0) {
            oportunidad = "Oferta disponible";
        } else if (personas > 0 && vacantes === 0) {
            oportunidad = "Sin vacantes";
        } else if (vacantes >= personas) {
            oportunidad = "Alta";
        } else if (vacantes > 0) {
            oportunidad = "Media";
        }

        return {
            puesto: item.puesto,
            personas,
            vacantes,
            oportunidad
        };
    });
}

// =====================================================
// DASHBOARD GENERAL DE REPORTES
// =====================================================

async function obtenerDashboardReportes() {

    const [
        resumen,
        municipios,
        puestos,
        vacantesMunicipio,
        empresas,
        demandaOferta
    ] = await Promise.all([

        obtenerResumenReportes(),

        obtenerPersonasPorMunicipio(),

        obtenerPuestosMasSolicitados(),

        obtenerVacantesPorMunicipio(),

        obtenerEmpresasConMasVacantes(),

        obtenerDemandaVsOferta()

    ]);


    // =================================================
    // ALERTAS
    // =================================================

    const personasSinVacante =
        demandaOferta.filter(
            item =>
                item.personas > 0 &&
                item.vacantes === 0
        ).reduce(
            (total, item) =>
                total + item.personas,
            0
        );


    const vacantesSinCandidatos =
        demandaOferta.filter(
            item =>
                item.personas === 0 &&
                item.vacantes > 0
        ).reduce(
            (total, item) =>
                total + item.vacantes,
            0
        );


    const coincidencias =
        demandaOferta.filter(
            item =>
                item.personas > 0 &&
                item.vacantes > 0
        ).length;


    // =================================================
    // DEVOLVER DASHBOARD
    // =================================================

    return {

        indicadores: {

            personas:
                resumen.personas.total,

            empresas:
                resumen.empresas.total,

            vacantes:
                resumen.vacantes.total,

            vacantesActivas:
                resumen.vacantes.activas,

            folios:
                resumen.folios.total,

            perfilesCompletos:
                resumen.personas.completos,

            perfilesPendientes:
                resumen.personas.pendientes

        },


        vinculacion: {

            personas:
                resumen.personas.total,

            vacantes:
                resumen.vacantes.activas,

            coincidencias,

            personasSinVacante,

            vacantesSinCandidatos

        },


        oportunidades:
            demandaOferta,


        municipios: {

            personas:
                municipios,

            vacantes:
                vacantesMunicipio

        },


        puestos,


        empresas,


        alertas: {

            personasSinVacante,

            vacantesSinCandidatos,

            coincidencias,

            perfilesPendientes:
                resumen.personas.pendientes

        }

    };

}

module.exports = {
    obtenerResumenReportes,
    obtenerPersonasPorMunicipio,
    obtenerPuestosMasSolicitados,
    obtenerVacantesPorMunicipio,
    obtenerVacantesPorArea,
    obtenerEmpresasConMasVacantes,
    obtenerDemandaVsOferta,
    obtenerDashboardReportes
};