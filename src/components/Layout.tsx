import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERFIL_LABELS } from '../types';

const linkBase =
  'block rounded-sm px-3 py-2 text-sm font-medium transition-colors';
const linkAtivo = 'bg-primary text-white';
const linkInativo = 'text-ink/70 hover:bg-primary/5 hover:text-ink';

export function Layout() {
  const { usuario, sair } = useAuth();

  if (!usuario) return null;

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-60 flex-col border-r border-border bg-surface px-4 py-6">
        <div className="mb-8 px-2">
          <p className="text-lg font-semibold text-primary">MeuPonto</p>
          <p className="mt-0.5 text-xs text-muted">
            {PERFIL_LABELS[usuario.perfil]}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkAtivo : linkInativo}`
            }
          >
            Início
          </NavLink>

          {usuario.perfil === 'SUPERADMIN' && (
            <NavLink
              to="/empresas"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkAtivo : linkInativo}`
              }
            >
              Empresas
            </NavLink>
          )}

          {(usuario.perfil === 'SUPERADMIN' ||
            usuario.perfil === 'RH_ADMIN') && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkAtivo : linkInativo}`
              }
            >
              Usuários
            </NavLink>
          )}
        </nav>

        <div className="border-t border-border pt-4">
          <p className="px-2 text-sm font-medium text-ink">{usuario.nome}</p>
          <button
            onClick={sair}
            className="mt-2 w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
}
