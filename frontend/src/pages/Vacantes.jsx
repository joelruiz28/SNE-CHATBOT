
import { useEffect, useState } from "react";

import {
    obtenerVacantes,
    obtenerVacantePorId
} from "../services/vacantes.service";

import "../styles/vacantes.css";

function Vacantes() {
    const [vacantes, setVacantes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    const [vacanteSeleccionada, setVacanteSeleccionada] =
        useState(null);

    const [cargandoDetalle, setCargandoDetalle] =
        useState(false);

    const [errorDetalle, setErrorDetalle] = useState(null);

    useEffect(() => {
        async function cargarVacantes() {
            try {
                const datos = await obtenerVacantes();

                setVacantes(
                    Array.isArray(datos)
                        ? datos
                        : Array.isArray(datos?.vacantes)
                            ? datos.vacantes
                            : []
                );
            } catch (error) {
                console.error("Error al cargar vacantes:", error);
                setError("No se pudieron cargar las vacantes.");
            } finally {
                setCargando(false);
            }
        }

        cargarVacantes();
    }, []);

    const vacantesFiltradas = vacantes.filter((vacante) => {
        const texto = busqueda.trim().toLowerCase();

        return [
            vacante.folio_oferta,
            vacante.puesto,
            vacante.empresa,
            vacante.municipio,
            vacante.entidad,
            vacante.nivel_estudios,
            vacante.experiencia
        ].some((campo) =>
            String(campo ?? "").toLowerCase().includes(texto)
        );
    });

    function formatearSalario(salario) {
        if (salario === null || salario === undefined || salario === "") {
            return "No especificado";
        }

        const numero = Number(salario);

        if (!Number.isFinite(numero)) {
            return "No especificado";
        }

        return `$${numero.toLocaleString("es-MX")} MXN`;
    }

    function formatearFecha(fecha) {
        if (!fecha) {
            return "Sin fecha";
        }

        const fechaConvertida = new Date(fecha);

        if (Number.isNaN(fechaConvertida.getTime())) {
            return "Sin fecha";
        }

        return fechaConvertida.toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC"
        });
    }

    function obtenerEstadoVacante(vacante) {
        const estadoActivo =
            Number(vacante.estado) === 1;

        if (!estadoActivo) {
            return {
                texto: "Inactiva",
                clase: "inactiva"
            };
        }

        if (vacante.vigencia) {
            const fechaVigencia = new Date(vacante.vigencia);

            if (
                !Number.isNaN(fechaVigencia.getTime())
            ) {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);

                fechaVigencia.setHours(0, 0, 0, 0);

                if (fechaVigencia < hoy) {
                    return {
                        texto: "Vencida",
                        clase: "vencida"
                    };
                }
            }
        }

        return {
            texto: "Vigente",
            clase: "vigente"
        };
    }

    async function verVacante(id) {
        try {
            setCargandoDetalle(true);
            setErrorDetalle(null);
            setVacanteSeleccionada(null);

            const vacante = await obtenerVacantePorId(id);

            setVacanteSeleccionada(
                vacante?.vacante ?? vacante
            );
        } catch (error) {
            console.error("Error al cargar detalle:", error);

            setErrorDetalle(
                "No se pudo cargar la información de la vacante."
            );
        } finally {
            setCargandoDetalle(false);
        }
    }

    function cerrarDetalle() {
        setVacanteSeleccionada(null);
        setErrorDetalle(null);
    }

    return (
        <>
            <section className="vacantes-summary">
                <div className="vacantes-total">
                    <span>Total de vacantes</span>
                    <strong>{vacantes.length}</strong>
                </div>
            </section>

            <section className="vacantes-tools">
                <div className="vacantes-search">
                    <span>🔎</span>

                    <input
                        type="text"
                        placeholder="Buscar por folio, puesto, empresa o municipio..."
                        value={busqueda}
                        onChange={(event) =>
                            setBusqueda(event.target.value)
                        }
                    />
                </div>

                <div className="vacantes-results">
                    Mostrando{" "}
                    <strong>{vacantesFiltradas.length}</strong>
                    {" "}vacantes
                </div>
            </section>

            {cargando && (
                <div className="vacantes-loading">
                    Cargando vacantes...
                </div>
            )}

            {error && (
                <div className="vacantes-error">
                    {error}
                </div>
            )}

            {!cargando && !error && (
                <section className="vacantes-table-container">
                    <table className="vacantes-table">
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>Puesto</th>
                                <th>Empresa</th>
                                <th>Municipio</th>
                                <th>Salario</th>
                                <th>Experiencia</th>
                                <th>Estado</th>
                                <th>Publicación</th>
                            </tr>
                        </thead>

                        <tbody>
                            {vacantesFiltradas.map((vacante) => {
                                const estado =
                                    obtenerEstadoVacante(vacante);

                                return (
                                    <tr
                                        key={vacante.id}
                                        onClick={() =>
                                            verVacante(vacante.id)
                                        }
                                        title="Consultar detalle de la vacante"
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td className="vacante-folio">
                                            {vacante.folio_oferta ||
                                                "Sin folio"}
                                        </td>

                                        <td>
                                            <strong>
                                                {vacante.puesto ||
                                                    "Sin especificar"}
                                            </strong>
                                        </td>

                                        <td>
                                            {vacante.empresa ||
                                                "Sin empresa"}
                                        </td>

                                        <td>
                                            {vacante.municipio ||
                                                "Sin municipio"}
                                        </td>

                                        <td className="vacante-salario">
                                            {formatearSalario(
                                                vacante.salario
                                            )}
                                        </td>

                                        <td>
                                            {vacante.experiencia ||
                                                "No especificada"}
                                        </td>

                                        <td>
                                            <span
                                                className={`estado-vacante ${estado.clase}`}
                                            >
                                                {estado.texto}
                                            </span>
                                        </td>

                                        <td>
                                            {formatearFecha(
                                                vacante.fecha_publicacion
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {vacantesFiltradas.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="sin-vacantes"
                                    >
                                        No se encontraron vacantes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            )}

            {(vacanteSeleccionada ||
                cargandoDetalle ||
                errorDetalle) && (
                <div
                    className="modal-overlay"
                    onClick={cerrarDetalle}
                >
                    <div
                        className="vacante-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <button
                            className="modal-close"
                            onClick={cerrarDetalle}
                            aria-label="Cerrar detalle"
                        >
                            ✕
                        </button>

                        {cargandoDetalle && (
                            <div className="modal-loading">
                                Cargando información...
                            </div>
                        )}

                        {errorDetalle && (
                            <div className="modal-error">
                                {errorDetalle}
                            </div>
                        )}

                        {vacanteSeleccionada && (
                            <>
                                <div className="vacante-modal-header">
                                    <div>
                                        <span className="vacante-modal-label">
                                            Vacante
                                        </span>

                                        <h2>
                                            {vacanteSeleccionada.puesto ||
                                                "Sin puesto"}
                                        </h2>

                                        <p>
                                            {vacanteSeleccionada.empresa ||
                                                "Empresa no especificada"}
                                        </p>
                                    </div>

                                    <span className="vacante-modal-folio">
                                        {vacanteSeleccionada.folio_oferta ||
                                            "Sin folio"}
                                    </span>

                                    {(() => {
                                        const estado =
                                            obtenerEstadoVacante(
                                                vacanteSeleccionada
                                            );

                                        return (
                                            <span
                                                className={`estado-vacante ${estado.clase}`}
                                            >
                                                {estado.texto}
                                            </span>
                                        );
                                    })()}
                                </div>

                                <div className="vacante-detail-grid">
                                    <div className="vacante-detail-item">
                                        <span>🏢 Empresa</span>
                                        <strong>
                                            {vacanteSeleccionada.empresa ||
                                                "No especificada"}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>📍 Ubicación</span>
                                        <strong>
                                            {[
                                                vacanteSeleccionada.municipio,
                                                vacanteSeleccionada.entidad
                                            ]
                                                .filter(Boolean)
                                                .join(", ") ||
                                                "No especificada"}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>💰 Salario</span>
                                        <strong>
                                            {formatearSalario(
                                                vacanteSeleccionada.salario
                                            )}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>👥 Plazas disponibles</span>
                                        <strong>
                                            {vacanteSeleccionada.numero_plazas ??
                                                "No especificado"}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>🎓 Nivel de estudios</span>
                                        <strong>
                                            {vacanteSeleccionada.nivel_estudios ||
                                                "No especificado"}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>💼 Experiencia</span>
                                        <strong>
                                            {vacanteSeleccionada.experiencia ||
                                                "No especificada"}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>📂 Área</span>
                                        <strong>
                                            {vacanteSeleccionada.area ||
                                                "No especificada"}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>📁 Subárea</span>
                                        <strong>
                                            {vacanteSeleccionada.subarea ||
                                                "No especificada"}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>📅 Fecha de publicación</span>
                                        <strong>
                                            {formatearFecha(
                                                vacanteSeleccionada.fecha_publicacion
                                            )}
                                        </strong>
                                    </div>

                                    <div className="vacante-detail-item">
                                        <span>⏳ Vigencia hasta</span>
                                        <strong>
                                            {formatearFecha(
                                                vacanteSeleccionada.vigencia
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default Vacantes;
