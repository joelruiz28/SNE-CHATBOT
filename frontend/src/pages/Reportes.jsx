
import { useEffect, useState } from "react";

import {
    Users,
    Building2,
    BriefcaseBusiness,
    FileText,
    CheckCircle2,
    Clock3,
    AlertTriangle,
    LoaderCircle,
    CalendarDays,
    ChartNoAxesCombined,
    MapPin,
    GraduationCap,
    RefreshCw,
    UserRoundCheck,
    UserRoundX,
    Map,
    Layers3,
    ArrowUpRight,
    ClipboardList,
    CalendarClock,
    CircleAlert,
} from "lucide-react";

import { obtenerDashboardReportes } from "../services/reportes.service";
import "../styles/reportes.css";

const numero = (valor) =>
    Number(valor ?? 0).toLocaleString("es-MX");

const fechaActual = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
}).format(new Date());

function Indicador({
    icon: Icono,
    titulo,
    valor,
    detalle,
    variante = "",
}) {
    return (
        <article className={`reporte-indicador ${variante}`}>
            <div className="reporte-indicador-superior">
                <div className="reporte-indicador-icono">
                    <Icono size={21} strokeWidth={1.8} />
                </div>

                {detalle && (
                    <span className="reporte-indicador-detalle">
                        {detalle}
                    </span>
                )}
            </div>

            <div className="reporte-indicador-contenido">
                <span className="reporte-indicador-titulo">
                    {titulo}
                </span>

                <strong className="reporte-indicador-valor">
                    {numero(valor)}
                </strong>
            </div>
        </article>
    );
}

function EstadoVacio({
    mensaje = "No hay información disponible.",
}) {
    return (
        <div className="reporte-vacio">
            <div className="reporte-vacio-icono">
                <ChartNoAxesCombined size={22} strokeWidth={1.6} />
            </div>
            <p>{mensaje}</p>
        </div>
    );
}

function EncabezadoSeccion({
    etiqueta,
    titulo,
    descripcion,
    icon: Icono,
}) {
    return (
        <div className="reporte-seccion-encabezado">
            <div className="reporte-seccion-titulos">
                <span className="reporte-etiqueta">
                    {Icono && <Icono size={14} />}
                    {etiqueta}
                </span>

                <h2>{titulo}</h2>

                {descripcion && <p>{descripcion}</p>}
            </div>
        </div>
    );
}

function BarraDistribucion({ valor, maximo }) {
    const porcentaje =
        maximo > 0
            ? Math.min((Number(valor) / maximo) * 100, 100)
            : 0;

    return (
        <div
            className="reporte-barra"
            role="progressbar"
            aria-label="Proporción respecto al valor más alto"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(porcentaje)}
        >
            <span style={{ width: `${porcentaje}%` }} />
        </div>
    );
}

function ListaMunicipios({
    elementos = [],
    tipo = "personas",
}) {
    if (!elementos.length) {
        return (
            <EstadoVacio
                mensaje={
                    tipo === "personas"
                        ? "Todavía no hay personas agrupadas por municipio."
                        : "No hay vacantes activas agrupadas por municipio."
                }
            />
        );
    }

    const maximo = Math.max(
        ...elementos.map((item) => Number(item.total ?? 0)),
        0
    );

    return (
        <div className="reporte-distribucion-lista">
            {elementos.map((item, index) => (
                <div
                    className="reporte-distribucion-item"
                    key={`${item.municipio}-${index}`}
                >
                    <div className="reporte-distribucion-principal">
                        <div className="reporte-distribucion-nombre">
                            <span className="reporte-punto" />
                            <span title={item.municipio}>
                                {item.municipio || "Sin municipio"}
                            </span>
                        </div>

                        <strong>{numero(item.total)}</strong>
                    </div>

                    <BarraDistribucion
                        valor={item.total}
                        maximo={maximo}
                    />

                    {tipo === "vacantes" && (
                        <span className="reporte-distribucion-subtexto">
                            {numero(item.plazas)} plazas activas
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

function ListaPuestos({ elementos = [] }) {
    if (!elementos.length) {
        return (
            <EstadoVacio
                mensaje="No hay puestos activos disponibles para clasificar."
            />
        );
    }

    const maximo = Math.max(
        ...elementos.map((item) => Number(item.totalVacantes ?? 0)),
        0
    );

    return (
        <div className="reporte-puestos-lista">
            {elementos.map((item, index) => (
                <article
                    className="reporte-puesto-item"
                    key={`${item.puesto}-${index}`}
                >
                    <span
                        className={`reporte-puesto-ranking ${
                            index === 0 ? "destacado" : ""
                        }`}
                    >
                        {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="reporte-puesto-info">
                        <div className="reporte-puesto-titulo">
                            <strong title={item.puesto}>
                                {item.puesto || "Puesto sin especificar"}
                            </strong>

                            <span>
                                {numero(item.totalVacantes)}{" "}
                                {Number(item.totalVacantes) === 1
                                    ? "vacante"
                                    : "vacantes"}
                            </span>
                        </div>

                        <BarraDistribucion
                            valor={item.totalVacantes}
                            maximo={maximo}
                        />

                        <small>
                            {numero(item.plazas)}{" "}
                            {Number(item.plazas) === 1 ? "plaza" : "plazas"}
                        </small>
                    </div>
                </article>
            ))}
        </div>
    );
}

function ListaAreas({ elementos = [] }) {
    if (!elementos.length) {
        return (
            <EstadoVacio
                mensaje="No hay áreas laborales registradas en las vacantes activas."
            />
        );
    }

    const maximo = Math.max(
        ...elementos.map((item) => Number(item.total ?? 0)),
        0
    );

    return (
        <div className="reporte-areas-lista">
            {elementos.map((item, index) => (
                <article
                    className="reporte-area-item"
                    key={`${item.area}-${index}`}
                >
                    <div className="reporte-area-icono">
                        <Layers3 size={18} />
                    </div>

                    <div className="reporte-area-contenido">
                        <div className="reporte-area-titulo">
                            <strong title={item.area}>
                                {item.area || "Área sin especificar"}
                            </strong>

                            <span>{numero(item.total)}</span>
                        </div>

                        <BarraDistribucion
                            valor={item.total}
                            maximo={maximo}
                        />

                        <small>{numero(item.plazas)} plazas activas</small>
                    </div>
                </article>
            ))}
        </div>
    );
}

function ListaEmpresas({ elementos = [] }) {
    if (!elementos.length) {
        return (
            <EstadoVacio
                mensaje="No hay empresas con vacantes activas para mostrar."
            />
        );
    }

    return (
        <div className="reporte-empresas-lista">
            {elementos.map((empresa, index) => (
                <article
                    className="reporte-empresa-item"
                    key={`${empresa.empresa}-${index}`}
                >
                    <div className="reporte-empresa-identidad">
                        <span className="reporte-empresa-ranking">
                            {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="reporte-empresa-icono">
                            <Building2 size={19} />
                        </div>

                        <div className="reporte-empresa-nombre">
                            <strong title={empresa.empresa}>
                                {empresa.empresa || "Empresa sin nombre"}
                            </strong>

                            <span>
                                <BriefcaseBusiness size={13} />
                                {numero(empresa.totalVacantes)}{" "}
                                {Number(empresa.totalVacantes) === 1
                                    ? "vacante activa"
                                    : "vacantes activas"}
                            </span>
                        </div>
                    </div>

                    <div className="reporte-empresa-plazas">
                        <strong>{numero(empresa.plazas)}</strong>
                        <span>plazas</span>
                    </div>
                </article>
            ))}
        </div>
    );
}

function Reportes() {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [actualizacion, setActualizacion] = useState(0);

    useEffect(() => {
        let activo = true;

        async function cargarDashboard() {
            try {
                setCargando(true);
                setError(null);

                const resultado = await obtenerDashboardReportes();

                if (activo) {
                    setDatos(resultado);
                }
            } catch (err) {
                console.error("Error al cargar reportes:", err);

                if (activo) {
                    setError(
                        err.message ||
                        "No se pudo cargar la información de los reportes."
                    );
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        }

        cargarDashboard();

        return () => {
            activo = false;
        };
    }, [actualizacion]);

    if (cargando && !datos) {
        return (
            <main className="reportes-page">
                <div className="reportes-estado">
                    <div className="reportes-estado-icono cargando">
                        <LoaderCircle size={30} />
                    </div>

                    <h2>Preparando tus reportes</h2>

                    <p>
                        Consultando los registros de personas y la oferta
                        laboral del SNE Chiapas.
                    </p>
                </div>
            </main>
        );
    }

    if (error && !datos) {
        return (
            <main className="reportes-page">
                <div className="reportes-estado">
                    <div className="reportes-estado-icono error">
                        <AlertTriangle size={27} />
                    </div>

                    <h2>No se pudieron cargar los reportes</h2>
                    <p>{error}</p>

                    <button
                        type="button"
                        className="reporte-boton"
                        onClick={() => setActualizacion((n) => n + 1)}
                    >
                        <RefreshCw size={16} />
                        Intentar nuevamente
                    </button>
                </div>
            </main>
        );
    }

    if (!datos) return null;

    const indicadores = datos.indicadores || {};

    const personas = datos.personas || {};
    const resumenPersonas = personas.resumen || {
        total: indicadores.personas,
        completos: indicadores.perfilesCompletos,
        pendientes: indicadores.perfilesPendientes,
    };

    const oferta = datos.ofertaLaboral || {};
    const resumenOferta = oferta.resumen || {};

    const municipiosPersonas =
        personas.municipios ??
        datos.municipios?.personas ??
        [];

    const municipiosVacantes =
        oferta.municipios ??
        datos.municipios?.vacantes ??
        [];

    const puestos = oferta.puestos ?? datos.puestos ?? [];
    const areas = oferta.areas ?? datos.areas ?? [];
    const empresas = oferta.empresas ?? datos.empresas ?? [];
    const alertas = datos.alertas || {};

    const totalVacantes = Number(
        indicadores.vacantes ?? resumenOferta.total ?? 0
    );

    const vacantesActivas = Number(
        indicadores.vacantesActivas ?? resumenOferta.activas ?? 0
    );

    const vacantesInactivas = Number(
        indicadores.vacantesInactivas ?? resumenOferta.inactivas ?? 0
    );

    const plazasActivas = Number(
        indicadores.plazasActivas ?? resumenOferta.plazasActivas ?? 0
    );

    const totalEmpresas = Number(
        indicadores.empresas ?? oferta.empresasTotal ?? 0
    );

    const perfilesCompletos = Number(
        indicadores.perfilesCompletos ?? resumenPersonas.completos ?? 0
    );

    const perfilesPendientes = Number(
        indicadores.perfilesPendientes ?? resumenPersonas.pendientes ?? 0
    );

    const vacantesPorVencer = Number(
        indicadores.vacantesPorVencer ?? alertas.vacantesPorVencer ?? 0
    );

    const vacantesVencidasActivas = Number(
        indicadores.vacantesVencidasActivas ??
        alertas.vacantesVencidasActivas ??
        0
    );

    return (
        <main className="reportes-page">
            <div className="reportes-contenido">
                {/* CABECERA */}
               

                {error && datos && (
                    <div className="reportes-aviso-error" role="status">
                        <AlertTriangle size={17} />
                        <span>
                            No se pudo actualizar la información. Se muestran
                            los últimos datos cargados.
                        </span>
                    </div>
                )}

                {/* RESUMEN GENERAL */}
                <section className="reportes-bloque">
                  

                    <div className="reportes-indicadores-grid">
                        <Indicador
                            icon={Users}
                            titulo="Personas registradas"
                            valor={indicadores.personas}
                            detalle="Registro de personas"
                            variante="personas"
                        />

                        <Indicador
                            icon={Building2}
                            titulo="Empresas"
                            valor={totalEmpresas}
                            detalle="Con oferta registrada"
                            variante="empresas"
                        />

                        <Indicador
                            icon={BriefcaseBusiness}
                            titulo="Vacantes activas"
                            valor={vacantesActivas}
                            detalle="Estado activo"
                            variante="vacantes"
                        />

                        <Indicador
                            icon={ClipboardList}
                            titulo="Plazas activas"
                            valor={plazasActivas}
                            detalle="Puestos de trabajo disponibles"
                            variante="plazas"
                        />
                    </div>
                </section>

                {/* REGISTRO DE PERSONAS */}
                <section className="reportes-bloque">
                    <div className="reportes-bloque-encabezado">
                        <div>
                            <span className="reportes-seccion-kicker">
                                REGISTRO
                            </span>
                            <h2>Personas registradas</h2>
                            <p>
                                Seguimiento de perfiles, folios y distribución
                                geográfica de los registros.
                            </p>
                        </div>
                    </div>

                    <div className="reportes-indicadores-grid reportes-indicadores-personas">
                        <Indicador
                            icon={FileText}
                            titulo="Folios generados"
                            valor={indicadores.folios}
                            variante="neutral"
                        />

                        <Indicador
                            icon={UserRoundCheck}
                            titulo="Perfiles completos"
                            valor={perfilesCompletos}
                            variante="positivo"
                        />

                        <Indicador
                            icon={UserRoundX}
                            titulo="Perfiles pendientes"
                            valor={perfilesPendientes}
                            variante="pendiente"
                        />
                    </div>

                    <div className="reporte-panel">
                        <div className="reporte-panel-encabezado">
                            <div className="reporte-panel-titulo-icono">
                                <div className="reporte-panel-icono">
                                    <MapPin size={18} />
                                </div>

                                <div>
                                    <h3>Personas por municipio</h3>
                                    <p>
                                        Distribución de las personas registradas.
                                    </p>
                                </div>
                            </div>

                            <span className="reporte-panel-total">
                                {numero(municipiosPersonas.length)} municipios
                            </span>
                        </div>

                        <ListaMunicipios
                            elementos={municipiosPersonas}
                            tipo="personas"
                        />
                    </div>
                </section>

                {/* OFERTA LABORAL */}
                <section className="reportes-bloque">
                    <div className="reportes-bloque-encabezado">
                        <div>
                            <span className="reportes-seccion-kicker">
                                MERCADO LABORAL
                            </span>
                            <h2>Oferta laboral</h2>
                            <p>
                                Análisis de vacantes sincronizadas desde SQL
                                Server y almacenadas en el sistema.
                            </p>
                        </div>
                    </div>

                    <div className="reportes-indicadores-grid reportes-indicadores-oferta">
                        <Indicador
                            icon={BriefcaseBusiness}
                            titulo="Total de vacantes"
                            valor={totalVacantes}
                            detalle="Activas e inactivas"
                            variante="neutral"
                        />

                        <Indicador
                            icon={CheckCircle2}
                            titulo="Vacantes activas"
                            valor={vacantesActivas}
                            detalle="Estado = 1"
                            variante="positivo"
                        />

                        <Indicador
                            icon={Clock3}
                            titulo="Vacantes inactivas"
                            valor={vacantesInactivas}
                            detalle="Estado = 0"
                            variante="pendiente"
                        />

                        <Indicador
                            icon={ClipboardList}
                            titulo="Plazas totales"
                            valor={
                                indicadores.totalPlazas ??
                                resumenOferta.plazas ??
                                0
                            }
                            detalle="Todas las vacantes"
                            variante="neutral"
                        />
                    </div>

                    <div className="reportes-dos-columnas">
                        <div className="reporte-panel">
                            <div className="reporte-panel-encabezado">
                                <div className="reporte-panel-titulo-icono">
                                    <div className="reporte-panel-icono">
                                        <MapPin size={18} />
                                    </div>

                                    <div>
                                        <h3>Vacantes por municipio</h3>
                                        <p>
                                            Vacantes activas y sus plazas.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <ListaMunicipios
                                elementos={municipiosVacantes}
                                tipo="vacantes"
                            />
                        </div>

                        <div className="reporte-panel">
                            <div className="reporte-panel-encabezado">
                                <div className="reporte-panel-titulo-icono">
                                    <div className="reporte-panel-icono">
                                        <GraduationCap size={18} />
                                    </div>

                                    <div>
                                        <h3>Vacantes por área</h3>
                                        <p>
                                            Distribución de la oferta laboral.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <ListaAreas elementos={areas} />
                        </div>
                    </div>

                    <div className="reportes-dos-columnas">
                        <div className="reporte-panel">
                            <div className="reporte-panel-encabezado">
                                <div className="reporte-panel-titulo-icono">
                                    <div className="reporte-panel-icono">
                                        <BriefcaseBusiness size={18} />
                                    </div>

                                    <div>
                                        <h3>Puestos con mayor oferta</h3>
                                        <p>
                                            Principales puestos según vacantes
                                            activas.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <ListaPuestos elementos={puestos} />
                        </div>

                        <div className="reporte-panel">
                            <div className="reporte-panel-encabezado">
                                <div className="reporte-panel-titulo-icono">
                                    <div className="reporte-panel-icono">
                                        <Building2 size={18} />
                                    </div>

                                    <div>
                                        <h3>Empresas con más vacantes</h3>
                                        <p>
                                            Empresas ordenadas por su oferta
                                            activa.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <ListaEmpresas elementos={empresas} />
                        </div>
                    </div>
                </section>

                {/* SEGUIMIENTO */}
                <section className="reportes-bloque">
                    <div className="reportes-bloque-encabezado">
                        <div>
                            <span className="reportes-seccion-kicker">
                                SEGUIMIENTO
                            </span>
                            <h2>Alertas y vigencias</h2>
                            <p>
                                Registros que conviene revisar desde la
                                administración del sistema.
                            </p>
                        </div>
                    </div>

                    <div className="reportes-alertas-grid">
                        <article className="reporte-alerta-card">
                            <div className="reporte-alerta-icono pendientes">
                                <UserRoundX size={20} />
                            </div>

                            <div className="reporte-alerta-contenido">
                                <span>Perfiles pendientes</span>
                                <strong>{numero(perfilesPendientes)}</strong>
                                <p>
                                    Personas cuyo perfil requiere completar
                                    información.
                                </p>
                            </div>
                        </article>

                        <article className="reporte-alerta-card">
                            <div className="reporte-alerta-icono por-vencer">
                                <CalendarClock size={20} />
                            </div>

                            <div className="reporte-alerta-contenido">
                                <span>Vacantes por vencer</span>
                                <strong>{numero(vacantesPorVencer)}</strong>
                                <p>
                                    Vacantes activas con vigencia dentro de los
                                    próximos 30 días.
                                </p>
                            </div>
                        </article>

                        <article className="reporte-alerta-card">
                            <div className="reporte-alerta-icono vencidas">
                                <CircleAlert size={20} />
                            </div>

                            <div className="reporte-alerta-contenido">
                                <span>Vigencia vencida</span>
                                <strong>
                                    {numero(vacantesVencidasActivas)}
                                </strong>
                                <p>
                                    Vacantes que siguen activas aunque su fecha
                                    de vigencia ya pasó.
                                </p>
                            </div>
                        </article>
                    </div>
                </section>

                
            </div>
        </main>
    );
}

export default Reportes;

