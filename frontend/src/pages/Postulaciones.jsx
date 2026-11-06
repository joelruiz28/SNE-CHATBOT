
import "../styles/Postulaciones.css";
import { useEffect, useMemo, useState } from "react";
import { obtenerPostulaciones } from "../services/postulaciones.service";

function Postulaciones() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState("Todos");

    async function cargarPostulaciones() {
        try {
            setCargando(true);
            setError("");

            const respuesta = await obtenerPostulaciones();
            const lista = Array.isArray(respuesta)
                ? respuesta
                : respuesta.postulaciones;

            if (!Array.isArray(lista)) {
                throw new Error(
                    "La API no devolvió una lista válida de postulaciones."
                );
            }

            setDatos(lista);
        } catch (err) {
            setError(
                err.message || "No se pudieron cargar las postulaciones."
            );
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarPostulaciones();
    }, []);

    const normalizar = (valor) =>
        String(valor ?? "").toLocaleLowerCase("es-MX").trim();

    const postulacionesFiltradas = useMemo(() => {
        return datos.filter((item) => {
            const texto = [
                item.nombre_completo,
                item.folio,
                item.puesto,
                item.empresa,
                item.estado
            ].map(normalizar).join(" ");

            const coincideTexto = texto.includes(normalizar(busqueda));

            const coincideEstado =
                estado === "Todos" ||
                normalizar(item.estado) === normalizar(estado);

            return coincideTexto && coincideEstado;
        });
    }, [datos, busqueda, estado]);

    const total = datos.length;

    const activas = datos.filter((item) =>
        ["postulada", "activa", "en revisión", "en revision"]
            .includes(normalizar(item.estado))
    ).length;

    const canceladas = datos.filter(
        (item) => normalizar(item.estado) === "cancelada"
    ).length;

    function obtenerIniciales(nombre) {
        return String(nombre || "SE")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((parte) => parte.charAt(0).toLocaleUpperCase("es-MX"))
            .join("");
    }

    function obtenerClaseEstado(valor) {
        const estadoNormalizado = normalizar(valor);

        const clases = {
            "postulada": "postulada",
            "activa": "postulada",
            "en revisión": "revision",
            "en revision": "revision",
            "aceptada": "aceptada",
            "rechazada": "rechazada",
            "cancelada": "cancelada"
        };

        return clases[estadoNormalizado] || "postulada";
    }

    function formatearFecha(fecha) {
        if (!fecha) return "Sin fecha";

        const fechaObjeto = new Date(fecha);

        if (Number.isNaN(fechaObjeto.getTime())) {
            return "Sin fecha";
        }

        return fechaObjeto.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        });
    }

    return (
        <section className="postulaciones-page">
            {/* Encabezado */}
           

            {/* Estadísticas */}
            <section className="postulaciones-summary">
                <article className="postulaciones-card postulaciones-card--total">
                    <div className="postulaciones-card-top">
                        <div className="postulaciones-card-icon postulaciones-card-icon--total">
                            <span>▤</span>
                        </div>
                    </div>

                    <span className="postulaciones-card-label">
                        Total de postulaciones
                    </span>

                    <strong>{cargando ? "—" : total}</strong>
                </article>

                <article className="postulaciones-card postulaciones-card--activa">
                    <div className="postulaciones-card-top">
                        <div className="postulaciones-card-icon postulaciones-card-icon--activa">
                            <span>✓</span>
                        </div>

                        <span className="postulaciones-card-badge postulaciones-card-badge--activa">
                            En proceso
                        </span>
                    </div>

                    <span className="postulaciones-card-label">
                        Postulaciones activas
                    </span>

                    <strong>{cargando ? "—" : activas}</strong>
                </article>

                <article className="postulaciones-card postulaciones-card--cancelada">
                    <div className="postulaciones-card-top">
                        <div className="postulaciones-card-icon postulaciones-card-icon--cancelada">
                            <span>×</span>
                        </div>

                        <span className="postulaciones-card-badge postulaciones-card-badge--cancelada">
                            Canceladas
                        </span>
                    </div>

                    <span className="postulaciones-card-label">
                        Postulaciones canceladas
                    </span>

                    <strong>{cargando ? "—" : canceladas}</strong>
                </article>
            </section>

            {/* Listado */}
            <section className="postulaciones-listado">
                <div className="postulaciones-listado-header">
                    <div>
                        <h2>Listado de postulaciones</h2>
                        <p>
                            Consulta y filtra las solicitudes registradas.
                        </p>
                    </div>
                </div>

                {/* Búsqueda y filtros */}
                <div className="postulaciones-toolbar">
                    <label className="postulaciones-search">
                        <span className="postulaciones-search-icon">⌕</span>

                        <input
                            type="search"
                            placeholder="Buscar persona, vacante o empresa..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </label>

                    <div className="postulaciones-filtros">
                        {[
                            "Todos",
                            "Postulada",
                            "En revisión",
                            "Aceptada",
                            "Rechazada",
                            "Cancelada"
                        ].map((opcion) => (
                            <button
                                key={opcion}
                                type="button"
                                className={
                                    "postulaciones-filtro-btn" +
                                    (estado === opcion ? " activo" : "")
                                }
                                onClick={() => setEstado(opcion)}
                            >
                                {opcion === "Todos"
                                    ? "Todos los estados"
                                    : opcion}
                            </button>
                        ))}
                    </div>
                </div>

                {!cargando && !error && (
                    <div className="postulaciones-resultados">
                        <span>
                            Mostrando{" "}
                            <strong>{postulacionesFiltradas.length}</strong>{" "}
                            de <strong>{total}</strong> postulaciones
                        </span>
                    </div>
                )}

                {/* Carga */}
                {cargando && (
                    <div className="postulaciones-loading">
                        <div className="postulaciones-skeleton-row" />
                        <div className="postulaciones-skeleton-row" />
                        <div className="postulaciones-skeleton-row" />
                        <p>Cargando postulaciones...</p>
                    </div>
                )}

                {/* Error */}
                {!cargando && error && (
                    <div className="postulaciones-error" role="alert">
                        <strong>No se pudieron cargar los datos</strong>
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={cargarPostulaciones}
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Tabla */}
                {!cargando && !error && (
                    <div className="postulaciones-table-container">
                        <table className="postulaciones-table">
                            <thead>
                                <tr>
                                    <th>Persona</th>
                                    <th>Vacante</th>
                                    <th>Empresa</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>

                            <tbody>
                                {postulacionesFiltradas.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="postulaciones-persona">
                                                <div className="postulaciones-avatar">
                                                    {obtenerIniciales(
                                                        item.nombre_completo
                                                    )}
                                                </div>

                                                <div className="postulaciones-persona-info">
                                                    <strong>
                                                        {item.nombre_completo ||
                                                            "Sin nombre"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="postulaciones-vacante">
                                                <strong>
                                                    {item.puesto || "Sin vacante"}
                                                </strong>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="postulaciones-empresa">
                                                {item.empresa || "Sin empresa"}
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    "postulaciones-estado postulaciones-estado--" +
                                                    obtenerClaseEstado(item.estado)
                                                }
                                            >
                                                {item.estado || "Sin estado"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="postulaciones-fecha">
                                                {formatearFecha(
                                                    item.fecha_postulacion
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {postulacionesFiltradas.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="postulaciones-empty">
                                                <div className="postulaciones-empty-icon">
                                                    ⌕
                                                </div>

                                                <strong>
                                                    No se encontraron postulaciones
                                                </strong>

                                                <span>
                                                    Prueba con otra búsqueda o
                                                    selecciona otro estado.
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
}

export default Postulaciones;
