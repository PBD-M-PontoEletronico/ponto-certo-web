import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmpresasPage } from './pages/EmpresasPage';
import { UsuariosPage } from './pages/UsuariosPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />

              <Route element={<ProtectedRoute perfisPermitidos={['SUPERADMIN']} />}>
                <Route path="/empresas" element={<EmpresasPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute perfisPermitidos={['SUPERADMIN', 'RH_ADMIN']} />
                }
              >
                <Route path="/usuarios" element={<UsuariosPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
