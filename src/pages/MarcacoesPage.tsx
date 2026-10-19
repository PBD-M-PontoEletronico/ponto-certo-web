import { useEffect, useState } from 'react';
import * as marcacoesApi from '../api/marcacoes';
import * as empresasApi from '../api/empresas';
import * as setoresApi from '../api/setores';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  STATUS_MARCACAO_LABELS,
  TIPO_MARCACAO_LABELS,
  type Empresa,
  type Marcacao,
  type MarcacaoFiltro,
  type Pagina,
  type Setor,
  type StatusMarcacao,
  type TipoMarcacao,
} from '../types';

const TIPOS: TipoMarcacao[] = ['ENTRADA', 'SAIDA_INTERVALO', 'RETORNO_INTERVALO', 'SAIDA'];
const STATUS: StatusMarcacao[] = ['VALIDA', 'PENDENTE_ANALISE', 'RECUSADA'];

export function MarcacoesPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);

  const [filtros, setFiltros] = useState<MarcacaoFiltro>({ status: 'PENDENTE_ANALISE' });
  const [filtrosAplicados, setFiltrosAplicados] = useState<MarcacaoFiltro>({ status: 'PENDENTE_ANALISE' });
  const [pagina, setPagina] = useState(0);

  const [resultado, setResultado] = useState<Pagina<Marcacao> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [revisando, setRevisando] = useState<string | null>(null);

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  // Setores dependem da empresa: RH_ADMIN sempre vê os da própria empresa;
  // superadmin só carrega a lista depois de escolher uma empresa específica.
  useEffect(() => {
    if (!ehSuperAdmin) {
      setoresApi.listarSetores(undefined).then(setSetores).catch(() => {});
    } else if (filtros.empresaId) {
      setoresApi.listarSetores(filtros.empresaId).then(setSetores).catch(() => {});
    } else {
      setSetores([]);
    }
  }, [ehSuperAdmin, filtros.empresaId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setFiltrosAplicados(filtros);
      setPagina(0);
    }, 350);
    return () => clearTimeout(handle);
  }, [filtros]);

  function carregar() {
    setCarregando(true);
    setErro(null);
    marcacoesApi
      .buscarMarcacoes(filtrosAplicados, pagina)
      .then(setResultado)
      .catch((err) => setErro(extrairErro(err).message))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosAplicados, pagina]);

  function atualizarFiltro<K extends keyof MarcacaoFiltro>(campo: K, valor: MarcacaoFiltro[K]) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  // Trocar de empresa invalida o setor selecionado (era de outra empresa)
  function atualizarEmpresa(empresaId: string | undefined) {
    setFiltros((atual) => ({ ...atual, empresaId, setorId: undefined }));
  }

  async function handleRevisar(marcacao: Marcacao, novoStatus: 'VALIDA' | 'RECUSADA') {
    const motivo = novoStatus === 'RECUSADA' ? prompt('Motivo da recusa (opcional):') ?? undefined : undefined;

    setRevisando(marcacao.id);
    setErro(null);
    try {
      await marcacoesApi.revisarMarcacao(marcacao.id, novoStatus, motivo);
      carregar();
    } catch (err) {
      setErro(extrairErro(err).message);
    } finally {
      setRevisando(null);
    }
  }

  const marcacoes = resultado?.conteudo ?? [];
  const numeroColunas = ehSuperAdmin ? 9 : 8;
  const inputClasse =
    'w-full rounded-sm border border-border bg-canvas px-2 py-1 text-xs text-ink outline-none focus:border-primary';

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Marcações</h1>
        <p className="mt-1 text-sm text-muted">
          Marcações de ponto registradas pelos funcionários — revise as pendentes de análise.
        </p>
      </header>

      {erro && (
        <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
          {erro}
        </p>
      )}

      {ehSuperAdmin && (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Ver marcações da empresa
          </label>
          <select
            value={filtros.empresaId ?? ''}
            onChange={(e) => atualizarEmpresa(e.target.value || undefined)}
            className="w-full max-w-xs rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Todas as empresas</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.razaoSocial}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-5 py-3 font-medium">Usuário</th>
              {ehSuperAdmin && <th className="px-5 py-3 font-medium">Empresa</th>}
              <th className="px-5 py-3 font-medium">Setor</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Hora</th>
              <th className="px-5 py-3 font-medium">Offline</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Motivo</th>
              <th className="px-5 py-3"></th>
            </tr>
            <tr className="border-b border-border bg-canvas/50">
              <th className="px-5 py-2">
                <input
                  value={filtros.usuarioNome ?? ''}
                  onChange={(e) => atualizarFiltro('usuarioNome', e.target.value || undefined)}
                  placeholder="Filtrar..."
                  className={inputClasse}
                />
              </th>
              {ehSuperAdmin && <th className="px-5 py-2"></th>}
              <th className="px-5 py-2">
                <select
                  value={filtros.setorId ?? ''}
                  onChange={(e) => atualizarFiltro('setorId', e.target.value || undefined)}
                  disabled={setores.length === 0}
                  className={inputClasse}
                >
                  <option value="">Todos</option>
                  {setores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </th>
              <th className="px-5 py-2">
                <select
                  value={filtros.tipo ?? ''}
                  onChange={(e) => atualizarFiltro('tipo', (e.target.value || undefined) as TipoMarcacao | undefined)}
                  className={inputClasse}
                >
                  <option value="">Todos</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{TIPO_MARCACAO_LABELS[t]}</option>
                  ))}
                </select>
              </th>
              <th className="px-5 py-2"></th>
              <th className="px-5 py-2"></th>
              <th className="px-5 py-2">
                <select
                  value={filtros.status ?? ''}
                  onChange={(e) => atualizarFiltro('status', (e.target.value || undefined) as StatusMarcacao | undefined)}
                  className={inputClasse}
                >
                  <option value="">Todos</option>
                  {STATUS.map((s) => (
                    <option key={s} value={s}>{STATUS_MARCACAO_LABELS[s]}</option>
                  ))}
                </select>
              </th>
              <th className="px-5 py-2"></th>
              <th className="px-5 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={numeroColunas} className="px-5 py-8 text-center text-sm text-muted">
                  Carregando...
                </td>
              </tr>
            ) : marcacoes.length === 0 ? (
              <tr>
                <td colSpan={numeroColunas} className="px-5 py-8 text-center text-sm text-muted">
                  Nenhuma marcação encontrada com esses filtros.
                </td>
              </tr>
            ) : (
              marcacoes.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-ink">{m.usuarioNome}</td>
                  {ehSuperAdmin && (
                    <td className="px-5 py-3 text-muted">{m.empresaNome ?? '—'}</td>
                  )}
                  <td className="px-5 py-3 text-muted">{m.setorNome ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{TIPO_MARCACAO_LABELS[m.tipo]}</td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(m.horaCorrigida).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    {m.offline && (
                      <span className="rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                        m.status === 'VALIDA'
                          ? 'bg-success/10 text-success'
                          : m.status === 'PENDENTE_ANALISE'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {STATUS_MARCACAO_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{m.motivoRecusa ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {m.status === 'PENDENTE_ANALISE' && (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleRevisar(m, 'VALIDA')}
                          disabled={revisando === m.id}
                          className="text-sm font-medium text-success hover:underline disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRevisar(m, 'RECUSADA')}
                          disabled={revisando === m.id}
                          className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </td>
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
            {resultado.totalElementos} marcaç{resultado.totalElementos === 1 ? 'ão' : 'ões'}
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