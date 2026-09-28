import { useEffect, useState } from "react";


import StatCard from "../components/StatCard";
import RecentRegistrations from "../components/RecentRegistrations";
import ProfileStatus from "../components/ProfileStatus";

import { obtenerDashboard } from "../services/dashboard.service";

import "../styles/dashboard.css";




function Dashboard() {

    const [dashboard, setDashboard] = useState(null);
    const [cargando, setCargando] = useState(true);


    useEffect(() => {

        async function cargarDashboard() {

            try {

                const datos = await obtenerDashboard();

                console.log(
                    "Datos del dashboard:",
                    datos
                );

                setDashboard(datos);

            } catch (error) {

                console.error(
                    "Error al cargar dashboard:",
                    error
                );

            } finally {

                setCargando(false);

            }

        }

        cargarDashboard();

    }, []);


    return (

        <>

            {cargando ? (

                <div className="dashboard-loading">
                    Cargando información...
                </div>

            ) : (

                <>

                    <section className="stats-grid">

                        <StatCard
                            title="Personas registradas"
                            value={
                                dashboard?.estadisticas
                                    ?.totalPersonas || 0
                            }
                            icon="👥"
                            description="Usuarios registrados en el sistema"
                        />


                        <StatCard
                            title="Vacantes disponibles"
                            value={
                                dashboard?.estadisticas
                                    ?.totalVacantes || 0
                            }
                            icon="💼"
                            description="Ofertas de empleo activas"
                        />


                        <StatCard
                            title="Empresas registradas"
                            value={
                                dashboard?.estadisticas
                                    ?.totalEmpresas || 0
                            }
                            icon="🏢"
                            description="Empresas con ofertas laborales"
                        />


                        <StatCard
                            title="Perfiles completos"
                            value={
                                dashboard?.estadisticas
                                    ?.perfilesCompletos || 0
                            }
                            icon="📄"
                            description="Usuarios con perfil completado"
                        />

                    </section>


                    <RecentRegistrations
                        registros={
                            dashboard?.registrosRecientes || []
                        }
                    />


                    <ProfileStatus
                        estadisticas={
                            dashboard?.estadisticas
                        }
                    />

                </>

            )}

        </>

    );

}


export default Dashboard;