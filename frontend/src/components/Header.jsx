import { useLocation } from "react-router-dom";

import {
    LayoutDashboard,
    Users,
    Briefcase,
    Building2,
    FileText,
    BarChart3,
    Settings,
    Bell,
    ChevronDown,
} from "lucide-react";

import "../styles/header.css";


function Header() {

    const location = useLocation();


    const headers = {

        "/dashboard": {
            titulo: "INICIO",
            descripcion:
                "Resumen general del Sistema Nacional de Empleo",
            icono: <LayoutDashboard size={19} strokeWidth={1.75} />
        },

        "/personas": {
            titulo: "Personas",
            descripcion:
                "Personas registradas en el Sistema Nacional de Empleo",
            icono: <Users size={19} strokeWidth={1.75} />
        },

        "/vacantes": {
            titulo: "Vacantes",
            descripcion:
                "Administración de vacantes disponibles",
            icono: <Briefcase size={19} strokeWidth={1.75} />
        },

        "/empresas": {
            titulo: "Empresas",
            descripcion:
                "Empresas registradas en el Sistema Nacional de Empleo",
            icono: <Building2 size={19} strokeWidth={1.75} />
        },

        "/folios": {
            titulo: "Folios",
            descripcion:
                "Consulta y administración de folios",
            icono: <FileText size={19} strokeWidth={1.75} />
        },


        "/postulaciones": {
            titulo: "Postulaciones",
            descripcion:
                "Consulta las postulaciones de los buscadores de empleo a las vacantes registradas.",
            icono: <BarChart3 size={19} strokeWidth={1.75} />
        },

        "/reportes": {
            titulo: "Reportes",
            descripcion:
                "Reportes y estadísticas del Sistema Nacional de Empleo",
            icono: <BarChart3 size={19} strokeWidth={1.75} />
        },

        "/configuracion": {
            titulo: "Configuración",
            descripcion:
                "Configuración del Sistema Nacional de Empleo",
            icono: <Settings size={19} strokeWidth={1.75} />
        }

    };


    const informacion =
        headers[location.pathname] || headers["/dashboard"];


    return (

        <header className="header">

            <div className="header-title-group">

                <div className="header-badge">
                    {informacion.icono}
                </div>

                {/* key fuerza el remount para animar el cambio de sección */}
                <div className="header-title" key={location.pathname}>

                    <span className="header-eyebrow">
                        Bolsa de Trabajo · Chiapas
                    </span>

                    <h1>
                        {informacion.titulo}
                    </h1>

                    <p>
                        {informacion.descripcion}
                    </p>

                </div>

            </div>


            <div className="header-actions">

                <button className="notification-button" aria-label="Notificaciones">
                    <Bell size={18} strokeWidth={1.75} />
                    <span className="notification-dot" />
                </button>


                <div className="header-user" role="button" tabIndex={0}>

                    <div className="header-avatar">
                        JE
                        <span className="header-avatar-status" />
                    </div>


                    <div className="header-user-info">

                        <strong>
                            Administrador
                        </strong>

                        <span>
                            Panel de control
                        </span>

                    </div>

                    <span className="header-user-caret">
                        <ChevronDown size={16} strokeWidth={2} />
                    </span>

                </div>

            </div>

            <div className="sne-topo-rule header-topo" />

        </header>

    );

}


export default Header;