const sqlserver = require("../config/sqlserver");
const sql = require("mssql");

// ============================================================
// BUSCAR SOLICITANTE POR CURP
// ============================================================

async function buscarSolicitanteSQLServerPorCURP(curp) {
    const curpNormalizada = String(curp || "")
        .trim()
        .toUpperCase();

    if (!curpNormalizada) {
        return null;
    }

    await sqlserver.poolConectado;

    const resultado = await sqlserver
        .request()
        .input("curp", sql.VarChar(50), curpNormalizada)
        .query(`
            SELECT TOP (1)
                CveSolicitante,
                Folio,
                Curp,
                Nombre,
                Paterno,
                Materno,
                Fechanac,
                CveSexo,
                Telefono,
                Email,
                Cp
            FROM dbo.Solicitante
            WHERE UPPER(LTRIM(RTRIM(Curp))) = @curp
            ORDER BY CveSolicitante DESC;
        `);

    const solicitante = resultado.recordset[0];

    if (!solicitante) {
        return null;
    }

    return {
        id: solicitante.CveSolicitante,
        folio: solicitante.Folio,
        curp: solicitante.Curp,
        nombre: [
            solicitante.Nombre,
            solicitante.Paterno,
            solicitante.Materno
        ]
            .filter(Boolean)
            .map(nombre => nombre.trim())
            .join(" "),
        fechaNacimiento: solicitante.Fechanac,
        sexo: ({
            1: "Hombre",
            2: "Mujer"
        })[Number(solicitante.CveSexo)] || null,
        telefono: solicitante.Telefono,
        correo: solicitante.Email,
        codigoPostal: solicitante.Cp
    };
}


// ============================================================
// REGISTRAR SOLICITANTE EN SQL SERVER
// ============================================================

async function registrarSolicitanteSQLServer(datos) {
    const curp = String(datos.curp || "")
        .trim()
        .toUpperCase();

    if (!curp) {
        throw new Error("No se proporcionó la CURP del solicitante.");
    }

    // Primero comprobar si ya existe.
    const existente = await buscarSolicitanteSQLServerPorCURP(curp);

    if (existente) {
        console.log(
            "ℹ️ El solicitante ya existe en SQL Server:",
            existente.id
        );

        return existente;
    }

    const nombre = String(datos.nombre_completo || "").trim();

    if (!nombre) {
        throw new Error("El nombre completo del solicitante está vacío.");
    }

    if (nombre.length > 50) {
        throw new Error(
            "El nombre completo supera los 50 caracteres permitidos por SQL Server. No se registró para evitar truncar información."
        );
    }

    if (curp.length > 18) {
        throw new Error("La CURP supera los 18 caracteres permitidos.");
    }

    const sexoNormalizado = String(datos.sexo || "")
        .trim()
        .toLowerCase();

    const cveSexo = ({
        hombre: 1,
        mujer: 2
    })[sexoNormalizado];

    if (!cveSexo) {
        throw new Error(
            "El sexo del solicitante no corresponde a Hombre o Mujer."
        );
    }


if (!datos.fecha_nacimiento) {
    throw new Error("No se proporcionó la fecha de nacimiento.");
}

// PostgreSQL puede entregar DATE como objeto Date o como texto.
let fechaTexto;

if (datos.fecha_nacimiento instanceof Date) {
    fechaTexto = datos.fecha_nacimiento.toISOString().slice(0, 10);
} else {
    fechaTexto = String(datos.fecha_nacimiento).slice(0, 10);
}

// Validar estrictamente el formato YYYY-MM-DD.
const coincidencia = fechaTexto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

if (!coincidencia) {
    throw new Error(
        `Formato de fecha de nacimiento inválido: ${fechaTexto}`
    );
}

const [, anio, mes, dia] = coincidencia;

const fechaNacimiento = new Date(
    Date.UTC(Number(anio), Number(mes) - 1, Number(dia))
);

if (
    fechaNacimiento.getUTCFullYear() !== Number(anio) ||
    fechaNacimiento.getUTCMonth() !== Number(mes) - 1 ||
    fechaNacimiento.getUTCDate() !== Number(dia)
) {
    throw new Error("La fecha de nacimiento no es válida.");
}


    const telefono = String(datos.telefono || "").trim();
    const correo = String(datos.correo || "").trim();
    const folio = String(datos.folio || "").trim();

    if (telefono.length > 20) {
        throw new Error(
            "El teléfono supera los 20 caracteres permitidos por el procedimiento."
        );
    }

    if (correo.length > 50) {
        throw new Error(
            "El correo supera los 50 caracteres permitidos por la tabla oficial."
        );
    }

    if (folio.length > 32) {
        throw new Error(
            "El folio supera los 32 caracteres permitidos por la tabla oficial."
        );
    }

    await sqlserver.poolConectado;

    const resultado = await sqlserver
        .request()
        .input("Curp", sql.NVarChar(18), curp)
        .input("Paterno", sql.NVarChar(50), null)
        .input("Materno", sql.NVarChar(50), null)
        .input("Nombre", sql.NVarChar(50), nombre)
        .input("CveNacionalidad", sql.Decimal(10, 0), null)
        .input("CvePaisOrigen", sql.Int, null)
        .input("CveSituacionMigratoria", sql.Int, null)
        .input("Fechanac", sql.Date, fechaNacimiento)
        .input("Rfc", sql.NVarChar(13), null)
        .input("CveSexo", sql.Decimal(10, 0), cveSexo)
        .input("CveEscolaridad", sql.Decimal(10, 0), null)
        .input("Email", sql.NVarChar(100), correo || null)
        .input("Telefono", sql.NVarChar(20), telefono || null)
        .input("Folio", sql.NVarChar(50), folio || null)
        .output("NewId", sql.Int)
        .execute("dbo.sp_InsertSolicitantePreRegistro");

    const nuevoId = Number(
        resultado.output.NewId ||
        resultado.recordset?.[0]?.NewId ||
        0
    );

    if (nuevoId <= 0) {
        throw new Error(
            "SQL Server no devolvió un identificador válido para el nuevo solicitante."
        );
    }

    console.log(
        "✅ Solicitante registrado en SQL Server:",
        nuevoId
    );

    // Recuperar el registro desde la tabla oficial.
    const nuevoSolicitante =
        await buscarSolicitanteSQLServerPorCURP(curp);

    if (!nuevoSolicitante || Number(nuevoSolicitante.id) !== nuevoId) {
        throw new Error(
            "El solicitante fue insertado, pero no fue posible recuperar su registro oficial."
        );
    }

    return nuevoSolicitante;
}


// ============================================================
// BUSCAR O CREAR EXPEDIENTE ACTIVO
// ============================================================

async function obtenerOCrearExpedienteActivoSQLServer(cveSolicitante) {
    const idSolicitante = Number(cveSolicitante);

    if (
        !Number.isSafeInteger(idSolicitante) ||
        idSolicitante <= 0
    ) {
        throw new Error("El identificador del solicitante no es válido.");
    }

    await sqlserver.poolConectado;

    // 1. Buscar un expediente activo.
    const existente = await sqlserver
        .request()
        .input("CveSolicitante", sql.Int, idSolicitante)
        .query(`
            SELECT TOP (1)
                CveSolicitud,
                NumeroExpediente
            FROM dbo.Solicitudes
            WHERE CveSolicitante = @CveSolicitante
              AND Estatus = 1
            ORDER BY CveSolicitud DESC;
        `);

    if (existente.recordset.length > 0) {
        const expediente = existente.recordset[0];

        console.log(
            "ℹ️ El solicitante ya tiene un expediente activo:",
            expediente.CveSolicitud
        );

        return {
            id: expediente.CveSolicitud,
            numeroExpediente: expediente.NumeroExpediente
        };
    }

    // 2. Si no existe, crear expediente.
    // PuestoSol se deja NULL porque el chatbot no solicita ese dato.
    const resultado = await sqlserver
        .request()
        .input("CveSolicitante", sql.Int, idSolicitante)
        .input("CveUserApertura", sql.Int, null)
        .input("CveUnOperativa", sql.Int, null)
        .input("PuestoSol", sql.VarChar(200), null)
        .execute("dbo.sp_CrearExpediente");

    const nuevoExpediente = resultado.recordset?.[0];

    // El procedimiento devuelve -1 si detecta un expediente activo.
    // Volvemos a consultarlo para recuperar el expediente existente.
    if (
        Number(nuevoExpediente?.CveExpediente) === -1
    ) {
        const recuperado = await sqlserver
            .request()
            .input("CveSolicitante", sql.Int, idSolicitante)
            .query(`
                SELECT TOP (1)
                    CveSolicitud,
                    NumeroExpediente
                FROM dbo.Solicitudes
                WHERE CveSolicitante = @CveSolicitante
                  AND Estatus = 1
                ORDER BY CveSolicitud DESC;
            `);

        const expediente = recuperado.recordset[0];

        if (!expediente) {
            throw new Error(
                "El procedimiento indicó que existe un expediente activo, pero no fue posible recuperarlo."
            );
        }

        return {
            id: expediente.CveSolicitud,
            numeroExpediente: expediente.NumeroExpediente
        };
    }

    const idExpediente = Number(
        nuevoExpediente?.CveExpediente || 0
    );

    if (idExpediente <= 0) {
        throw new Error(
            nuevoExpediente?.Mensaje ||
            "No fue posible crear el expediente del solicitante."
        );
    }

    console.log(
        "✅ Expediente creado en SQL Server:",
        idExpediente
    );

    return {
        id: idExpediente,
        numeroExpediente: nuevoExpediente.NumeroExpediente || null
    };
}


module.exports = {
    buscarSolicitanteSQLServerPorCURP,
    registrarSolicitanteSQLServer,
    obtenerOCrearExpedienteActivoSQLServer
};
