import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Perfil } from '../types';

interface ProtectedRouteProps {
  perfisPermitidos?: Perfil[];
}

// Espelha, no front-end, as mesmas regras de autorização que o
// SecurityConfig.java já garante de verdade no backend. Isto aqui é só
// UX (evita a pessoa "ver" uma tela que não devia) — a segurança real
// sempre é validada de novo no servidor em cada requisição.
export function ProtectedRoute({ perfisPermitidos }: ProtectedRouteProps) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
