import { useEffect, useMemo, useState } from "react";

import { obtenerPersonas } from "../services/personas.service";
import "../styles/personas.css";

function obtenerIniciales(nombre = "") {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function Personas() {
    const [personas, setPersonas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");
    const [filtroPerfil, setFiltroPerfil] = useState("todos"); // todos | completo | pendiente

    useEffect(() => {
        async function cargarPersonas() {
            try {
                const datos = await obtenerPersonas();
                setPersonas(datos.personas || []);
            } catch (error) {
                console.error("Error al cargar personas:", error);
                setError("No se pudieron cargar las personas.");
            } finally {
                setCargando(false);
            }
        }

        cargarPersonas();
    }, []);

    const totalCompletos = useMemo(
        () => personas.filter((p) => p.perfil_completo).length,
        [personas]
    );

    const totalPendientes = personas.length - totalCompletos;

    const porcentajeCompletos =
        personas.length === 0 ? 0 : Math.round((totalCompletos / personas.length) * 100);

    const porcentajePendientes = personas.length === 0 ? 0 : 100 - porcentajeCompletos;

    const personasFiltradas = useMemo(() => {
        return personas.filter((persona) => {
            const coincideBusqueda =
                busqueda.trim() === "" ||
                [persona.nombre_completo, persona.folio, persona.municipio, persona.puesto_solicitado]
                    .filter(Boolean)
                    .some((campo) =>
                        campo.toString().toLowerCase().includes(busqueda.trim().toLowerCase())
                    );

            const coincideFiltro =
                filtroPerfil === "todos" ||
                (filtroPerfil === "completo" && persona.perfil_completo) ||
                (filtroPerfil === "pendiente" && !persona.perfil_completo);

            return coincideBusqueda && coincideFiltro;
        });
    }, [personas, busqueda, filtroPerfil]);

    return (
        <div className="personas-page">
            

            <section className="personas-summary">
                <div className="personas-card personas-card--total">
                    <div className="personas-card-top">
                        <span className="personas-card-icon personas-card-icon--total">👥</span>
                        <span className="personas-card-trend">Registro general</span>
                    </div>
                    <strong>{personas.length}</strong>
                    <span className="personas-card-label">Total de personas</span>
                </div>

                <div className="personas-card personas-card--completo">
                    <div className="personas-card-top">
                        <span className="personas-card-icon personas-card-icon--completo">✓</span>
                        <span className="personas-card-badge personas-card-badge--completo">
                            {porcentajeCompletos}%
                        </span>
                    </div>
                    <strong>{totalCompletos}</strong>
                    <span className="personas-card-label">Perfiles completos</span>
                    <div className="personas-card-bar">
                        <div
                            className="personas-card-bar-fill personas-card-bar-fill--completo"
                            style={{ width: `${porcentajeCompletos}%` }}
                        />
                    </div>
                </div>

                <div className="personas-card personas-card--pendiente">
                    <div className="personas-card-top">
                        <span className="personas-card-icon personas-card-icon--pendiente">!</span>
                        <span className="personas-card-badge personas-card-badge--pendiente">
                            {porcentajePendientes}%
                        </span>
                    </div>
                    <strong>{totalPendientes}</strong>
                    <span className="personas-card-label">Perfiles pendientes</span>
                    <div className="personas-card-bar">
                        <div
                            className="personas-card-bar-fill personas-card-bar-fill--pendiente"
                            style={{ width: `${porcentajePendientes}%` }}
                        />
                    </div>
                </div>
            </section>

            <section className="personas-toolbar">
                <div className="personas-search">
                    <span className="personas-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, folio, municipio o puesto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>

                <div className="personas-filtros">
                    {[
                        { valor: "todos", etiqueta: "Todos" },
                        { valor: "completo", etiqueta: "Completos" },
                        { valor: "pendiente", etiqueta: "Pendientes" },
                    ].map((opcion) => (
                        <button
                            key={opcion.valor}
                            className={`personas-filtro-btn ${
                                filtroPerfil === opcion.valor ? "activo" : ""
                            }`}
                            onClick={() => setFiltroPerfil(opcion.valor)}
                        >
                            {opcion.etiqueta}
                        </button>
                    ))}
                </div>
            </section>

            {cargando && (
                <section className="personas-table-container">
                    <div className="personas-skeleton">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="personas-skeleton-row" />
                        ))}
                    </div>
                </section>
            )}

            {error && <div className="personas-error">⚠ {error}</div>}

            {!cargando && !error && personasFiltradas.length === 0 && (
                <div className="personas-empty">
                    <span>🗂️</span>
                    <p>No se encontraron personas con esos criterios.</p>
                </div>
            )}

            {!cargando && !error && personasFiltradas.length > 0 && (
                <section className="personas-table-container">
                    <table className="personas-table">
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>Nombre</th>
                                <th>Municipio</th>
                                <th>Puesto solicitado</th>
                                <th>Nivel de estudios</th>
                                <th>Perfil</th>
                                <th>Registro</th>
                            </tr>
                        </thead>

                        <tbody>
                            {personasFiltradas.map((persona) => (
                                <tr key={persona.id}>
                                    <td>
                                        <span className="personas-folio">
                                            {persona.folio || "Sin folio"}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="personas-nombre-cell">
                                            <span className="personas-avatar">
                                                {obtenerIniciales(persona.nombre_completo)}
                                            </span>
                                            <strong>{persona.nombre_completo || "Sin nombre"}</strong>
                                        </div>
                                    </td>

                                    <td>{persona.municipio || "Sin municipio"}</td>

                                    <td>{persona.puesto_solicitado || "Sin especificar"}</td>

                                    <td>{persona.nivel_estudios || "Sin especificar"}</td>

                                    <td>
                                        {persona.perfil_completo ? (
                                            <span className="perfil-completo">✓ Completo</span>
                                        ) : (
                                            <span className="perfil-pendiente">! Pendiente</span>
                                        )}
                                    </td>

                                    <td>
                                        {persona.fecha_registro
                                            ? new Date(persona.fecha_registro).toLocaleDateString("es-MX")
                                            : "Sin fecha"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}

export default Personas;