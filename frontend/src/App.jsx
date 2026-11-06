import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Personas from "./pages/Personas";
import Vacantes from "./pages/Vacantes";
import Empresas from "./pages/Empresas";
import Postulaciones from "./pages/Postulaciones";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Layout general */}

                <Route element={<Layout />}>

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/personas"
                        element={<Personas />}
                    />

                    <Route
                        path="/vacantes"
                        element={<Vacantes />}
                    />

                    <Route
                        path="/empresas"
                        element={<Empresas />}
                    />

                    
                    <Route
                   path="/postulaciones"
                    element={<Postulaciones />}
                    />


                    <Route
                        path="/reportes"
                        element={<Reportes />}
                    />

                    <Route
                        path="/configuracion"
                        element={<Configuracion />}
                    />

                </Route>

            </Routes>

        </BrowserRouter>

    );
}

export default App;