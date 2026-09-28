import { useEffect, useState } from "react";

import {
    Users,
    Building2,
    Briefcase,
    Zap,
    FileText,
    CheckCircle2,
    Clock,
    UserMinus,
    Search,
    Link2,
    MapPin,
    TrendingUp,
    Minus,
    AlertTriangle,
    Loader2,
    CalendarClock,
} from "lucide-react";

import {
    obtenerDashboardReportes
} from "../services/reportes.service";

import "../styles/reportes.css";


function Reportes() {

    const [datos, setDatos] = useState(null);

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState(null);


    // ==========================================
    // CARGAR DASHBOARD
    // ==========================================

    useEffect(() => {

        async function cargarDashboard() {

            try {

                setCargando(true);

                const resultado =
                    await obtenerDashboardReportes();

                console.log(
                    "📊 DASHBOARD REPORTES:",
                    resultado
                );

                setDatos(resultado);

            } catch (error) {

                console.error(
                    "❌ Error dashboard:",
                    error
                );

                setError(
                    error.message ||
                    "No se pudo cargar el dashboard."
                );

            } finally {

                setCargando(false);

            }

        }

        cargarDashboard();

    }, []);


    // ==========================================
    // CARGANDO
    // ==========================================

    if (cargando) {

        return (

            <section className="reportes-page">

                <div className="reportes-loading">

                    <div className="reportes-spinner">
                        <Loader2 size={40} strokeWidth={2} />
                    </div>

                    <h2>
                        Cargando reportes...
                    </h2>

                    <p>
                        Estamos preparando la información
                        del Sistema Nacional de Empleo.
                    </p>

                </div>

            </section>

        );

    }


    // ==========================================
    // ERROR
    // ==========================================

    if (error) {

        return (

            <section className="reportes-page">

                <div className="reportes-error">

                    <div className="reportes-error-icon">
                        <AlertTriangle size={22} strokeWidth={2} />
                    </div>

                    <div>

                        <h2>
                            No se pudieron cargar los reportes
                        </h2>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            </section>

        );

    }


    // ==========================================
    // SEGURIDAD
    // ==========================================

    if (!datos) {
        return null;
    }


    const indicadores =
        datos.indicadores || {};

    const vinculacion =
        datos.vinculacion || {};

    const oportunidades =
        datos.oportunidades || [];

    const municipios =
        datos.municipios || {};

    const puestos =
        datos.puestos || [];

    const empresas =
        datos.empresas || [];

    const alertas =
        datos.alertas || {};

    const fechaActual = new Date().toLocaleDateString(
        "es-MX",
        { day: "numeric", month: "long", year: "numeric" }
    );

    // Icono + estilo de badge según la situación de la oportunidad
    function badgeVisual(oportunidad) {

        const clave = (oportunidad || "")
            .toLowerCase()
            .replaceAll(" ", "-");

        switch (clave) {

            case "oferta-disponible":
                return { icon: <CheckCircle2 />, clave };

            case "sin-vacantes":
                return { icon: <AlertTriangle />, clave };

            case "alta":
                return { icon: <TrendingUp />, clave };

            case "media":
                return { icon: <Minus />, clave };

            default:
                return { icon: null, clave };

        }

    }


    return (

        <section className="reportes-page">




            {/* ======================================
                INDICADORES
            ====================================== */}

            <section className="reportes-indicadores">


                <div className="reporte-card">

                    <div className="reporte-icon">
                        <Users size={20} strokeWidth={1.75} />
                    </div>

                    <div className="reporte-card-body">

                        <span>
                            Personas registradas
                        </span>

                        <strong>
                            {indicadores.personas || 0}
                        </strong>

                    </div>

                </div>


                <div className="reporte-card">

                    <div className="reporte-icon">
                        <Building2 size={20} strokeWidth={1.75} />
                    </div>

                    <div className="reporte-card-body">

                        <span>
                            Empresas
                        </span>

                        <strong>
                            {indicadores.empresas || 0}
                        </strong>

                    </div>

                </div>


                <div className="reporte-card">

                    <div className="reporte-icon">
                        <Briefcase size={20} strokeWidth={1.75} />
                    </div>

                    <div className="reporte-card-body">

                        <span>
                            Vacantes
                        </span>

                        <strong>
                            {indicadores.vacantes || 0}
                        </strong>

                    </div>

                </div>


                <div className="reporte-card">

                    <div className="reporte-icon complete">
                        <Zap size={20} strokeWidth={1.75} />
                    </div>

                    <div className="reporte-card-body">

                        <span>
                            Vacantes activas
                        </span>

                        <strong>
                            {indicadores.vacantesActivas || 0}
                        </strong>

                    </div>

                </div>


            </section>


            {/* ======================================
                SEGUNDOS INDICADORES
            ====================================== */}

            <section className="reportes-indicadores secundarios">


                <div className="reporte-card">

                    <div className="reporte-icon">
                        <FileText size={20} strokeWidth={1.75} />
                    </div>

                    <div className="reporte-card-body">

                        <span>
                            Folios generados
                        </span>

                        <strong>
                            {indicadores.folios || 0}
                        </strong>

                    </div>

                </div>


                <div className="reporte-card">

                    <div className="reporte-icon complete">
                        <CheckCircle2 size={20} strokeWidth={1.75} />
                    </div>

                    <div className="reporte-card-body">

                        <span>
                            Perfiles completos
                        </span>

                        <strong>
                            {indicadores.perfilesCompletos || 0}
                        </strong>

                    </div>

                </div>


                <div className="reporte-card">

                    <div className="reporte-icon pending">
                        <Clock size={20} strokeWidth={1.75} />
                    </div>

                    <div className="reporte-card-body">

                        <span>
                            Perfiles pendientes
                        </span>

                        <strong>
                            {indicadores.perfilesPendientes || 0}
                        </strong>

                    </div>

                </div>


            </section>


            {/* ======================================
                VINCULACIÓN
            ====================================== */}

            <section className="reporte-section">

                <div className="reporte-section-header">

                    <div>

                        <span>
                            <Link2 size={12} strokeWidth={2.5} />
                            Vinculación laboral
                        </span>

                        <h2>
                            Situación de la vinculación
                        </h2>

                    </div>

                </div>


                <div className="vinculacion-grid">


                    <div className="vinculacion-card">

                        <div className="vinculacion-card-top">

                            <span>
                                Personas sin vacante
                            </span>

                            <div className="vinculacion-icon">
                                <UserMinus size={15} strokeWidth={1.75} />
                            </div>

                        </div>

                        <strong>
                            {vinculacion.personasSinVacante || 0}
                        </strong>

                        <p>
                            Personas que aún no tienen
                            una oportunidad laboral.
                        </p>

                    </div>


                    <div className="vinculacion-card">

                        <div className="vinculacion-card-top">

                            <span>
                                Vacantes sin candidatos
                            </span>

                            <div className="vinculacion-icon">
                                <Search size={15} strokeWidth={1.75} />
                            </div>

                        </div>

                        <strong>
                            {vinculacion.vacantesSinCandidatos || 0}
                        </strong>

                        <p>
                            Vacantes que requieren
                            candidatos.
                        </p>

                    </div>


                    <div className="vinculacion-card">

                        <div className="vinculacion-card-top">

                            <span>
                                Coincidencias
                            </span>

                            <div className="vinculacion-icon">
                                <Link2 size={15} strokeWidth={1.75} />
                            </div>

                        </div>

                        <strong>
                            {vinculacion.coincidencias || 0}
                        </strong>

                        <p>
                            Coincidencias entre
                            demanda y oferta laboral.
                        </p>

                    </div>


                </div>

            </section>


            {/* ======================================
                OPORTUNIDADES
            ====================================== */}

            <section className="reporte-section">

                <div className="reporte-section-header">

                    <div>

                        <span>
                            <TrendingUp size={12} strokeWidth={2.5} />
                            Mercado laboral
                        </span>

                        <h2>
                            Demanda vs oferta
                        </h2>

                        <p>
                            Comparación entre personas
                            interesadas y vacantes disponibles.
                        </p>

                    </div>

                </div>


                <div className="oportunidades-table-container">

                    <table className="oportunidades-table">

                        <thead>

                            <tr>

                                <th>
                                    Puesto
                                </th>

                                <th>
                                    Personas
                                </th>

                                <th>
                                    Vacantes
                                </th>

                                <th>
                                    Situación
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {oportunidades.map(
                                (item, index) => {

                                    const { icon, clave } =
                                        badgeVisual(item.oportunidad);

                                    return (

                                        <tr key={index}>

                                            <td>
                                                <strong>
                                                    {item.puesto}
                                                </strong>
                                            </td>

                                            <td>
                                                {item.personas}
                                            </td>

                                            <td>
                                                {item.vacantes}
                                            </td>

                                            <td>

                                                <span
                                                    className={`oportunidad-badge ${clave}`}
                                                >

                                                    {icon}
                                                    {item.oportunidad}

                                                </span>

                                            </td>

                                        </tr>

                                    );

                                }
                            )}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* ======================================
                MUNICIPIOS
            ====================================== */}

            <section className="reportes-doble">


                <div className="reporte-panel">

                    <div className="reporte-panel-header">

                        <div>

                            <span>
                                Personas
                            </span>

                            <h2>
                                Personas por municipio
                            </h2>

                        </div>

                        <div className="reporte-panel-icon">
                            <MapPin size={17} strokeWidth={1.75} />
                        </div>

                    </div>


                    <div className="reporte-list">

                        {municipios.personas?.map(
                            (item, index) => (

                                <div
                                    className="reporte-list-item"
                                    key={index}
                                >

                                    <span>
                                        {item.municipio}
                                    </span>

                                    <strong>
                                        {item.total}
                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                </div>


                <div className="reporte-panel">

                    <div className="reporte-panel-header">

                        <div>

                            <span>
                                Vacantes
                            </span>

                            <h2>
                                Vacantes por municipio
                            </h2>

                        </div>

                        <div className="reporte-panel-icon">
                            <Briefcase size={17} strokeWidth={1.75} />
                        </div>

                    </div>


                    <div className="reporte-list">

                        {municipios.vacantes?.map(
                            (item, index) => (

                                <div
                                    className="reporte-list-item"
                                    key={index}
                                >

                                    <span>
                                        {item.municipio}
                                    </span>

                                    <strong>
                                        {item.total}
                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                </div>


            </section>


            {/* ======================================
                PUESTOS
            ====================================== */}

            <section className="reporte-section">

                <div className="reporte-section-header">

                    <div>

                        <span>
                            <Briefcase size={12} strokeWidth={2.5} />
                            Demanda laboral
                        </span>

                        <h2>
                            Puestos más solicitados
                        </h2>

                    </div>

                </div>


                <div className="reporte-list puestos">

                    {puestos.map(
                        (item, index) => (

                            <div
                                className="puesto-item"
                                key={index}
                            >

                                <div>

                                    <span
                                        className={`puesto-rank ${
                                            index === 0 ? "top" : ""
                                        }`}
                                    >
                                        {index + 1}
                                    </span>

                                    <strong>
                                        {item.puesto}
                                    </strong>

                                </div>

                                <span className="puesto-total">
                                    {item.total}
                                </span>

                            </div>

                        )
                    )}

                </div>

            </section>


            {/* ======================================
                EMPRESAS
            ====================================== */}

            <section className="reporte-section">

                <div className="reporte-section-header">

                    <div>

                        <span>
                            <Building2 size={12} strokeWidth={2.5} />
                            Oferta laboral
                        </span>

                        <h2>
                            Empresas con más vacantes
                        </h2>

                    </div>

                </div>


                <div className="empresas-grid">

                    {empresas.map(
                        (empresa, index) => (

                            <div
                                className="empresa-card"
                                key={index}
                            >

                                <div className="empresa-number">
                                    {index + 1}
                                </div>

                                <div className="empresa-info">

                                    <strong>
                                        {empresa.empresa}
                                    </strong>

                                    <span>
                                        <Briefcase size={11} strokeWidth={2} />
                                        {empresa.totalVacantes}
                                        {" "}
                                        vacantes
                                    </span>

                                </div>

                                <div className="empresa-plazas">

                                    <strong>
                                        {empresa.plazas}
                                    </strong>

                                    <span>
                                        plazas
                                    </span>

                                </div>

                            </div>

                        )
                    )}

                </div>

            </section>


            {/* ======================================
                ALERTAS
            ====================================== */}

            <section className="reporte-section">

                <div className="reporte-section-header">

                    <div>

                        <span>
                            <AlertTriangle size={12} strokeWidth={2.5} />
                            Atención
                        </span>

                        <h2>
                            Alertas del sistema
                        </h2>

                    </div>

                </div>


                <div className="alertas-grid">


                    <div className="alerta-card">

                        <div className="alerta-icon">
                            <UserMinus size={19} strokeWidth={1.75} />
                        </div>

                        <div>

                            <strong>
                                {alertas.personasSinVacante || 0}
                            </strong>

                            <p>
                                Personas sin vacante
                            </p>

                        </div>

                    </div>


                    <div className="alerta-card">

                        <div className="alerta-icon">
                            <Search size={19} strokeWidth={1.75} />
                        </div>

                        <div>

                            <strong>
                                {alertas.vacantesSinCandidatos || 0}
                            </strong>

                            <p>
                                Vacantes sin candidatos
                            </p>

                        </div>

                    </div>


                    <div className="alerta-card">

                        <div className="alerta-icon">
                            <Clock size={19} strokeWidth={1.75} />
                        </div>

                        <div>

                            <strong>
                                {alertas.perfilesPendientes || 0}
                            </strong>

                            <p>
                                Perfiles pendientes
                            </p>

                        </div>

                    </div>


                </div>

            </section>


        </section>

    );

}


export default Reportes;