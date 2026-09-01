import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extrairErro } from '../api/client';

export function LoginPage() {
  const { usuario, carregando, entrar } = useAuth();
  const [usuarioInput, setUsuarioInput] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    try {
      await entrar({ usuario: usuarioInput, senha });
    } catch (err) {
      const apiError = extrairErro(err);
      setErro(apiError.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold text-primary">MeuPonto</p>
          <p className="mt-1 text-sm text-muted">
            Entre com sua conta para continuar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <div className="mb-4">
            <label
              htmlFor="usuario"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Usuário
            </label>
            <input
              id="usuario"
              type="text"
              value={usuarioInput}
              onChange={(e) => setUsuarioInput(e.target.value)}
              required
              autoFocus
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="mb-5">
            <label
              htmlFor="senha"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-primary"
            />
          </div>

          {erro && (
            <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-sm bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
