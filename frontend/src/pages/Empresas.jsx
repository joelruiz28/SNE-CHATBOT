import { useEffect, useMemo, useState, useCallback } from "react";

import {
    obtenerEmpresas,
    obtenerEmpresaPorNombre
} from "../services/empresas.service";

import "../styles/empresas.css";


function Empresas() {

    const [empresas, setEmpresas] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");

    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState(null);



    useEffect(() => {
        let activo = true;

        async function cargarEmpresas() {
            try {
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

        if (!texto) return empresas;

        return empresas.filter((empresa) =>
            empresa.empresa?.toLowerCase().includes(texto)
        );
    }, [empresas, busqueda]);



    const verEmpresa = useCallback(async (nombre) => {
        try {
            setCargandoDetalle(true);
            setErrorDetalle(null);
            setEmpresaSeleccionada(null);

            const datos = await obtenerEmpresaPorNombre(nombre);

            setEmpresaSeleccionada(datos);
        } catch (err) {
            console.error("Error al cargar empresa:", err);
            setErrorDetalle("No se pudo cargar la información de la empresa.");
        } finally {
            setCargandoDetalle(false);
        }
    }, []);

    const cerrarModal = useCallback(() => {
        setEmpresaSeleccionada(null);
        setErrorDetalle(null);
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


    return (
        <div className="empresas-page">

            {/* ==================================
                ESTADÍSTICAS
            ================================== */}

            <section className="empresas-stats">

                <div className="empresa-stat-card">
                    <span>🏢 Empresas</span>
                    <strong>{estadisticas?.totalEmpresas || 0}</strong>
                </div>

                <div className="empresa-stat-card">
                    <span>💼 Vacantes</span>
                    <strong>{estadisticas?.totalVacantes || 0}</strong>
                </div>

                <div className="empresa-stat-card">
                    <span>🟢 Vacantes activas</span>
                    <strong>{estadisticas?.vacantesActivas || 0}</strong>
                </div>

            </section>


            {/* ==================================
                BUSCADOR
            ================================== */}

            <section className="empresas-tools">

                <div className="empresas-search">
                    <span aria-hidden="true">🔎</span>
                    <input
                        type="text"
                        placeholder="Buscar empresa..."
                        aria-label="Buscar empresa"
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                    />
                </div>

                <span>
                    Mostrando <strong>{empresasFiltradas.length}</strong> empresas
                </span>

            </section>


            {/* ==================================
                CARGANDO / ERROR
            ================================== */}

            {cargando && (
                <div className="empresas-loading">Cargando empresas...</div>
            )}

            {error && <div className="empresas-error">{error}</div>}


            {/* ==================================
                TABLA
            ================================== */}

            {!cargando && !error && (
                <section className="empresas-table-container">
                    <table className="empresas-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Vacantes</th>
                                <th>Activas</th>
                                <th>Inactivas</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {empresasFiltradas.map((empresa, index) => (
                                <tr key={`${empresa.empresa}-${index}`}>
                                    <td>
                                        <strong>{empresa.empresa}</strong>
                                    </td>
                                    <td>{empresa.total_vacantes}</td>
                                    <td>
                                        <span className="empresa-activa">
                                            {empresa.vacantes_activas}
                                        </span>
                                    </td>
                                    <td>{empresa.vacantes_inactivas}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn-ver-empresa"
                                            onClick={() => verEmpresa(empresa.empresa)}
                                        >
                                            👁 Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {empresasFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="sin-empresas">
                                        No se encontraron empresas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            )}


            {/* ==================================
                MODAL
            ================================== */}

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

                        {cargandoDetalle && <div>Cargando información...</div>}

                        {errorDetalle && (
                            <div className="empresas-error">{errorDetalle}</div>
                        )}

                        {empresaSeleccionada && (
                            <>
                                <h2>🏢 {empresaSeleccionada.empresa}</h2>

                                <p>
                                    <strong>Vacantes:</strong>{" "}
                                    {empresaSeleccionada.totalVacantes}
                                </p>

                                <hr />

                                <h3>Vacantes de la empresa</h3>

                                {(empresaSeleccionada.vacantes || []).map((vacante) => (
                                    <div className="empresa-vacante" key={vacante.id}>
                                        <strong>{vacante.puesto}</strong>
                                        <span>
                                            📍 {vacante.municipio || "Sin municipio"}
                                        </span>
                                        <span>
                                            💰{" "}
                                            {vacante.salario
                                                ? `$${Number(vacante.salario).toLocaleString("es-MX")} MXN`
                                                : "No especificado"}
                                        </span>
                                    </div>
                                ))}

                                {empresaSeleccionada.vacantes?.length === 0 && (
                                    <p className="sin-empresas">
                                        Esta empresa no tiene vacantes registradas.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

export default Empresas;