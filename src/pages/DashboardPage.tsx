import { useAuth } from '../context/AuthContext';
import { PERFIL_LABELS } from '../types';

export function DashboardPage() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">
          Olá, {usuario.nome.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Você está conectado como {PERFIL_LABELS[usuario.perfil]}.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="text-sm text-muted">
          As telas de setores, escalas e relatórios chegam nas próximas
          etapas do projeto (WEB 02 em diante).
        </p>
      </div>
    </div>
  );
}
