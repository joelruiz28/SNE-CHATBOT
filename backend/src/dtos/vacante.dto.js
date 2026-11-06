const { z } = require("zod");

const vacanteSchema = z.object({
    id: z.number().int(),
    folio_oferta: z.string().nullable(),
    empresa: z.string().nullable(),
    puesto: z.string().nullable(),
    descripcion: z.string().nullable(),
    area: z.string().nullable(),
    subarea: z.string().nullable(),
    nivel_estudios: z.string().nullable(),
    experiencia: z.string().nullable(),
    entidad: z.string().nullable(),
    municipio: z.string().nullable(),
    numero_plazas: z.number().int().nullable(),
    salario: z.number().nullable(),
    fecha_publicacion: z.date().nullable(),
    vigencia: z.date().nullable(),
    estado: z.number().int().nullable()
});

function convertirVacanteSQLServer(row) {
    return vacanteSchema.parse({
        id: Number(row.CveVacante),
        folio_oferta: row.FolioSIISNE ?? null,
        empresa: row.Empresa ?? null,
        puesto: row.PuestoOfrecido?.trim() ?? null,
        descripcion: row.ResumenOferta ?? row.DescripcionOferta ?? null,
        area: row.Area ?? null,
        subarea: row.Subarea ?? null,
        nivel_estudios: row.EscolaridadMinima ?? null,
        experiencia: row.ExperienciaDescripcion ?? null,
        entidad: row.Entidad ?? null,
        municipio: row.Municipio ?? null,
        numero_plazas:
            row.NoPlazas == null ? null : Number(row.NoPlazas),
        salario: row.Salario == null ? null : Number(row.Salario),
        fecha_publicacion:
            row.Fecha == null ? null : new Date(row.Fecha),
        vigencia:
            row.Vigencia == null ? null : new Date(row.Vigencia),
        estado: row.Estatus == null ? null : Number(row.Estatus)
    });
}

module.exports = {
    vacanteSchema,
    convertirVacanteSQLServer
};
