import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmpresasPage } from './pages/EmpresasPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { SetoresPage } from './pages/SetoresPage';
import { AlocacoesPage } from './pages/AlocacoesPage';

export function App() {
  return (
    <ThemeProvider>
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

                <Route
                    element={
                      <ProtectedRoute perfisPermitidos={['SUPERADMIN', 'RH_ADMIN']} />
                    }
                >
                  <Route path="/setores" element={<SetoresPage />} />
                </Route>

                <Route
                    element={
                      <ProtectedRoute perfisPermitidos={['SUPERADMIN', 'RH_ADMIN']} />
                    }
                >
                  <Route path="/alocacoes" element={<AlocacoesPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}