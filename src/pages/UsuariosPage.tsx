import { useEffect, useState, type FormEvent } from 'react';
import * as usuariosApi from '../api/usuarios';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PERFIL_LABELS, type Empresa, type Perfil } from '../types';

const PERFIS_CADASTRAVEIS: Perfil[] = [
  'RH_ADMIN',
  'GESTOR',
  'FUNCIONARIO',
  'USUARIO_SETOR',
];

export function UsuariosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('FUNCIONARIO');
  const [empresaId, setEmpresaId] = useState('');

  useEffect(() => {
    // O SUPERADMIN precisa escolher pra qual empresa cadastrar o usuário.
    // O RH_ADMIN não — o backend já resolve isso via TenantContext.
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  async function handleCriar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);

    try {
      await usuariosApi.criarUsuario({
        nome,
        usuario: login,
        senha,
        perfil,
        empresaId: ehSuperAdmin ? empresaId : undefined,
      });

      setSucesso(`Usuário "${nome}" cadastrado com sucesso.`);
      setNome('');
      setLogin('');
      setSenha('');
      setPerfil('FUNCIONARIO');
      setEmpresaId('');
    } catch (err) {
      setErro(extrairErro(err).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Usuários</h1>
        <p className="mt-1 text-sm text-muted">
          {ehSuperAdmin
            ? 'Cadastre usuários para qualquer empresa.'
            : 'Cadastre usuários para a sua empresa.'}
        </p>
      </header>

      <form
        onSubmit={handleCriar}
        className="max-w-lg rounded-lg border border-border bg-surface p-5"
      >
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Usuário (login)
            </label>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Senha provisória
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Perfil
            </label>
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as Perfil)}
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            >
              {PERFIS_CADASTRAVEIS.map((p) => (
                <option key={p} value={p}>
                  {PERFIL_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {ehSuperAdmin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Empresa
              </label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                required
                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razaoSocial}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {erro && (
          <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
            {erro}
          </p>
        )}

        {sucesso && (
          <p className="mb-4 rounded-sm bg-success/10 px-3 py-2 text-sm text-success">
            {sucesso}
          </p>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Cadastrar usuário'}
        </button>
      </form>
    </div>
  );
}
