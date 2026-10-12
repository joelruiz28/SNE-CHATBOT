import { useEffect, useState } from "react";

import {
    buscarFolio,
    obtenerResumenFolios
} from "../services/folios.service";

import "../styles/folios.css";



const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round"
};

function IconDocument() {
    return (
        <svg {...iconProps}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M9 13h6M9 17h6" />
        </svg>
    );
}

function IconCheck() {
    return (
        <svg {...iconProps}>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

function IconAlert() {
    return (
        <svg {...iconProps}>
            <path d="M12 9v4" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 17h.01" />
        </svg>
    );
}

function IconSearch() {
    return (
        <svg {...iconProps}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

function IconUser() {
    return (
        <svg {...iconProps}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
    );
}

function IconPin() {
    return (
        <svg {...iconProps}>
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function IconBriefcase() {
    return (
        <svg {...iconProps}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    );
}

function IconCap() {
    return (
        <svg {...iconProps}>
            <path d="m22 10-10-5L2 10l10 5 10-5Z" />
            <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
        </svg>
    );
}

function IconPhone() {
    return (
        <svg {...iconProps}>
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.5c1 .3 2 .5 3 .7a2 2 0 0 1 1.7 2Z" />
        </svg>
    );
}

function IconMail() {
    return (
        <svg {...iconProps}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 6-10 7L2 6" />
        </svg>
    );
}

function IconBook() {
    return (
        <svg {...iconProps}>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
    );
}

function IconHome() {
    return (
        <svg {...iconProps}>
            <path d="m3 11 9-8 9 8" />
            <path d="M5 10v10h14V10" />
        </svg>
    );
}

function IconCurrency() {
    return (
        <svg {...iconProps}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v10M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2 3 2.5 3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5" />
        </svg>
    );
}

function IconClock() {
    return (
        <svg {...iconProps}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
        </svg>
    );
}

function IconX() {
    return (
        <svg {...iconProps}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}


function Folios() {

    // =====================================
    // ESTADOS
    // =====================================

    const [resumen, setResumen] = useState(null);

    const [cargandoResumen, setCargandoResumen] =
        useState(true);

    const [folio, setFolio] = useState("");

    const [resultado, setResultado] =
        useState(null);

    const [cargando, setCargando] =
        useState(false);

    const [error, setError] =
        useState(null);


    // =====================================
    // CARGAR RESUMEN
    // =====================================

    useEffect(() => {

        async function cargarResumen() {

            try {

                const datos = await obtenerResumenFolios();

                setResumen(datos);

            } catch (error) {

                console.error(
                    "❌ Error al cargar resumen:",
                    error
                );

            } finally {

                setCargandoResumen(false);

            }

        }

        cargarResumen();

    }, []);


    // =====================================
    // BUSCAR FOLIO
    // =====================================

    async function consultarFolio() {

        const folioBuscado =
            folio.trim().toUpperCase();


        // -------------------------------------
        // VALIDAR CAMPO VACÍO
        // -------------------------------------

        if (!folioBuscado) {

            setError(
                "Escribe un folio para realizar la búsqueda."
            );

            setResultado(null);

            return;

        }


        try {

            setCargando(true);

            setError(null);

            setResultado(null);


            const datos =
                await buscarFolio(
                    folioBuscado
                );


            // =====================================
            // OBTENER EL OBJETO REAL DEL FOLIO
            // =====================================

            /*
                El backend puede devolver:

                {
                    folio: {
                        id: 10,
                        folio: "SNE-2026-000010",
                        ...
                    }
                }

                o directamente:

                {
                    id: 10,
                    folio: "SNE-2026-000010",
                    ...
                }
            */


            const datosFolio =
                datos?.folio &&
                typeof datos.folio === "object"

                    ? datos.folio

                    : datos;


            // =====================================
            // VALIDAR QUE REALMENTE EXISTA
            // =====================================

            if (
                !datosFolio ||
                typeof datosFolio !== "object" ||
                !datosFolio.folio
            ) {

                throw new Error(
                    "No se encontró el folio solicitado."
                );

            }


            // =====================================
            // GUARDAR RESULTADO
            // =====================================

            setResultado(
                datosFolio
            );


        } catch (error) {

            console.error(
                "❌ Error al consultar folio:",
                error
            );


            setResultado(null);


            setError(
                error.message ||
                "No se encontró el folio."
            );


        } finally {

            setCargando(false);

        }

    }


    // =====================================
    // ENTER EN EL BUSCADOR
    // =====================================

    function manejarTecla(event) {

        if (event.key === "Enter") {

            consultarFolio();

        }

    }


    // =====================================
    // LIMPIAR RESULTADO
    // =====================================

    function limpiarBusqueda() {

        setFolio("");

        setResultado(null);

        setError(null);

    }


    // =====================================
    // RENDER
    // =====================================

    return (

        <section className="folios-page">


            {/* =====================================
                ESTADÍSTICAS
            ===================================== */}

            <section className="folios-stats">


                {/* TOTAL */}

                <div className="folio-stat-card">

                    <div className="folio-stat-icon">
                        <IconDocument />
                    </div>

                    <div>

                        <span>
                            Total de folios
                        </span>

                        <strong>

                            {cargandoResumen
                                ? "—"
                                : resumen?.estadisticas?.total || 0
                            }

                        </strong>

                    </div>

                </div>


                {/* COMPLETOS */}

                <div className="folio-stat-card">

                    <div className="folio-stat-icon complete">
                        <IconCheck />
                    </div>

                    <div>

                        <span>
                            Perfiles completos
                        </span>

                        <strong>

                            {cargandoResumen
                                ? "—"
                                : resumen?.estadisticas?.completos || 0
                            }

                        </strong>

                    </div>

                </div>


                {/* PENDIENTES */}

                <div className="folio-stat-card">

                    <div className="folio-stat-icon pending">
                        <IconAlert />
                    </div>

                    <div>

                        <span>
                            Perfiles pendientes
                        </span>

                        <strong>

                            {cargandoResumen
                                ? "—"
                                : resumen?.estadisticas?.pendientes || 0
                            }

                        </strong>

                    </div>

                </div>


            </section>


            {/* =====================================
                BUSCADOR
            ===================================== */}

            <section className="folios-search-card">


                <div className="folios-search-header">

                    <div>

                        <span className="folios-search-icon">
                            <IconSearch />
                        </span>

                        <div>

                            <h2>
                                Consultar folio
                            </h2>

                            <p>
                                Busca un folio generado por
                                el Sistema Nacional de Empleo.
                            </p>

                        </div>

                    </div>

                </div>


                <div className="folios-search">

                    <div className="folios-search-input-wrap">

                        <IconSearch />

                        <input
                            type="text"

                            placeholder="Ej. SNE-2026-000014"

                            value={folio}

                            onChange={(event) =>
                                setFolio(
                                    event.target.value
                                )
                            }

                            onKeyDown={manejarTecla}
                        />

                    </div>


                    <button
                        onClick={consultarFolio}

                        disabled={cargando}
                    >

                        {cargando
                            ? "Consultando..."
                            : "Buscar"
                        }

                    </button>


                    {resultado && (

                        <button
                            type="button"

                            className="btn-limpiar-folio"

                            onClick={limpiarBusqueda}
                        >
                            <IconX />
                            Limpiar
                        </button>

                    )}

                </div>

            </section>


            {/* =====================================
                ERROR
            ===================================== */}

            {error && (

                <div className="folio-error">

                    <span>
                        <IconAlert />
                    </span>

                    <div>

                        <strong>
                            Folio no encontrado
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            )}


            {/* =====================================
                RESULTADO DEL FOLIO
            ===================================== */}

            {resultado && (

                <section className="folio-result-card">


                    {/* ---------------------------------
                        ENCABEZADO
                    --------------------------------- */}

                    <div className="folio-result-header">


                        <div>

                            <span className="folio-found-label">
                                <IconCheck />
                                Folio encontrado
                            </span>

                            <h2>
                                {resultado.folio}
                            </h2>

                        </div>


                        <div
                            className={
                                resultado.perfil_completo
                                    ? "folio-status complete"
                                    : "folio-status pending"
                            }
                        >

                            {resultado.perfil_completo
                                ? "Perfil completo"
                                : "Perfil pendiente"
                            }

                        </div>

                    </div>


                    {/* ---------------------------------
                        PERSONA
                    --------------------------------- */}

                    <div className="folio-persona">


                        <div className="folio-avatar">
                            <IconUser />
                        </div>


                        <div>

                            <h3>
                                {resultado.nombre_completo ||
                                    "Sin nombre"}
                            </h3>

                            <p>
                                Información del buscador
                                de empleo
                            </p>

                        </div>

                    </div>


                    {/* ---------------------------------
                        INFORMACIÓN
                    --------------------------------- */}

                    <div className="folio-data-grid">


                        {/* MUNICIPIO */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconPin />
                            </div>

                            <div>

                                <span>
                                    Municipio
                                </span>

                                <strong>
                                    {resultado.municipio ||
                                        "No especificado"}
                                </strong>

                            </div>

                        </div>


                        {/* PUESTO */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconBriefcase />
                            </div>

                            <div>

                                <span>
                                    Puesto solicitado
                                </span>

                                <strong>
                                    {resultado.puesto_solicitado ||
                                        "No especificado"}
                                </strong>

                            </div>

                        </div>


                        {/* ESTUDIOS */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconCap />
                            </div>

                            <div>

                                <span>
                                    Nivel de estudios
                                </span>

                                <strong>
                                    {resultado.nivel_estudios ||
                                        "No especificado"}
                                </strong>

                            </div>

                        </div>


                        {/* TELÉFONO */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconPhone />
                            </div>

                            <div>

                                <span>
                                    Teléfono
                                </span>

                                <strong>
                                    {resultado.telefono ||
                                        "No especificado"}
                                </strong>

                            </div>

                        </div>


                        {/* CORREO */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconMail />
                            </div>

                            <div>

                                <span>
                                    Correo
                                </span>

                                <strong>
                                    {resultado.correo ||
                                        "No especificado"}
                                </strong>

                            </div>

                        </div>


                        {/* CARRERA */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconBook />
                            </div>

                            <div>

                                <span>
                                    Carrera
                                </span>

                                <strong>
                                    {resultado.carrera ||
                                        "No especificada"}
                                </strong>

                            </div>

                        </div>


                        {/* EXPERIENCIA */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconBriefcase />
                            </div>

                            <div>

                                <span>
                                    Experiencia
                                </span>

                                <strong>
                                    {resultado.experiencia ||
                                        "No especificada"}
                                </strong>

                            </div>

                        </div>


                        {/* COLONIA */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconHome />
                            </div>

                            <div>

                                <span>
                                    Colonia
                                </span>

                                <strong>
                                    {resultado.colonia ||
                                        "No especificada"}
                                </strong>

                            </div>

                        </div>


                        {/* SUELDO */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconCurrency />
                            </div>

                            <div>

                                <span>
                                    Sueldo deseado
                                </span>

                                <strong>
                                    {resultado.sueldo_deseado
                                        ? `$${Number(
                                            resultado.sueldo_deseado
                                        ).toLocaleString("es-MX")} MXN`
                                        : "No especificado"
                                    }
                                </strong>

                            </div>

                        </div>


                        {/* HORARIO */}

                        <div className="folio-data">

                            <div className="folio-data-icon">
                                <IconClock />
                            </div>

                            <div>

                                <span>
                                    Horario
                                </span>

                                <strong>
                                    {resultado.horario ||
                                        "No especificado"}
                                </strong>

                            </div>

                        </div>


                    </div>


                </section>

            )}


            {/* =====================================
                FOLIOS RECIENTES
            ===================================== */}

            <section className="folios-recientes">


                <div className="folios-recientes-header">

                    <div>

                        <h2>
                            Folios recientes
                        </h2>

                        <p>
                            Últimos folios generados
                            en el sistema
                        </p>

                    </div>

                </div>


                <div className="folios-table-container">

                    <table className="folios-table">


                        <thead>

                            <tr>

                                <th>
                                    Folio
                                </th>

                                <th>
                                    Persona
                                </th>

                                <th>
                                    Municipio
                                </th>

                                <th>
                                    Puesto
                                </th>

                                <th>
                                    Estado
                                </th>

                                <th>
                                    Registro
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {Array.isArray(resumen?.folios) &&
                                resumen.folios.map((item) => (

                                    <tr key={item.id}>

                                        {/* FOLIO */}
                                        <td className="folio-number">

                                            {item.folio || "Sin folio"}

                                        </td>


                                        {/* PERSONA */}
                                        <td>

                                            <strong>
                                                {item.nombre_completo ||
                                                    "Sin nombre"}
                                            </strong>

                                        </td>


                                        {/* MUNICIPIO */}
                                        <td>

                                            {item.municipio ||
                                                "No especificado"}

                                        </td>


                                        {/* PUESTO */}
                                        <td>

                                            {item.puesto_solicitado ||
                                                "No especificado"}

                                        </td>


                                        {/* ESTADO */}
                                        <td>

                                            <span
                                                className={
                                                    item.perfil_completo
                                                        ? "folio-badge complete"
                                                        : "folio-badge pending"
                                                }
                                            >

                                                {item.perfil_completo
                                                    ? "Completo"
                                                    : "Pendiente"
                                                }

                                            </span>

                                        </td>


                                        {/* FECHA */}
                                        <td>

                                            {item.fecha_registro
                                                ? new Date(
                                                    item.fecha_registro
                                                ).toLocaleDateString(
                                                    "es-MX"
                                                )
                                                : "Sin fecha"
                                            }

                                        </td>

                                    </tr>

                                ))
                            }


                            {/* SIN RESULTADOS */}

                            {(!Array.isArray(resumen?.folios) ||
                                resumen.folios.length === 0) && (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="sin-folios"
                                    >

                                        No hay folios registrados.

                                    </td>

                                </tr>

                            )}
                        </tbody>

                    </table>

                </div>

            </section>


        </section>

    );

}


export default Folios;