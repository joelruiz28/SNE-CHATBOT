const db = require("../config/database");

async function obtenerResumenReportes() {
    const [
        personas,
        folios,
        vacantes,
        empresas
    ] = await Promise.all([
        db.query(`
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
        `),

        db.query(`
            SELECT COUNT(*) AS total
            FROM buscadores_empleo
            WHERE folio IS NOT NULL
              AND TRIM(folio) <> ''
        `),

        db.query(`
            SELECT
                COUNT(*) AS total,

                COUNT(*) FILTER (
                    WHERE estado = 1
                ) AS activas,

                COUNT(*) FILTER (
                    WHERE estado = 0
                ) AS inactivas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 1
                            THEN COALESCE(numero_plazas, 0)
                            ELSE 0
                        END
                    ),
                    0
                ) AS plazas_activas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 0
                            THEN COALESCE(numero_plazas, 0)
                            ELSE 0
                        END
                    ),
                    0
                ) AS plazas_inactivas,

                COUNT(*) FILTER (
                    WHERE estado = 1
                      AND vigencia >= CURRENT_DATE
                      AND vigencia <= CURRENT_DATE + 30
                ) AS por_vencer,

                COUNT(*) FILTER (
                    WHERE estado = 1
                      AND vigencia < CURRENT_DATE
                ) AS vencidas_activas

            FROM vacantes_externas
        `),

        db.query(`
            SELECT COUNT(DISTINCT LOWER(TRIM(empresa))) AS total
            FROM vacantes_externas
            WHERE empresa IS NOT NULL
              AND TRIM(empresa) <> ''
        `)
    ]);

    const v = vacantes.rows[0];

    const resumen = {
        personas: {
            total: Number(personas.rows[0].total),
            completos: Number(personas.rows[0].completos),
            pendientes: Number(personas.rows[0].pendientes)
        },

        folios: {
            total: Number(folios.rows[0].total)
        },

        vacantes: {
            total: Number(v.total),
            activas: Number(v.activas),
            inactivas: Number(v.inactivas),
            plazasActivas: Number(v.plazas_activas),
            plazasInactivas: Number(v.plazas_inactivas),
            porVencer: Number(v.por_vencer),
            vencidasActivas: Number(v.vencidas_activas)
        },

        empresas: {
            total: Number(empresas.rows[0].total)
        }
    };

    resumen.vacantes.plazas = (
        resumen.vacantes.plazasActivas +
        resumen.vacantes.plazasInactivas
    );

    return resumen;
}


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


async function obtenerPuestosConMayorOferta() {
    const resultado = await db.query(`
        SELECT
            MIN(TRIM(puesto)) AS puesto,
            COUNT(*) AS total_vacantes,
            COALESCE(
                SUM(COALESCE(numero_plazas, 0)),
                0
            ) AS plazas

        FROM vacantes_externas

        WHERE estado = 1
          AND puesto IS NOT NULL
          AND TRIM(puesto) <> ''

        GROUP BY LOWER(TRIM(puesto))

        ORDER BY
            total_vacantes DESC,
            plazas DESC,
            puesto ASC

        LIMIT 10
    `);

    return resultado.rows.map((item) => ({
        puesto: item.puesto,
        totalVacantes: Number(item.total_vacantes),
        plazas: Number(item.plazas)
    }));
}


async function obtenerPuestosMasSolicitados() {
    return obtenerPuestosConMayorOferta();
}


async function obtenerVacantesPorMunicipio() {
    const resultado = await db.query(`
        SELECT
            INITCAP(TRIM(municipio)) AS municipio,
            COUNT(*) AS total,
            COALESCE(
                SUM(COALESCE(numero_plazas, 0)),
                0
            ) AS plazas

        FROM vacantes_externas

        WHERE estado = 1
          AND municipio IS NOT NULL
          AND TRIM(municipio) <> ''

        GROUP BY INITCAP(TRIM(municipio))

        ORDER BY total DESC, municipio ASC
    `);

    return resultado.rows.map((item) => ({
        municipio: item.municipio,
        total: Number(item.total),
        plazas: Number(item.plazas)
    }));
}


async function obtenerVacantesPorArea() {
    const resultado = await db.query(`
        SELECT
            MIN(TRIM(area)) AS area,
            COUNT(*) AS total,
            COALESCE(
                SUM(COALESCE(numero_plazas, 0)),
                0
            ) AS plazas

        FROM vacantes_externas

        WHERE estado = 1
          AND area IS NOT NULL
          AND TRIM(area) <> ''

        GROUP BY LOWER(TRIM(area))

        ORDER BY total DESC, area ASC
    `);

    return resultado.rows.map((item) => ({
        area: item.area,
        total: Number(item.total),
        plazas: Number(item.plazas)
    }));
}


async function obtenerEmpresasConMasVacantes() {
    const resultado = await db.query(`
        SELECT
            MIN(TRIM(empresa)) AS empresa,
            COUNT(*) AS total_vacantes,
            COALESCE(
                SUM(COALESCE(numero_plazas, 0)),
                0
            ) AS plazas

        FROM vacantes_externas

        WHERE estado = 1
          AND empresa IS NOT NULL
          AND TRIM(empresa) <> ''

        GROUP BY LOWER(TRIM(empresa))

        ORDER BY
            total_vacantes DESC,
            plazas DESC,
            empresa ASC

        LIMIT 10
    `);

    return resultado.rows.map((item) => ({
        empresa: item.empresa,
        totalVacantes: Number(item.total_vacantes),
        vacantesActivas: Number(item.total_vacantes),
        plazas: Number(item.plazas)
    }));
}


// =====================================================
// DATOS PRINCIPALES DEL DASHBOARD DE REPORTES
// =====================================================

async function obtenerDashboardReportes() {
    const [
        resumen,
        municipiosPersonas,
        puestos,
        municipiosVacantes,
        areas,
        empresas
    ] = await Promise.all([
        obtenerResumenReportes(),
        obtenerPersonasPorMunicipio(),
        obtenerPuestosConMayorOferta(),
        obtenerVacantesPorMunicipio(),
        obtenerVacantesPorArea(),
        obtenerEmpresasConMasVacantes()
    ]);

    return {
        indicadores: {
            // Personas registradas
            personas: resumen.personas.total,
            folios: resumen.folios.total,
            perfilesCompletos: resumen.personas.completos,
            perfilesPendientes: resumen.personas.pendientes,

            // Oferta laboral
            empresas: resumen.empresas.total,
            vacantes: resumen.vacantes.total,
            vacantesActivas: resumen.vacantes.activas,
            vacantesInactivas: resumen.vacantes.inactivas,

            // Plazas y vigencias
            totalPlazas: resumen.vacantes.plazas,
            plazasActivas: resumen.vacantes.plazasActivas,
            plazasInactivas: resumen.vacantes.plazasInactivas,
            vacantesPorVencer: resumen.vacantes.porVencer,
            vacantesVencidasActivas: resumen.vacantes.vencidasActivas
        },

        // Estadísticas independientes, sin cruces artificiales.
        personas: {
            resumen: resumen.personas,
            municipios: municipiosPersonas
        },

        ofertaLaboral: {
            resumen: resumen.vacantes,
            empresasTotal: resumen.empresas.total,
            municipios: municipiosVacantes,
            areas,
            puestos,
            empresas
        },

        // Propiedades útiles para adaptar la interfaz existente.
        municipios: {
            personas: municipiosPersonas,
            vacantes: municipiosVacantes
        },

        puestos,
        areas,
        empresas,

        // Solo alertas respaldadas por datos reales.
        alertas: {
            perfilesPendientes: resumen.personas.pendientes,
            vacantesPorVencer: resumen.vacantes.porVencer,
            vacantesVencidasActivas:
                resumen.vacantes.vencidasActivas
        }
    };
}


module.exports = {
    obtenerResumenReportes,
    obtenerPersonasPorMunicipio,
    obtenerPuestosMasSolicitados,
    obtenerPuestosConMayorOferta,
    obtenerVacantesPorMunicipio,
    obtenerVacantesPorArea,
    obtenerEmpresasConMasVacantes,
    obtenerDashboardReportes
};

