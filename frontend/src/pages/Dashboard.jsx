
import { useEffect, useState } from "react";

import StatCard from "../components/StatCard";
import RecentRegistrations from "../components/RecentRegistrations";
import ProfileStatus from "../components/ProfileStatus";

import { obtenerDashboard } from "../services/dashboard.service";

import "../styles/dashboard.css";

function formatearNumero(valor) {
    return Number(valor || 0).toLocaleString("es-MX");
}

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let activo = true;

        async function cargarDashboard() {
            try {
                setError(null);

                const datos = await obtenerDashboard();

                if (activo) {
                    setDashboard(datos);
                }
            } catch (err) {
                console.error("Error al cargar dashboard:", err);

                if (activo) {
                    setError("No se pudo cargar la información del dashboard.");
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
    }, []);

    if (cargando) {
        return (
            <div className="dashboard-loading">
                <span className="dashboard-loading-icon">📊</span>
                <strong>Cargando dashboard...</strong>
                <span>Consultando información del sistema</span>
            </div>
        );
    }

    if (error && !dashboard) {
        return (
            <div className="dashboard-error" role="alert">
                <strong>Ocurrió un problema</strong>
                <p>{error}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const estadisticas = dashboard?.estadisticas || {};

    const totalPersonas = Number(estadisticas.totalPersonas || 0);
    const perfilesCompletos = Number(estadisticas.perfilesCompletos || 0);
    const perfilesIncompletos = Number(estadisticas.perfilesIncompletos || 0);

    const totalVacantes = Number(estadisticas.totalVacantes || 0);
    const vacantesActivas = Number(estadisticas.vacantesActivas || 0);
    const vacantesInactivas = Number(estadisticas.vacantesInactivas || 0);
    const vacantesVencidas = Number(estadisticas.vacantesVencidas || 0);

    const totalEmpresas = Number(estadisticas.totalEmpresas || 0);

    const porcentajePerfiles = totalPersonas
        ? Math.round((perfilesCompletos / totalPersonas) * 100)
        : 0;

    const porcentajeVacantesActivas = totalVacantes
        ? Math.round((vacantesActivas / totalVacantes) * 100)
        : 0;

    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                
                <div className="dashboard-header-date">
                    <span>Última consulta</span>
                    <strong>
                        {new Date().toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                        })}
                    </strong>
                </div>
            </header>

            {error && (
                <div className="dashboard-warning" role="status">
                    {error} Se muestran los últimos datos disponibles.
                </div>
            )}

            <section className="dashboard-section">
               

                <div className="stats-grid">
                    <StatCard
                        title="Personas registradas"
                        value={formatearNumero(totalPersonas)}
                        icon="👥"
                        description="Usuarios registrados en el sistema"
                    />

                    <StatCard
                        title="Total de vacantes"
                        value={formatearNumero(totalVacantes)}
                        icon="💼"
                        description="Vacantes sincronizadas en el sistema"
                    />

                    <StatCard
                        title="Empresas registradas"
                        value={formatearNumero(totalEmpresas)}
                        icon="🏢"
                        description="Empresas con ofertas laborales"
                    />

                    <StatCard
                        title="Perfiles completos"
                        value={formatearNumero(perfilesCompletos)}
                        icon="📄"
                        description={`${porcentajePerfiles}% de las personas registradas`}
                    />

                    <StatCard
                        title="Vacantes activas"
                        value={formatearNumero(vacantesActivas)}
                        icon="🟢"
                        description="Marcadas como activas en la fuente"
                    />

                    <StatCard
                        title="Vacantes inactivas"
                        value={formatearNumero(vacantesInactivas)}
                        icon="⚪"
                        description="Marcadas como inactivas en la fuente"
                    />

                    <StatCard
                        title="Perfiles incompletos"
                        value={formatearNumero(perfilesIncompletos)}
                        icon="📝"
                        description="Personas con datos pendientes"
                    />

                    <StatCard
                        title="Vacantes vencidas"
                        value={formatearNumero(vacantesVencidas)}
                        icon="📅"
                        description="Activas con fecha de vigencia vencida"
                    />
                </div>
            </section>

            <section className="dashboard-analysis">
                <article className="dashboard-summary-card">
                    <div className="dashboard-card-heading">
                        <div>
                            <span className="dashboard-card-icon">👥</span>
                            <h3>Estado de los perfiles</h3>
                        </div>
                    </div>

                    <div className="dashboard-summary-number">
                        <strong>{porcentajePerfiles}%</strong>
                        <span>perfiles completos</span>
                    </div>

                    <div
                        className="dashboard-progress-track"
                        role="progressbar"
                        aria-label="Porcentaje de perfiles completos"
                        aria-valuenow={porcentajePerfiles}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="dashboard-progress-fill perfiles"
                            style={{ width: `${porcentajePerfiles}%` }}
                        />
                    </div>

                    <div className="dashboard-legend">
                        <span>
                            <i className="dashboard-dot completo" />
                            Completos
                            <strong>{formatearNumero(perfilesCompletos)}</strong>
                        </span>

                        <span>
                            <i className="dashboard-dot incompleto" />
                            Incompletos
                            <strong>{formatearNumero(perfilesIncompletos)}</strong>
                        </span>
                    </div>
                </article>

                <article className="dashboard-summary-card">
                    <div className="dashboard-card-heading">
                        <div>
                            <span className="dashboard-card-icon">💼</span>
                            <h3>Estado de las vacantes</h3>
                        </div>
                    </div>

                    <div className="dashboard-summary-number">
                        <strong>{porcentajeVacantesActivas}%</strong>
                        <span>marcadas como activas</span>
                    </div>

                    <div
                        className="dashboard-progress-track"
                        role="progressbar"
                        aria-label="Porcentaje de vacantes marcadas como activas"
                        aria-valuenow={porcentajeVacantesActivas}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="dashboard-progress-fill vacantes"
                            style={{ width: `${porcentajeVacantesActivas}%` }}
                        />
                    </div>

                    <div className="dashboard-legend">
                        <span>
                            <i className="dashboard-dot completo" />
                            Activas
                            <strong>{formatearNumero(vacantesActivas)}</strong>
                        </span>

                        <span>
                            <i className="dashboard-dot inactivo" />
                            Inactivas
                            <strong>{formatearNumero(vacantesInactivas)}</strong>
                        </span>

                        <span>
                            <i className="dashboard-dot vencido" />
                            Vencidas
                            <strong>{formatearNumero(vacantesVencidas)}</strong>
                        </span>
                    </div>
                </article>
            </section>

            <section className="dashboard-content-section">
                <RecentRegistrations
                    registros={dashboard?.registrosRecientes || []}
                />
            </section>

            <section className="dashboard-content-section">
                <ProfileStatus estadisticas={estadisticas} />
            </section>
        </main>
    );
}

export default Dashboard;
