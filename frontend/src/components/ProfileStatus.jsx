import "../styles/theme.css";

function ProfileStatus({ estadisticas }) {

    const totalPersonas = estadisticas?.totalPersonas || 0;

    const perfilesCompletos =
        estadisticas?.perfilesCompletos || 0;

    const perfilesIncompletos =
        estadisticas?.perfilesIncompletos || 0;


    const porcentajeCompletos =
        totalPersonas > 0
            ? Math.round(
                (perfilesCompletos / totalPersonas) * 100
            )
            : 0;


    return (

        <>
            <style>{`

                .profile-status-card {
                    margin-top: 24px;

                    padding: 26px 28px;

                    background: var(--sne-surface);
                    border: 1px solid var(--sne-line);
                    border-radius: var(--radius-lg);

                    box-shadow: 0 4px 16px rgba(31, 75, 59, 0.05);

                    font-family: var(--font-ui);
                }


                .profile-status-header {
                    margin-bottom: 20px;
                }


                .profile-status-header h2 {
                    margin: 0;

                    font-family: var(--font-display);
                    font-weight: 600;
                    font-size: 19px;

                    color: var(--sne-forest);
                }


                .profile-status-header p {
                    margin: 5px 0 0;

                    font-size: 13px;

                    color: var(--sne-gray);
                }


                .profile-status-total {
                    display: flex;
                    align-items: baseline;

                    gap: 8px;

                    margin-bottom: 12px;
                }


                .profile-total-number {
                    font-family: var(--font-display);

                    font-size: 28px;
                    font-weight: 600;

                    color: var(--sne-forest);
                }


                .profile-total-text {
                    font-size: 14px;

                    color: var(--sne-gray);
                }


                .profile-progress {
                    width: 100%;
                    height: 10px;

                    overflow: hidden;

                    background: var(--sne-gold-light);

                    border-radius: 999px;
                }


                .profile-progress-fill {
                    height: 100%;

                    border-radius: 999px;

                    background: linear-gradient(
                        90deg,
                        var(--sne-hand-green),
                        var(--sne-gold)
                    );

                    transition: width 0.5s ease;
                }


                .profile-status-details {
                    display: flex;

                    align-items: center;
                    justify-content: space-between;

                    gap: 20px;

                    margin-top: 22px;
                    padding-top: 20px;

                    border-top: 1px solid var(--sne-line);
                }


                .profile-detail {
                    display: flex;

                    align-items: center;

                    gap: 10px;
                }


                .profile-detail-icon {
                    width: 34px;
                    height: 34px;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    border-radius: 50%;

                    font-weight: 700;
                }


                .profile-detail-icon.complete {
                    background: rgba(47, 107, 84, 0.12);

                    color: var(--sne-hand-green);
                }


                .profile-detail-icon.incomplete {
                    background: var(--sne-gold-light);

                    color: #f39a00;
                }


                .profile-detail div {
                    display: flex;

                    flex-direction: column;

                    gap: 2px;
                }


                .profile-detail strong {
                    font-size: 16px;

                    color: var(--sne-ink);
                }


                .profile-detail span {
                    font-size: 12px;

                    color: var(--sne-gray);
                }


                .profile-percentage {
                    display: flex;

                    flex-direction: column;

                    align-items: flex-end;

                    gap: 2px;
                }


                .profile-percentage strong {
                    font-family: var(--font-display);

                    font-size: 19px;

                    color: var(--sne-forest);
                }


                .profile-percentage span {
                    font-size: 12px;

                    color: var(--sne-gray);
                }


                @media (max-width: 700px) {

                    .profile-status-details {
                        flex-direction: column;

                        align-items: flex-start;
                    }


                    .profile-percentage {
                        align-items: flex-start;
                    }

                }

            `}</style>


            <section className="profile-status-card">

                <div className="profile-status-header">

                    <div>

                        <h2>
                            Estado de perfiles
                        </h2>

                        <p>
                            Seguimiento del estado de los usuarios registrados
                        </p>

                    </div>

                </div>


                <div className="profile-status-total">

                    <span className="profile-total-number">
                        {totalPersonas}
                    </span>

                    <span className="profile-total-text">
                        personas registradas
                    </span>

                </div>


                <div className="profile-progress">

                    <div
                        className="profile-progress-fill"
                        style={{
                            width: `${porcentajeCompletos}%`
                        }}
                    />

                </div>


                <div className="profile-status-details">


                    <div className="profile-detail">

                        <span className="profile-detail-icon complete">
                            ✓
                        </span>

                        <div>

                            <strong>
                                {perfilesCompletos}
                            </strong>

                            <span>
                                Perfiles completos
                            </span>

                        </div>

                    </div>


                    <div className="profile-detail">

                        <span className="profile-detail-icon incomplete">
                            !
                        </span>

                        <div>

                            <strong>
                                {perfilesIncompletos}
                            </strong>

                            <span>
                                Perfiles pendientes
                            </span>

                        </div>

                    </div>


                    <div className="profile-percentage">

                        <strong>
                            {porcentajeCompletos}%
                        </strong>

                        <span>
                            completados
                        </span>

                    </div>


                </div>

            </section>

        </>

    );

}


export default ProfileStatus;