import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as usuariosApi from '../api/usuarios';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PERFIL_LABELS, type Empresa, type Pagina, type Perfil, type Usuario, type UsuarioFiltro } from '../types';

const PERFIS_FILTRAVEIS: Perfil[] = [
  'SUPERADMIN',
  'RH_ADMIN',
  'GESTOR',
  'FUNCIONARIO',
  'USUARIO_SETOR',
];

export function UsuariosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const navigate = useNavigate();
  const location = useLocation();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const [filtros, setFiltros] = useState<UsuarioFiltro>({});
  const [filtrosAplicados, setFiltrosAplicados] = useState<UsuarioFiltro>({});
  const [pagina, setPagina] = useState(0);

  const [resultado, setResultado] = useState<Pagina<Usuario> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Mensagem de sucesso vinda da página de cadastro (após "cadastrar e sair")
  const [sucesso, setSucesso] = useState<string | null>(
    (location.state as { sucesso?: string } | null)?.sucesso ?? null
  );

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  // Debounce: só aplica o filtro (e volta pra primeira página) 350ms depois
  // da última mudança, pra não disparar uma busca a cada tecla digitada.
  useEffect(() => {
    const handle = setTimeout(() => {
      setFiltrosAplicados(filtros);
      setPagina(0);
    }, 350);
    return () => clearTimeout(handle);
  }, [filtros]);

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    usuariosApi
      .buscarUsuarios(filtrosAplicados, pagina)
      .then(setResultado)
      .catch((err) => setErro(extrairErro(err).message))
      .finally(() => setCarregando(false));
  }, [filtrosAplicados, pagina]);

  // Limpa o state da navegação para a mensagem não reaparecer num refresh
  useEffect(() => {
    if (sucesso) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function atualizarFiltro<K extends keyof UsuarioFiltro>(campo: K, valor: UsuarioFiltro[K]) {
    setSucesso(null);
    setFiltros((atual) => ({ ...atual, [campo]: valor || undefined }));
  }

  function nomeDaEmpresa(empresaId: string | null): string {
    if (!empresaId) return '—';
    return empresas.find((e) => e.id === empresaId)?.razaoSocial ?? '—';
  }

  const usuarios = resultado?.conteudo ?? [];
  const inputClasse =
    'w-full rounded-sm border border-border bg-canvas px-2 py-1 text-xs text-ink outline-none focus:border-primary';

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Usuários</h1>
          <p className="mt-1 text-sm text-muted">
            {ehSuperAdmin
              ? 'Busque e filtre os usuários de qualquer empresa.'
              : 'Busque e filtre os usuários da sua empresa.'}
          </p>
        </div>

        <Link
          to="/usuarios/novo"
          className="shrink-0 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Cadastrar usuário
        </Link>
      </header>

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

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Usuário</th>
              <th className="px-5 py-3 font-medium">Perfil</th>
              {ehSuperAdmin && <th className="px-5 py-3 font-medium">Empresa</th>}
              <th className="px-5 py-3 font-medium">Matrícula</th>
              <th className="px-5 py-3 font-medium">Cargo</th>
            </tr>
            <tr className="border-b border-border bg-canvas/50">
              <th className="px-5 py-2">
                <input
                  value={filtros.nome ?? ''}
                  onChange={(e) => atualizarFiltro('nome', e.target.value)}
                  placeholder="Filtrar..."
                  className={inputClasse}
                />
              </th>
              <th className="px-5 py-2">
                <input
                  value={filtros.usuario ?? ''}
                  onChange={(e) => atualizarFiltro('usuario', e.target.value)}
                  placeholder="Filtrar..."
                  className={inputClasse}
                />
              </th>
              <th className="px-5 py-2">
                <select
                  value={filtros.perfil ?? ''}
                  onChange={(e) => atualizarFiltro('perfil', (e.target.value || undefined) as Perfil | undefined)}
                  className={inputClasse}
                >
                  <option value="">Todos</option>
                  {PERFIS_FILTRAVEIS.map((p) => (
                    <option key={p} value={p}>{PERFIL_LABELS[p]}</option>
                  ))}
                </select>
              </th>
              {ehSuperAdmin && (
                <th className="px-5 py-2">
                  <select
                    value={filtros.empresaId ?? ''}
                    onChange={(e) => atualizarFiltro('empresaId', e.target.value)}
                    className={inputClasse}
                  >
                    <option value="">Todas</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.razaoSocial}</option>
                    ))}
                  </select>
                </th>
              )}
              <th className="px-5 py-2">
                <input
                  value={filtros.matricula ?? ''}
                  onChange={(e) => atualizarFiltro('matricula', e.target.value)}
                  placeholder="Filtrar..."
                  className={inputClasse}
                />
              </th>
              <th className="px-5 py-2">
                <input
                  value={filtros.cargo ?? ''}
                  onChange={(e) => atualizarFiltro('cargo', e.target.value)}
                  placeholder="Filtrar..."
                  className={inputClasse}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={ehSuperAdmin ? 6 : 5} className="px-5 py-8 text-center text-sm text-muted">
                  Carregando...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={ehSuperAdmin ? 6 : 5} className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum usuário encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-ink">{u.nome}</td>
                  <td className="px-5 py-3 text-muted">{u.usuario}</td>
                  <td className="px-5 py-3 text-muted">{PERFIL_LABELS[u.perfil]}</td>
                  {ehSuperAdmin && (
                    <td className="px-5 py-3 text-muted">{nomeDaEmpresa(u.empresaId)}</td>
                  )}
                  <td className="px-5 py-3 text-muted">{u.matricula ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{u.cargo ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {resultado && resultado.totalElementos > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Página {resultado.paginaAtual + 1} de {resultado.totalPaginas} —{' '}
            {resultado.totalElementos} usuário{resultado.totalElementos === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0}
              className="rounded-sm border border-border px-3 py-1.5 font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPagina((p) => p + 1)}
              disabled={pagina + 1 >= resultado.totalPaginas}
              className="rounded-sm border border-border px-3 py-1.5 font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}