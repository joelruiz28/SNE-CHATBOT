import {
    UserRound,
    Bot,
    ClipboardList,
    Bell,
    Building2,
    ArrowRight,
} from "lucide-react";

import "../styles/configuraciones.css";

const configuraciones = [
    {
        id: "perfil",
        icon: UserRound,
        title: "Mi perfil",
        description: "Administra tus datos personales y la información de tu cuenta.",
    },
    {
        id: "chatbot",
        icon: Bot,
        title: "Chatbot",
        description: "Configura el comportamiento y las funcionalidades del asistente.",
    },
    {
        id: "catalogos",
        icon: ClipboardList,
        title: "Catálogos",
        description: "Administra municipios, carreras, horarios y otras opciones.",
    },
    {
        id: "notificaciones",
        icon: Bell,
        title: "Notificaciones",
        description: "Configura las alertas y avisos importantes del sistema.",
    },
];

function ConfigCard({ icon: Icon, title, description }) {
    return (
        <button className="config-card">
            <div className="config-card-icon">
                <Icon size={24} strokeWidth={2} />
            </div>

            <div className="config-card-content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>

            <div className="config-card-arrow">
                <ArrowRight size={19} />
            </div>
        </button>
    );
}

export default function Configuraciones() {
    return (
        <main className="configuraciones-page">


            {/* TARJETAS */}
            <section className="configuraciones-grid">

                {configuraciones.map((config) => (
                    <ConfigCard
                        key={config.id}
                        icon={config.icon}
                        title={config.title}
                        description={config.description}
                    />
                ))}

            </section>


            {/* CONFIGURACIÓN DEL SISTEMA */}
            <section className="config-system-card">

                <div className="config-system-icon">
                    <Building2 size={25} strokeWidth={2} />
                </div>

                <div className="config-system-content">
                    <span className="config-system-label">
                        CONFIGURACIÓN DEL SISTEMA
                    </span>

                    <h2>Sistema Nacional de Empleo</h2>

                    <p>
                        Administra la información general y las preferencias
                        institucionales del sistema.
                    </p>
                </div>

                <button className="config-system-button">
                    <span>Administrar</span>
                    <ArrowRight size={18} />
                </button>

            </section>

        </main>
    );
}