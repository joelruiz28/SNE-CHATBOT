function StatCard({
    title,
    value,
    icon,
    description
}) {

    return (

        <>

            <style>{`

                .stat-card {
                    background: var(--sne-surface);
                    border: 1px solid var(--sne-line);
                    border-radius: var(--radius-lg);

                    padding: 22px;

                    box-shadow: 0 4px 16px rgba(31, 75, 59, 0.05);

                    font-family: var(--font-ui);

                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                }


                .stat-card:hover {
                    transform: translateY(-2px);

                    box-shadow:
                        0 8px 20px rgba(31, 75, 59, 0.08);
                }


                .stat-card-top {
                    display: flex;

                    justify-content: space-between;

                    align-items: flex-start;
                }


                .stat-title {
                    margin: 0;

                    font-size: 14px;

                    color: #64746f;
                }


                .stat-value {
                    margin: 10px 0 0;

                    font-size: 28px;

                    font-weight: 700;

                    color: #315f57;
                }


                .stat-icon {
                    width: 46px;
                    height: 46px;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    background: #e5f0ed;

                    color: #3f786d;

                    border-radius: 12px;

                    font-size: 22px;
                }


                .stat-description {
                    margin: 18px 0 0;

                    font-size: 13px;

                    color: #89938f;
                }

            `}</style>


            <div className="stat-card">

                <div className="stat-card-top">

                    <div>

                        <p className="stat-title">
                            {title}
                        </p>

                        <h2 className="stat-value">
                            {value}
                        </h2>

                    </div>


                    <div className="stat-icon">
                        {icon}
                    </div>

                </div>


                <p className="stat-description">
                    {description}
                </p>

            </div>

        </>

    );

}


export default StatCard;