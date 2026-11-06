
const sqlserver = require("../config/sqlserver");
const sql = require("mssql");
const { convertirVacanteSQLServer } = require("../dtos/vacante.dto");

const equivalenciasEscolaridad = {
    "primaria": "Primaria",
    "secundaria": "Secundaria",
    "preparatoria o vocacional": "Preparatoria / Bachillerato",
    "licenciatura": "Licenciatura / Profesional"
};

async function obtenerVacantesSQLServer(
    limite = 50,
    escolaridad = null,
    opciones = {}
) {
    const cantidad = Math.max(
        1,
        Math.min(100, Number(limite) || 50)
    );

    const offset = Math.max(
        0,
        Math.floor(Number(opciones.offset) || 0)
    );

    const incluirTodosLosEstatus =
        opciones.incluirTodosLosEstatus === true;

    let escolaridadSQL = null;

    if (escolaridad) {
        const clave = escolaridad.trim().toLocaleLowerCase("es-MX");

        escolaridadSQL = equivalenciasEscolaridad[clave];

        if (!escolaridadSQL) {
            throw new Error(`Escolaridad no reconocida: ${escolaridad}`);
        }
    }

    await sqlserver.poolConectado;

    const resultado = await sqlserver.request()
        .input("limite", sql.Int, cantidad)
        .input("offset", sql.Int, offset)
        .input("escolaridad", sql.NVarChar(200), escolaridadSQL)
        .input(
            "incluirTodosLosEstatus",
            sql.Bit,
            incluirTodosLosEstatus
        )
        .query(`
            SELECT
                V.CveVacante,
                CASE
    WHEN LTRIM(RTRIM(V.FolioSIISNE)) IN ('00', '00000', '')
      OR V.FolioSIISNE IS NULL
    THEN NULL
    ELSE LTRIM(RTRIM(V.FolioSIISNE))
END AS FolioSIISNE,
                V.PuestoOfrecido,
                V.ResumenOferta,
                V.DescripcionOferta,
                V.Fecha,
                V.Vigencia,
                V.NoPlazas,
                V.Salario,
                V.Estatus,
                E.Nombre AS Empresa,
                ES.Nombre AS Entidad,
                M.Nombre AS Municipio,
                EM.Descripcion AS EscolaridadMinima,
                EX.Descripcion AS ExperienciaDescripcion,
                CAST(NULL AS NVARCHAR(200)) AS Area,
                CAST(NULL AS NVARCHAR(200)) AS Subarea
            FROM dbo.Vacantes AS V
            LEFT JOIN dbo.CatEmpresa AS E
                ON E.CveEmpresa = V.CveEmpresa
            LEFT JOIN dbo.CatEstados AS ES
                ON ES.CveEstados = V.CveEstado
            LEFT JOIN dbo.CatMunicipios AS M
                ON M.CveMunicipios = V.CveMunicipio
            LEFT JOIN dbo.CatEscolaridad AS EM
                ON EM.CveEscolaridad = V.CveEscolaridadMin
            LEFT JOIN dbo.CatExperiencia AS EX
                ON EX.CveExperiencia = V.CveExperiencia
            WHERE (
                @incluirTodosLosEstatus = 1
                OR (
                    V.Estatus = 1
                    AND V.Vigencia >= CAST(GETDATE() AS DATE)
                )
            )
            AND (
                @escolaridad IS NULL
                OR LOWER(LTRIM(RTRIM(EM.Descripcion))) =
                   LOWER(@escolaridad)
            )
            ORDER BY V.Fecha DESC, V.CveVacante DESC
            OFFSET @offset ROWS
            FETCH NEXT @limite ROWS ONLY;
        `);

    return resultado.recordset.map(convertirVacanteSQLServer);
}

module.exports = { obtenerVacantesSQLServer };

