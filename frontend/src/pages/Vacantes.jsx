import { useEffect, useState } from "react";

import {
    obtenerVacantes,
    obtenerVacantePorId,
    actualizarEstadoVacante
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

const [errorDetalle, setErrorDetalle] =
    useState(null);


    useEffect(() => {

        async function cargarVacantes() {

            try {

                const datos =
                    await obtenerVacantes();

                console.log(
                    "Vacantes:",
                    datos
                );

                setVacantes(
                    datos.vacantes || []
                );

            } catch (error) {

                console.error(
                    "Error al cargar vacantes:",
                    error
                );

                setError(
                    "No se pudieron cargar las vacantes."
                );

            } finally {

                setCargando(false);

            }

        }

        cargarVacantes();

    }, []);


    // ==========================================
    // FILTRAR VACANTES POR BÚSQUEDA
    // ==========================================

    const vacantesFiltradas =
        vacantes.filter((vacante) => {

            const texto =
                busqueda.toLowerCase();

            return (

                vacante.puesto
                    ?.toLowerCase()
                    .includes(texto)

                ||

                vacante.empresa
                    ?.toLowerCase()
                    .includes(texto)

                ||

                vacante.municipio
                    ?.toLowerCase()
                    .includes(texto)

            );

        });


    // ==========================================
    // FORMATEAR SALARIO
    // ==========================================

    function formatearSalario(salario) {

        if (!salario) {

            return "No especificado";

        }

        return `$${Number(
            salario
        ).toLocaleString("es-MX")} MXN`;

    }


    // ==========================================
    // FORMATEAR FECHA
    // ==========================================

    function formatearFecha(fecha) {

        if (!fecha) {

            return "Sin fecha";

        }

        return new Date(
            fecha
        ).toLocaleDateString("es-MX", {

            day: "2-digit",

            month: "2-digit",

            year: "numeric"

        });

    }

    async function verVacante(id) {

    try {

        setCargandoDetalle(true);

        setErrorDetalle(null);

        const vacante =
            await obtenerVacantePorId(id);

        setVacanteSeleccionada(vacante);

    } catch (error) {

        console.error(
            "Error al cargar detalle:",
            error
        );

        setErrorDetalle(
            "No se pudo cargar la información de la vacante."
        );

    } finally {

        setCargandoDetalle(false);

    }

}

async function desactivarVacante(vacante) {

    try {

        const confirmar = window.confirm(
            `¿Deseas desactivar la vacante "${vacante.puesto}"?`
        );


        if (!confirmar) {

            return;

        }


        const resultado =
            await actualizarEstadoVacante(
                vacante.id,
                "Inactiva"
            );


        setVacantes((vacantesActuales) =>

            vacantesActuales.map(
                (item) =>

                    item.id === vacante.id
                        ? resultado.vacante
                        : item
            )

        );


        // Si el modal está abierto,
        // también actualizamos la información

        if (
            vacanteSeleccionada?.id ===
            vacante.id
        ) {

            setVacanteSeleccionada(
                resultado.vacante
            );

        }

    } catch (error) {

        console.error(
            "Error al desactivar vacante:",
            error
        );

        alert(
            "No se pudo desactivar la vacante."
        );

    }

}

async function activarVacante(vacante) {

    try {

        const resultado =
            await actualizarEstadoVacante(
                vacante.id,
                "Activa"
            );


        setVacantes((vacantesActuales) =>

            vacantesActuales.map(
                (item) =>

                    item.id === vacante.id
                        ? resultado.vacante
                        : item
            )

        );

    } catch (error) {

        console.error(
            "Error al activar vacante:",
            error
        );

        alert(
            "No se pudo activar la vacante."
        );

    }

}


    return (

        <>

            {/* ==================================
                RESUMEN
            ================================== */}

            <section className="vacantes-summary">

                <div className="vacantes-total">

                    <span>
                        Total de vacantes
                    </span>

                    <strong>
                        {vacantes.length}
                    </strong>

                </div>

            </section>


            {/* ==================================
                BUSCADOR
            ================================== */}

            <section className="vacantes-tools">

                <div className="vacantes-search">

                    <span>
                        🔎
                    </span>

                    <input
                        type="text"

                        placeholder="
                        Buscar por puesto, empresa o municipio...
                        "

                        value={busqueda}

                        onChange={(event) =>
                            setBusqueda(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="vacantes-results">

                    Mostrando{" "}

                    <strong>
                        {vacantesFiltradas.length}
                    </strong>

                    {" "}vacantes

                </div>

            </section>


            {/* ==================================
                CARGANDO
            ================================== */}

            {cargando && (

                <div className="vacantes-loading">

                    Cargando vacantes...

                </div>

            )}


            {/* ==================================
                ERROR
            ================================== */}

            {error && (

                <div className="vacantes-error">

                    {error}

                </div>

            )}


            {/* ==================================
                TABLA
            ================================== */}

            {!cargando && !error && (

                <section className="vacantes-table-container">

                    <table className="vacantes-table">

                        <thead>

                            <tr>

                                <th>
                                    Folio
                                </th>

                                <th>
                                    Puesto
                                </th>

                                <th>
                                    Empresa
                                </th>

                                <th>
                                    Municipio
                                </th>

                                <th>
                                    Salario
                                </th>

                                <th>
                                    Experiencia
                                </th>
                                <th>
                                    Estado
                                </th>

                                <th>
                                    Publicación
                                </th>

                                <th>
                                    Acciones
                                </th>

                            </tr>

                        </thead>


                        <tbody>

    {vacantesFiltradas.map(
        (vacante) => (

            <tr key={vacante.id}>

                {/* FOLIO */}

                <td className="vacante-folio">

                    {vacante.folio_oferta ||
                        "Sin folio"}

                </td>


                {/* PUESTO */}

                <td>

                    <strong>

                        {vacante.puesto ||
                            "Sin especificar"}

                    </strong>

                </td>


                {/* EMPRESA */}

                <td>

                    {vacante.empresa ||
                        "Sin empresa"}

                </td>


                {/* MUNICIPIO */}

                <td>

                    {vacante.municipio ||
                        "Sin municipio"}

                </td>


                {/* SALARIO */}

                <td className="vacante-salario">

                    {formatearSalario(
                        vacante.salario
                    )}

                </td>


                {/* EXPERIENCIA */}

                <td>

                    {vacante.experiencia ||
                        "No especificada"}

                </td>


                {/* ESTADO */}

                <td>

                    <span
                        className={`estado-vacante ${
                            (vacante.estado || "Activa")
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                        }`}
                    >

                        {vacante.estado || "Activa"}

                    </span>

                </td>


                {/* PUBLICACIÓN */}

                <td>

                    {formatearFecha(
                        vacante.fecha_publicacion
                    )}

                </td>


                {/* ACCIONES */}

                <td>

    <div className="vacante-actions">

        <button
            className="btn-ver-vacante"

            onClick={() =>
                verVacante(vacante.id)
            }
        >
            👁 Ver
        </button>


        <button
            className="btn-editar-vacante"
        >
            ✏️ Editar
        </button>


        {vacante.estado === "Activa" ? (

            <button
                className="btn-desactivar-vacante"

                onClick={() =>
                    desactivarVacante(vacante)
                }
            >
                ⏸ Desactivar
            </button>

        ) : (

            <button
                className="btn-reactivar-vacante"

                onClick={() =>
                    actualizarEstadoVacante(
                        vacante.id,
                        "Activa"
                    )
                }
            >
                ▶ Activar
            </button>

        )}

    </div>

</td>
            </tr>

        )
    )}


    {vacantesFiltradas.length === 0 && (

        <tr>

            <td
                colSpan="9"
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

            {(vacanteSeleccionada || cargandoDetalle || errorDetalle) && (

    <div
        className="modal-overlay"

        onClick={() => {

            setVacanteSeleccionada(null);

            setErrorDetalle(null);

        }}
    >

        <div
            className="vacante-modal"

            onClick={(event) =>
                event.stopPropagation()
            }
        >

            <button
                className="modal-close"

                onClick={() => {

                    setVacanteSeleccionada(null);

                    setErrorDetalle(null);

                }}
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


                             <span
                             className={`estado-vacante ${vacanteSeleccionada.estado
                             ?.toLowerCase()
                            .replace(" ", "-")}`}
                                    >

                                 {vacanteSeleccionada.estado || "Activa"}

                            </span>

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

                            <span>📄 Folio empresa</span>

                            <strong>
                                {vacanteSeleccionada.folio_empresa ||
                                    "No especificado"}
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