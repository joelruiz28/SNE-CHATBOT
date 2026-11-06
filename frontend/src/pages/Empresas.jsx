
import { useEffect, useMemo, useState, useCallback } from "react";

import {
    obtenerEmpresas,
    obtenerEmpresaPorNombre
} from "../services/empresas.service";

import "../styles/empresas.css";

function formatearNumero(valor) {
    return Number(valor || 0).toLocaleString("es-MX");
}

function formatearSalario(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "No especificado";
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return String(valor);
    }

    return numero.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 2
    });
}

function formatearFecha(fecha) {
    if (!fecha) return "No especificada";

    const valor = String(fecha).slice(0, 10);
    const partes = valor.split("-");

    if (partes.length === 3 && partes[0].length === 4) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
        return "No especificada";
    }

    return fechaConvertida.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function obtenerEstadoVacante(vacante) {
    if (Number(vacante.estado) !== 1) {
        return {
            texto: "Inactiva",
            clase: "inactiva"
        };
    }

    if (vacante.vigencia) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fecha = new Date(
            `${String(vacante.vigencia).slice(0, 10)}T00:00:00`
        );

        if (!Number.isNaN(fecha.getTime()) && fecha < hoy) {
            return {
                texto: "Vencida",
                clase: "vencida"
            };
        }
    }

    return {
        texto: "Vigente",
        clase: "vigente"
    };
}

function Campo({ etiqueta, valor, icono }) {
    return (
        <div className="empresa-detalle-campo">
            <span className="empresa-detalle-etiqueta">
                {icono && <span aria-hidden="true">{icono} </span>}
                {etiqueta}
            </span>
            <strong>{valor ?? "No especificado"}</strong>
        </div>
    );
}

function Empresas() {
    const [empresas, setEmpresas] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");
    const [orden, setOrden] = useState("nombre");

    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState(null);

    const [filtroVacantes, setFiltroVacantes] = useState("todas");
    const [busquedaVacante, setBusquedaVacante] = useState("");

    useEffect(() => {
        let activo = true;

        async function cargarEmpresas() {
            try {
                setCargando(true);
                setError(null);

                const datos = await obtenerEmpresas();

                if (!activo) return;

                setEmpresas(datos.empresas || []);
                setEstadisticas(datos.estadisticas || null);
            } catch (err) {
                console.error("Error al cargar empresas:", err);

                if (activo) {
                    setError("No se pudieron cargar las empresas.");
                }
            } finally {
                if (activo) setCargando(false);
            }
        }

        cargarEmpresas();

        return () => {
            activo = false;
        };
    }, []);

    const empresasFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        const resultado = empresas.filter((empresa) => {
            const nombre = empresa.empresa?.toLowerCase() || "";
            const coincideNombre = nombre.includes(texto);

            let coincideEstado = true;

            if (filtroVacantes === "activas") {
                coincideEstado = Number(empresa.vacantes_activas) > 0;
            } else if (filtroVacantes === "inactivas") {
                coincideEstado = Number(empresa.vacantes_inactivas) > 0;
            } else if (filtroVacantes === "sin_activas") {
                coincideEstado = Number(empresa.vacantes_activas) === 0;
            }

            return coincideNombre && coincideEstado;
        });

        return resultado.sort((a, b) => {
            if (orden === "vacantes") {
                return Number(b.total_vacantes) - Number(a.total_vacantes);
            }

            if (orden === "activas") {
                return Number(b.vacantes_activas) - Number(a.vacantes_activas);
            }

            return (a.empresa || "").localeCompare(
                b.empresa || "",
                "es",
                { sensitivity: "base" }
            );
        });
    }, [empresas, busqueda, orden, filtroVacantes]);

    const verEmpresa = useCallback(async (nombre) => {
        try {
            setCargandoDetalle(true);
            setErrorDetalle(null);
            setEmpresaSeleccionada(null);
            setBusquedaVacante("");
            setFiltroVacantes("todas");

            const datos = await obtenerEmpresaPorNombre(nombre);

            setEmpresaSeleccionada(datos);
        } catch (err) {
            console.error("Error al cargar empresa:", err);
            setErrorDetalle(
                err?.message || "No se pudo cargar la información de la empresa."
            );
        } finally {
            setCargandoDetalle(false);
        }
    }, []);

    const cerrarModal = useCallback(() => {
        setEmpresaSeleccionada(null);
        setErrorDetalle(null);
        setBusquedaVacante("");
    }, []);

    const modalAbierto = Boolean(
        empresaSeleccionada || cargandoDetalle || errorDetalle
    );

    useEffect(() => {
        if (!modalAbierto) return;

        function alPresionarTecla(event) {
            if (event.key === "Escape") cerrarModal();
        }

        document.addEventListener("keydown", alPresionarTecla);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", alPresionarTecla);
            document.body.style.overflow = "";
        };
    }, [modalAbierto, cerrarModal]);

    const vacantesEmpresa = empresaSeleccionada?.vacantes || [];

    const vacantesFiltradas = useMemo(() => {
        const texto = busquedaVacante.trim().toLowerCase();

        return vacantesEmpresa.filter((vacante) => {
            const contenido = [
                vacante.puesto,
                vacante.folio_oferta,
                vacante.municipio,
                vacante.entidad,
                vacante.area,
                vacante.subarea,
                vacante.nivel_estudios
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return contenido.includes(texto);
        });
    }, [vacantesEmpresa, busquedaVacante]);

    const promedioVacantes = empresas.length
        ? (
            Number(estadisticas?.totalVacantes || 0) / empresas.length
        ).toFixed(1)
        : "0.0";

    return (
        <div className="empresas-page">
            <header className="empresas-header">
                

                <div className="empresas-header-total">
                    <span>Empresas encontradas</span>
                    <strong>{formatearNumero(empresasFiltradas.length)}</strong>
                </div>
            </header>

            <section className="empresas-stats">
                <div className="empresa-stat-card">
                    <span>🏢 Total de empresas</span>
                    <strong>
                        {formatearNumero(estadisticas?.totalEmpresas)}
                    </strong>
                    <small>Empresas con vacantes registradas</small>
                </div>

                <div className="empresa-stat-card">
                    <span>💼 Total de vacantes</span>
                    <strong>
                        {formatearNumero(estadisticas?.totalVacantes)}
                    </strong>
                    <small>Oportunidades registradas</small>
                </div>

                <div className="empresa-stat-card">
                    <span>🟢 Vacantes activas</span>
                    <strong>
                        {formatearNumero(estadisticas?.vacantesActivas)}
                    </strong>
                    <small>Marcadas como activas en la fuente</small>
                </div>

                <div className="empresa-stat-card">
                    <span>📊 Promedio por empresa</span>
                    <strong>{promedioVacantes}</strong>
                    <small>Vacantes por empresa registrada</small>
                </div>
            </section>

            <section className="empresas-panel">
                <div className="empresas-panel-heading">
                    <div>
                        <h2>Directorio de empresas</h2>
                        <p>Busca, filtra y consulta el detalle de cada empresa.</p>
                    </div>
                </div>

                <div className="empresas-tools">
                    <div className="empresas-search">
                        <span aria-hidden="true">🔎</span>
                        <input
                            type="search"
                            placeholder="Buscar por nombre de empresa..."
                            aria-label="Buscar empresa"
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                        />
                    </div>

                    <select
                        aria-label="Filtrar empresas por estado de vacantes"
                        value={filtroVacantes}
                        onChange={(event) => setFiltroVacantes(event.target.value)}
                    >
                        <option value="todas">Todas las empresas</option>
                        <option value="activas">Con vacantes activas</option>
                        <option value="inactivas">Con vacantes inactivas</option>
                        <option value="sin_activas">Sin vacantes activas</option>
                    </select>

                    <select
                        aria-label="Ordenar empresas"
                        value={orden}
                        onChange={(event) => setOrden(event.target.value)}
                    >
                        <option value="nombre">Ordenar por nombre</option>
                        <option value="vacantes">Más vacantes</option>
                        <option value="activas">Más vacantes activas</option>
                    </select>
                </div>

                <div className="empresas-resultados">
                    Mostrando <strong>{formatearNumero(empresasFiltradas.length)}</strong>
                    {" "}de <strong>{formatearNumero(empresas.length)}</strong> empresas
                </div>

                {cargando && (
                    <div className="empresas-loading">
                        Cargando empresas...
                    </div>
                )}

                {error && (
                    <div className="empresas-error" role="alert">
                        {error}
                    </div>
                )}

                {!cargando && !error && (
                    <div className="empresas-table-container">
                        <table className="empresas-table">
                            <thead>
                                <tr>
                                    <th>Empresa</th>
                                    <th>Total vacantes</th>
                                    <th>Activas</th>
                                    <th>Inactivas</th>
                                    <th>Porcentaje activo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {empresasFiltradas.map((empresa, index) => {
                                    const total = Number(empresa.total_vacantes || 0);
                                    const activas = Number(empresa.vacantes_activas || 0);
                                    const porcentaje = total
                                        ? Math.round((activas / total) * 100)
                                        : 0;

                                    return (
                                        <tr key={`${empresa.empresa}-${index}`}>
                                            <td>
                                                <div className="empresa-nombre-celda">
                                                    <span className="empresa-avatar">
                                                        {(empresa.empresa || "E")
                                                            .trim()
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <strong>{empresa.empresa}</strong>
                                                        <small>Empresa empleadora</small>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <strong>{formatearNumero(total)}</strong>
                                            </td>

                                            <td>
                                                <span className="empresa-badge empresa-badge-activa">
                                                    {formatearNumero(activas)}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="empresa-badge empresa-badge-inactiva">
                                                    {formatearNumero(empresa.vacantes_inactivas)}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="empresa-progreso">
                                                    <div className="empresa-progreso-track">
                                                        <div
                                                            className="empresa-progreso-barra"
                                                            style={{ width: `${porcentaje}%` }}
                                                        />
                                                    </div>
                                                    <span>{porcentaje}%</span>
                                                </div>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn-ver-empresa"
                                                    onClick={() => verEmpresa(empresa.empresa)}
                                                >
                                                    Ver detalle <span aria-hidden="true">→</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {empresasFiltradas.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="sin-empresas">
                                            No se encontraron empresas con esos criterios.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {modalAbierto && (
                <div
                    className="empresa-modal-overlay"
                    onClick={cerrarModal}
                >
                    <div
                        className="empresa-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label={empresaSeleccionada?.empresa || "Detalle de empresa"}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="empresa-modal-close"
                            aria-label="Cerrar"
                            onClick={cerrarModal}
                        >
                            ✕
                        </button>

                        {cargandoDetalle && (
                            <div className="empresas-loading">
                                Cargando información de la empresa...
                            </div>
                        )}

                        {errorDetalle && (
                            <div className="empresas-error" role="alert">
                                {errorDetalle}
                            </div>
                        )}

                        {empresaSeleccionada && (
                            <>
                                <div className="empresa-modal-header">
                                    <span className="empresa-modal-icon">🏢</span>
                                    <div>
                                        <span className="empresas-eyebrow">
                                            FICHA DE EMPRESA
                                        </span>
                                        <h2>{empresaSeleccionada.empresa}</h2>
                                        <p>
                                            {formatearNumero(
                                                empresaSeleccionada.totalVacantes
                                            )}{" "}
                                            vacante(s) registrada(s)
                                        </p>
                                    </div>
                                </div>

                                <div className="empresa-modal-resumen">
                                    <div>
                                        <span>Total de vacantes</span>
                                        <strong>
                                            {formatearNumero(
                                                empresaSeleccionada.totalVacantes
                                            )}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Marcadas activas</span>
                                        <strong>
                                            {formatearNumero(
                                                vacantesEmpresa.filter(
                                                    (v) => Number(v.estado) === 1
                                                ).length
                                            )}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Marcadas inactivas</span>
                                        <strong>
                                            {formatearNumero(
                                                vacantesEmpresa.filter(
                                                    (v) => Number(v.estado) !== 1
                                                ).length
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="empresa-modal-seccion-heading">
                                    <div>
                                        <h3>Vacantes de la empresa</h3>
                                        <p>
                                            Información disponible en el registro de cada oferta.
                                        </p>
                                    </div>
                                </div>

                                <div className="empresa-modal-tools">
                                    <div className="empresas-search">
                                        <span aria-hidden="true">🔎</span>
                                        <input
                                            type="search"
                                            placeholder="Buscar puesto, folio, área o municipio..."
                                            aria-label="Buscar vacante de esta empresa"
                                            value={busquedaVacante}
                                            onChange={(event) =>
                                                setBusquedaVacante(event.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {vacantesFiltradas.length === 0 && (
                                    <p className="sin-empresas">
                                        No hay vacantes que coincidan con la búsqueda.
                                    </p>
                                )}

                                <div className="empresa-vacantes-lista">
                                    {vacantesFiltradas.map((vacante, index) => {
                                        const estado = obtenerEstadoVacante(vacante);

                                        return (
                                            <article
                                                className="empresa-vacante"
                                                key={
                                                    vacante.cve_vacante_sqlserver ??
                                                    vacante.id ??
                                                    `${vacante.folio_oferta}-${index}`
                                                }
                                            >
                                                <div className="empresa-vacante-header">
                                                    <div>
                                                        <span className="empresa-vacante-folio">
                                                            Folio: {vacante.folio_oferta || "Sin folio"}
                                                        </span>
                                                        <h4>
                                                            {vacante.puesto || "Puesto no especificado"}
                                                        </h4>
                                                    </div>

                                                    <span className={`estado-vacante ${estado.clase}`}>
                                                        {estado.texto}
                                                    </span>
                                                </div>

                                                <div className="empresa-vacante-datos">
                                                    <Campo
                                                        etiqueta="Ubicación"
                                                        valor={[
                                                            vacante.municipio,
                                                            vacante.entidad
                                                        ].filter(Boolean).join(", ") || "No especificada"}
                                                        icono="📍"
                                                    />

                                                    <Campo
                                                        etiqueta="Salario"
                                                        valor={formatearSalario(vacante.salario)}
                                                        icono="💰"
                                                    />

                                                    <Campo
                                                        etiqueta="Escolaridad"
                                                        valor={vacante.nivel_estudios || "No especificada"}
                                                        icono="🎓"
                                                    />

                                                    <Campo
                                                        etiqueta="Experiencia"
                                                        valor={vacante.experiencia || "No especificada"}
                                                        icono="💼"
                                                    />

                                                    <Campo
                                                        etiqueta="Área"
                                                        valor={vacante.area || "No especificada"}
                                                        icono="🏷️"
                                                    />

                                                    <Campo
                                                        etiqueta="Subárea"
                                                        valor={vacante.subarea || "No especificada"}
                                                        icono="📂"
                                                    />

                                                    <Campo
                                                        etiqueta="Número de plazas"
                                                        valor={
                                                            vacante.numero_plazas ??
                                                            "No especificado"
                                                        }
                                                        icono="👥"
                                                    />

                                                    <Campo
                                                        etiqueta="Fecha de publicación"
                                                        valor={formatearFecha(vacante.fecha_publicacion)}
                                                        icono="📅"
                                                    />

                                                    <Campo
                                                        etiqueta="Vigencia"
                                                        valor={formatearFecha(vacante.vigencia)}
                                                        icono="🗓️"
                                                    />

                                                    <Campo
                                                        etiqueta="Clave de vacante"
                                                        valor={
                                                            vacante.cve_vacante_sqlserver ??
                                                            vacante.id ??
                                                            "No especificada"
                                                        }
                                                        icono="🔑"
                                                    />
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Empresas;
