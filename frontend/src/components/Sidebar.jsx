import { NavLink } from "react-router-dom";

import "../styles/sidebar.css";
import logoImg from "../assets/images/logo.jpg";

/* Iconos de línea, dibujados a mano (sin dependencias externas) */
const Icon = ({ name }) => {
  const paths = {
    home: "M3 11.5 12 4l9 7.5M5 10v9h5v-6h4v6h5v-9",
    users:
      "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.6-3.3 3.2-5.5 6.5-5.5s5.9 2.2 6.5 5.5M16.5 8a3 3 0 1 1 0 6M17.5 14.2c2.6.4 4.6 2.2 5 4.8",
    briefcase:
      "M3 9h18v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V9Zm5 0V6.5A1.5 1.5 0 0 1 9.5 5h5A1.5 1.5 0 0 1 16 6.5V9M3 13h18",
    building:
      "M5 21V4.5A1.5 1.5 0 0 1 6.5 3h7A1.5 1.5 0 0 1 15 4.5V21M15 11h4.5A1.5 1.5 0 0 1 21 12.5V21M5 21h16M8 7h1M8 11h1M8 15h1M11.5 7h1M11.5 11h1M11.5 15h1",
    file: "M7 3h7l4 4v13.5A1.5 1.5 0 0 1 16.5 22h-9A1.5 1.5 0 0 1 6 20.5v-16A1.5 1.5 0 0 1 7 3Zm7 0v4.5h4.5M9 12.5h6M9 16h6",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    settings:
      "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5c0 .6-.05 1.1-.14 1.6l2 1.5-2 3.4-2.3-.9c-.8.7-1.8 1.2-2.8 1.5l-.3 2.4h-4.9l-.3-2.4c-1-.3-2-.8-2.8-1.5l-2.3.9-2-3.4 2-1.5A8.6 8.6 0 0 1 4 12c0-.6.05-1.1.14-1.6l-2-1.5 2-3.4 2.3.9c.8-.7 1.8-1.2 2.8-1.5l.3-2.4h4.9l.3 2.4c1 .3 2 .8 2.8 1.5l2.3-.9 2 3.4-2 1.5c.09.5.14 1 .14 1.6Z",
  };

  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const NAV_ITEMS = [
  { to: "/dashboard", label: "INICIO", icon: "home" },
  { to: "/personas", label: "Personas", icon: "users" },
  { to: "/vacantes", label: "Vacantes", icon: "briefcase" },
  { to: "/empresas", label: "Empresas", icon: "building" },
  { to: "/postulaciones", label: "Postulaciones", icon: "file" },
  { to: "/reportes", label: "Reportes", icon: "chart" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      {/* LOGO — imagen real desde assets */}
      <div className="sidebar-logo">
        <img src={logoImg} alt="Logo SNE" className="sidebar-mark" />

        <div className="sidebar-wordmark">
          <h2>SNE</h2>
          <span>Bolsa de Trabajo · Chiapas</span>
        </div>
      </div>

      <div className="sne-topo-rule sidebar-topo" />

      {/* MENÚ */}
      <nav className="sidebar-menu">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `menu-item${isActive ? " active" : ""}`
            }
          >
            <span className="menu-icon">
              <Icon name={item.icon} />
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* CONFIGURACIÓN */}
      <div className="sidebar-footer">
        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `menu-item${isActive ? " active" : ""}`
          }
        >
          <span className="menu-icon">
            <Icon name="settings" />
          </span>
          Configuración
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;