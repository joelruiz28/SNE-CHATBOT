import "../styles/theme.css";


function RecentRegistrations({ registros }) {

    return (

        <>

            <style>{`

                .recent-registrations {
                    margin-top: 24px;

                    background: var(--sne-surface);
                    border: 1px solid var(--sne-line);
                    border-radius: var(--radius-lg);

                    padding: 26px 28px;

                    box-shadow: 0 4px 16px rgba(31, 75, 59, 0.05);

                    font-family: var(--font-ui);
                }


                .recent-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    margin-bottom: 18px;
                }


                .recent-header h2 {
                    margin: 0;

                    font-family: var(--font-display);
                    font-weight: 600;
                    font-size: 19px;

                    color: var(--sne-forest);
                }


                .recent-header p {
                    margin: 5px 0 0;

                    font-size: 13px;

                    color: var(--sne-gray);
                }


                .recent-table-container {
                    width: 100%;

                    overflow-x: auto;
                }


                .recent-table {
                    width: 100%;

                    border-collapse: collapse;
                }


                .recent-table th {
                    padding: 12px 14px;

                    text-align: left;

                    font-size: 12px;
                    font-weight: 700;

                    letter-spacing: 0.3px;
                    text-transform: uppercase;

                    color: var(--sne-gray);

                    border-bottom: 1px solid var(--sne-line);
                }


                .recent-table td {
                    padding: 15px 14px;

                    font-size: 14px;

                    color: var(--sne-ink);

                    border-bottom: 1px solid var(--sne-line);
                }


                .recent-table tbody tr {
                    transition: background 0.15s ease;
                }


                .recent-table tbody tr:hover {
                    background: var(--sne-cream);
                }


                .profile-status {
                    display: inline-flex;
                    align-items: center;

                    gap: 5px;

                    padding: 5px 11px;

                    border-radius: 999px;

                    font-size: 12px;
                    font-weight: 600;
                }


                .profile-status.complete {
                    background: rgba(47, 107, 84, 0.12);

                    color: var(--sne-hand-green);
                }


                .profile-status.incomplete {
                    background: var(--sne-gold-light);

                    color: #8a6420;
                }


                .recent-empty {
                    padding: 40px 20px;

                    text-align: center;

                    font-size: 14px;

                    color: var(--sne-gray);
                }


                @media (max-width: 700px) {

                    .recent-registrations {
                        padding: 20px;
                    }


                    .recent-table th,
                    .recent-table td {
                        padding: 12px 10px;
                    }

                }

            `}</style>


            <section className="recent-registrations">

                <div className="recent-header">

                    <div>

                        <h2>
                            Registros recientes
                        </h2>

                        <p>
                            Últimas personas registradas en el sistema
                        </p>

                    </div>

                </div>


                {registros.length === 0 ? (

                    <div className="recent-empty">
                        No hay registros recientes.
                    </div>

                ) : (

                    <div className="recent-table-container">

                        <table className="recent-table">

                            <thead>

                                <tr>

                                    <th>Nombre</th>

                                    <th>Municipio</th>

                                    <th>Puesto</th>

                                    <th>Perfil</th>

                                    <th>Folio</th>

                                </tr>

                            </thead>


                            <tbody>

                                {registros.map((persona) => (

                                    <tr key={persona.id}>

                                        <td>
                                            {persona.nombre_completo || "Sin nombre"}
                                        </td>

                                        <td>
                                            {persona.municipio || "Sin municipio"}
                                        </td>

                                        <td>
                                            {persona.puesto_solicitado || "Sin puesto"}
                                        </td>

                                        <td>

                                            {persona.perfil_completo ? (

                                                <span className="profile-status complete">
                                                    ✓ Completo
                                                </span>

                                            ) : (

                                                <span className="profile-status incomplete">
                                                    ⚠ Pendiente
                                                </span>

                                            )}

                                        </td>

                                        <td>
                                            {persona.folio || "Sin folio"}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </>

    );

}


export default RecentRegistrations;