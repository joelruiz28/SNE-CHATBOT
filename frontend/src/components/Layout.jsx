import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";


function Layout() {
    return (

        <div className="app-layout">

            <Sidebar />


            <main className="dashboard">

                <Header />

                <Outlet />

            </main>

        </div>

    );

}


export default Layout;