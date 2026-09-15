import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold text-ink">Página não encontrada</h1>
      <p className="mt-1 text-sm text-muted">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
