import { useEffect, useState, type FormEvent } from 'react';
import * as solicitacoesApi from '../api/solicitacoes';
import * as fechamentosApi from '../api/fechamentos';
import * as usuariosApi from '../api/usuarios';
import * as empresasApi from '../api/empresas';
import { useAuth } from '../context/AuthContext';
import { IconeFechar } from '../components/NavIcons';
import { mensagemDoErro } from '../utils/erros';
import { formatarData, formatarHora, hojeISO, mesAtualISO } from '../utils/datas';
import {
  SITUACAO_DIA_LABELS,
  STATUS_MARCACAO_LABELS,
  STATUS_SOLICITACAO_LABELS,
  TIPO_MARCACAO_LABELS,
  TIPO_OCORRENCIA_LABELS,
  TIPO_SOLICITACAO_LABELS,
  type Empresa,
  type Fechamento,
  type Pagina,
  type Solicitacao,
  type SolicitacaoContexto,
  type SolicitacaoFiltro,
  type StatusSolicitacao,
  type TipoMarcacao,
  type TipoOcorrencia,
  type TipoSolicitacao,
  type Usuario,
} from '../types';

const campo =
    'w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary';
const filtroClasse =
    'rounded-sm border border-border bg-canvas px-2 py-1.5 text-xs text-ink outline-none focus:border-primary';

const TAMANHO_MAXIMO_MB = 5;
const TIPOS_MARCACAO: TipoMarcacao[] = ['ENTRADA', 'SAIDA_INTERVALO', 'RETORNO_INTERVALO', 'SAIDA'];
const OCORRENCIAS: TipoOcorrencia[] = ['ATRASO', 'FALTA', 'SAIDA_ANTECIPADA'];

const ESTILO_STATUS: Record<StatusSolicitacao, string> = {
  PENDENTE: 'bg-accent/10 text-accent',
  APROVADA: 'bg-success/10 text-success',
  RECUSADA: 'bg-danger/10 text-danger',
};

// Instante ISO -> "21/09/2026 08:03"
function dataHora(instante: string): string {
  return new Date(instante).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Instante ISO -> "08:03"
function soHora(instante: string): string {
  return new Date(instante).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// "2026-09" -> "09/2026"
function rotuloMes(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${m}/${ano}`;
}

// Mês anterior ao atual, "AAAA-MM" — é o que normalmente se fecha.
function mesAnteriorISO(): string {
  const [ano, mes] = mesAtualISO().split('-').map(Number);
  const data = new Date(ano, mes - 2, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function resumoDoPedido(s: Solicitacao): string {
  if (s.tipo === 'AJUSTE') {
    const tipo = s.tipoMarcacao ? TIPO_MARCACAO_LABELS[s.tipoMarcacao] : 'Marcação';
    return `${tipo} às ${s.horaPretendida ? formatarHora(s.horaPretendida) : '—'}`;
  }
  return s.ocorrencia ? TIPO_OCORRENCIA_LABELS[s.ocorrencia] : '—';
}

export function SolicitacoesPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';
  // Gestor só analisa; registrar em nome de alguém e fechar mês é do RH.
  const ehRh = usuarioLogado?.perfil === 'SUPERADMIN' || usuarioLogado?.perfil === 'RH_ADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const pronto = !ehSuperAdmin || !!empresaSelecionada;
  const empresaId = ehSuperAdmin ? empresaSelecionada : undefined;

  // ---- fila
  const [filtros, setFiltros] = useState<SolicitacaoFiltro>({});
  const [filtrosAplicados, setFiltrosAplicados] = useState<SolicitacaoFiltro>({});
  const [pagina, setPagina] = useState(0);
  const [resultado, setResultado] = useState<Pagina<Solicitacao> | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erroFila, setErroFila] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // ---- análise (um pedido aberto por vez)
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [contexto, setContexto] = useState<SolicitacaoContexto | null>(null);
  const [carregandoContexto, setCarregandoContexto] = useState(false);
  const [parecer, setParecer] = useState('');
  const [erroAnalise, setErroAnalise] = useState<string | null>(null);
  const [analisando, setAnalisando] = useState(false);

  // ---- novo pedido (RH) — formulário numa janela por cima da tela
  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [tipo, setTipo] = useState<TipoSolicitacao>('AJUSTE');
  const [data, setData] = useState('');
  const [ocorrencia, setOcorrencia] = useState<TipoOcorrencia>('ATRASO');
  const [tipoMarcacao, setTipoMarcacao] = useState<TipoMarcacao>('ENTRADA');
  const [horaPretendida, setHoraPretendida] = useState('');
  const [motivo, setMotivo] = useState('');
  const [anexo, setAnexo] = useState<File | null>(null);
  const [chaveArquivo, setChaveArquivo] = useState(0); // troca para limpar o campo de arquivo
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // ---- fechamento de mês (RH)
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [mesFechar, setMesFechar] = useState(mesAnteriorISO());
  const [erroFechamento, setErroFechamento] = useState<string | null>(null);
  const [salvandoFechamento, setSalvandoFechamento] = useState(false);

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  // Funcionários e meses fechados dependem da empresa (só para o RH)
  useEffect(() => {
    setUsuarioId('');
    if (!ehRh || !pronto) {
      setFuncionarios([]);
      setFechamentos([]);
      return;
    }
    usuariosApi
        .listarUsuarios(empresaId)
        .then((todos) =>
            setFuncionarios(todos.filter((u) => u.perfil === 'FUNCIONARIO' || u.perfil === 'GESTOR')),
        )
        .catch(() => {});
    carregarFechamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSelecionada, ehRh]);

  // Esc fecha a janela de novo pedido
  useEffect(() => {
    if (!modalAberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape' && !salvando) setModalAberto(false);
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [modalAberto, salvando]);

  // Espera a pessoa parar de digitar no filtro de nome
  useEffect(() => {
    const handle = setTimeout(() => {
      setFiltrosAplicados(filtros);
      setPagina(0);
    }, 350);
    return () => clearTimeout(handle);
  }, [filtros]);

  useEffect(() => {
    carregarFila();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosAplicados, pagina, empresaSelecionada]);

  function carregarFila() {
    if (!pronto) {
      setResultado(null);
      return;
    }
    setCarregando(true);
    setErroFila(null);
    solicitacoesApi
        .buscarSolicitacoes({ ...filtrosAplicados, empresaId }, pagina)
        .then(setResultado)
        .catch((err) => setErroFila(mensagemDoErro(err)))
        .finally(() => setCarregando(false));
  }

  function carregarFechamentos() {
    fechamentosApi
        .listarFechamentos(empresaId)
        .then(setFechamentos)
        .catch((err) => setErroFechamento(mensagemDoErro(err)));
  }

  function atualizarFiltro<K extends keyof SolicitacaoFiltro>(chave: K, valor: SolicitacaoFiltro[K]) {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
  }

  // ------------------------------------------------------------ análise

  async function abrir(s: Solicitacao) {
    if (abertoId === s.id) {
      setAbertoId(null);
      return;
    }
    setAbertoId(s.id);
    setParecer('');
    setErroAnalise(null);
    setContexto(null);
    setCarregandoContexto(true);
    try {
      setContexto(await solicitacoesApi.contextoDaSolicitacao(s.id));
    } catch (err) {
      setErroAnalise(mensagemDoErro(err));
    } finally {
      setCarregandoContexto(false);
    }
  }

  async function handleAnalisar(s: Solicitacao, decisao: 'APROVADA' | 'RECUSADA') {
    if (!parecer.trim()) {
      setErroAnalise('Escreva o parecer antes de aprovar ou recusar.');
      return;
    }
    setAnalisando(true);
    setErroAnalise(null);
    try {
      await solicitacoesApi.analisarSolicitacao(s.id, decisao, parecer.trim());
      setAbertoId(null);
      setAviso(
          decisao === 'APROVADA'
              ? s.tipo === 'AJUSTE'
                  ? `Ajuste de ${s.usuarioNome} aprovado — a marcação nova já está no espelho, ao lado da original.`
                  : `Justificativa de ${s.usuarioNome} aprovada.`
              : `Pedido de ${s.usuarioNome} recusado.`,
      );
      carregarFila();
    } catch (err) {
      setErroAnalise(mensagemDoErro(err));
    } finally {
      setAnalisando(false);
    }
  }

  async function handleBaixarAnexo(s: Solicitacao) {
    try {
      await solicitacoesApi.baixarAnexo(s);
    } catch {
      setErroFila('Não foi possível baixar o anexo');
    }
  }

  // ------------------------------------------------------------ novo pedido

  function handleAnexoChange(arquivo: File | null) {
    if (arquivo && arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErroForm(`O anexo deve ter no máximo ${TAMANHO_MAXIMO_MB} MB`);
      setAnexo(null);
      setChaveArquivo((c) => c + 1);
      return;
    }
    setErroForm(null);
    setAnexo(arquivo);
  }

  async function handleCriar(event: FormEvent) {
    event.preventDefault();
    setErroForm(null);
    setSalvando(true);
    try {
      await solicitacoesApi.criarSolicitacao({
        usuarioId,
        tipo,
        data,
        ocorrencia: tipo === 'JUSTIFICATIVA' ? ocorrencia : undefined,
        tipoMarcacao: tipo === 'AJUSTE' ? tipoMarcacao : undefined,
        horaPretendida: tipo === 'AJUSTE' ? horaPretendida : undefined,
        motivo,
        anexo: tipo === 'JUSTIFICATIVA' ? anexo : null,
      });
      setModalAberto(false);
      setAviso('Pedido registrado — já está na fila para análise.');
      setData('');
      setHoraPretendida('');
      setMotivo('');
      setAnexo(null);
      setChaveArquivo((c) => c + 1);
      carregarFila();
    } catch (err) {
      setErroForm(mensagemDoErro(err));
    } finally {
      setSalvando(false);
    }
  }

  function abrirModal() {
    setErroForm(null);
    setModalAberto(true);
  }

  function fecharModal() {
    if (!salvando) setModalAberto(false);
  }

  // ------------------------------------------------------------ fechamento

  async function handleFecharMes() {
    if (!confirm(`Fechar ${rotuloMes(mesFechar)}? Depois disso não entram pedidos novos para esse mês nem aprovações.`)) return;
    setErroFechamento(null);
    setSalvandoFechamento(true);
    try {
      await fechamentosApi.fecharMes(mesFechar, empresaId);
      carregarFechamentos();
    } catch (err) {
      setErroFechamento(mensagemDoErro(err));
    } finally {
      setSalvandoFechamento(false);
    }
  }

  async function handleReabrir(f: Fechamento) {
    if (!confirm(`Reabrir ${rotuloMes(f.mes)}?`)) return;
    setErroFechamento(null);
    try {
      await fechamentosApi.reabrirMes(f.id);
      carregarFechamentos();
    } catch (err) {
      setErroFechamento(mensagemDoErro(err));
    }
  }

  const pedidos = resultado?.conteudo ?? [];

  return (
      <div>
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">Pedidos de ajuste e justificativa</h1>
            <p className="mt-1 text-sm text-muted">
              Analise o que o funcionário alega. Nada é apagado: um ajuste aprovado vira uma marcação
              nova, e a original (ou a falta dela) continua visível ao lado no espelho.
            </p>
          </div>
          {ehRh && pronto && (
              <button
                  type="button"
                  onClick={abrirModal}
                  className="shrink-0 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                + Novo pedido
              </button>
          )}
        </header>

        {ehSuperAdmin && (
            <div className="mb-6 max-w-xs">
              <label className="mb-1.5 block text-sm font-medium text-ink">Empresa</label>
              <select
                  value={empresaSelecionada}
                  onChange={(e) => setEmpresaSelecionada(e.target.value)}
                  className={campo}
              >
                <option value="">Selecione uma empresa</option>
                {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.razaoSocial}</option>
                ))}
              </select>
            </div>
        )}

        {pronto && (
            <div className={`grid grid-cols-1 gap-8 ${ehRh ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
              {/* ------------------------------------------------ fila */}
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <input
                      value={filtros.usuarioNome ?? ''}
                      onChange={(e) => atualizarFiltro('usuarioNome', e.target.value || undefined)}
                      placeholder="Filtrar por funcionário..."
                      className={`${filtroClasse} w-56`}
                  />
                  <select
                      value={filtros.status ?? ''}
                      onChange={(e) =>
                          atualizarFiltro('status', (e.target.value || undefined) as StatusSolicitacao | undefined)
                      }
                      className={filtroClasse}
                  >
                    <option value="">Todos os status</option>
                    {(Object.keys(STATUS_SOLICITACAO_LABELS) as StatusSolicitacao[]).map((s) => (
                        <option key={s} value={s}>{STATUS_SOLICITACAO_LABELS[s]}</option>
                    ))}
                  </select>
                  <select
                      value={filtros.tipo ?? ''}
                      onChange={(e) =>
                          atualizarFiltro('tipo', (e.target.value || undefined) as TipoSolicitacao | undefined)
                      }
                      className={filtroClasse}
                  >
                    <option value="">Todos os tipos</option>
                    {(Object.keys(TIPO_SOLICITACAO_LABELS) as TipoSolicitacao[]).map((t) => (
                        <option key={t} value={t}>{TIPO_SOLICITACAO_LABELS[t]}</option>
                    ))}
                  </select>
                  <span className="ml-auto text-xs text-muted">Pendentes primeiro, do mais antigo ao mais novo</span>
                </div>

                {aviso && (
                    <p className="mb-4 rounded-sm bg-success/10 px-3 py-2 text-sm text-success">{aviso}</p>
                )}
                {erroFila && (
                    <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{erroFila}</p>
                )}

                <div className="rounded-lg border border-border bg-surface">
                  {carregando && pedidos.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-muted">Carregando...</p>
                  ) : pedidos.length === 0 ? (
                      <p className="px-5 py-8 text-center text-sm text-muted">
                        Nenhum pedido encontrado com esses filtros.
                      </p>
                  ) : (
                      <ul>
                        {pedidos.map((s) => {
                          const aberto = abertoId === s.id;
                          return (
                              <li key={s.id} className="border-b border-border last:border-0">
                                <div className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-ink">{s.usuarioNome}</span>
                                      {s.usuarioMatricula && (
                                          <span className="text-xs text-muted">{s.usuarioMatricula}</span>
                                      )}
                                      <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {TIPO_SOLICITACAO_LABELS[s.tipo]}
                              </span>
                                    </div>
                                    <p className="mt-1 text-sm text-ink">
                                      {formatarData(s.data)} · {resumoDoPedido(s)}
                                    </p>
                                    <p className="mt-1 text-sm text-muted">“{s.motivo}”</p>
                                    <p className="mt-1.5 text-xs text-muted">
                                      Pedido por {s.solicitanteNome}
                                      {s.solicitanteId !== s.usuarioId && ' (em nome do funcionário)'} em{' '}
                                      {dataHora(s.criadoEm)}
                                      {s.temAnexo && (
                                          <>
                                            {' · '}
                                            <button
                                                onClick={() => handleBaixarAnexo(s)}
                                                className="font-medium text-primary hover:underline"
                                            >
                                              Baixar anexo
                                            </button>
                                          </>
                                      )}
                                    </p>
                                    {s.status !== 'PENDENTE' && (
                                        <p className="mt-2 rounded-sm bg-canvas px-3 py-2 text-xs text-muted">
                                <span className="font-medium text-ink">
                                  {STATUS_SOLICITACAO_LABELS[s.status]} por {s.analisadoPorNome ?? '—'}
                                </span>
                                          {s.analisadoEm && <> em {dataHora(s.analisadoEm)}</>}: {s.parecer}
                                        </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                            <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${ESTILO_STATUS[s.status]}`}>
                              {STATUS_SOLICITACAO_LABELS[s.status]}
                            </span>
                                    {s.status === 'PENDENTE' && (
                                        <button
                                            onClick={() => abrir(s)}
                                            className="text-sm font-medium text-primary hover:underline"
                                        >
                                          {aberto ? 'Fechar' : 'Analisar'}
                                        </button>
                                    )}
                                  </div>
                                </div>

                                {aberto && (
                                    <PainelAnalise
                                        pedido={s}
                                        contexto={contexto}
                                        carregando={carregandoContexto}
                                        parecer={parecer}
                                        onParecer={setParecer}
                                        erro={erroAnalise}
                                        analisando={analisando}
                                        onDecidir={(decisao) => handleAnalisar(s, decisao)}
                                    />
                                )}
                              </li>
                          );
                        })}
                      </ul>
                  )}
                </div>

                {resultado && resultado.totalElementos > 0 && (
                    <div className="mt-4 flex items-center justify-between text-sm text-muted">
                <span>
                  Página {resultado.paginaAtual + 1} de {resultado.totalPaginas} — {resultado.totalElementos}{' '}
                  pedido{resultado.totalElementos === 1 ? '' : 's'}
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

              {/* ------------------------------------------------ coluna do RH */}
              {ehRh && (
                  <div className="flex flex-col gap-6">
                    <div className="rounded-lg border border-border bg-surface p-5">
                      <p className="text-sm font-medium text-ink">Fechamento do mês</p>
                      <p className="mb-4 mt-1 text-xs text-muted">
                        Mês fechado não aceita pedido novo nem aprovação. Pendentes ainda podem ser recusados.
                      </p>

                      <div className="mb-4 flex items-end gap-2">
                        <div className="flex-1">
                          <label className="mb-1.5 block text-xs font-medium text-ink">Mês</label>
                          <input
                              type="month"
                              value={mesFechar}
                              max={mesAtualISO()}
                              onChange={(e) => e.target.value && setMesFechar(e.target.value)}
                              className={campo}
                          />
                        </div>
                        <button
                            type="button"
                            onClick={handleFecharMes}
                            disabled={salvandoFechamento}
                            className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                        >
                          Fechar
                        </button>
                      </div>

                      {erroFechamento && (
                          <p className="mb-3 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{erroFechamento}</p>
                      )}

                      {fechamentos.length === 0 ? (
                          <p className="text-xs text-muted">Nenhum mês fechado ainda.</p>
                      ) : (
                          <ul className="flex flex-col gap-2">
                            {fechamentos.map((f) => (
                                <li key={f.id} className="flex items-center justify-between gap-3 text-sm">
                        <span>
                          <span className="font-medium text-ink">{rotuloMes(f.mes)}</span>
                          <span className="ml-2 text-xs text-muted">
                            por {f.fechadoPorNome}, {dataHora(f.fechadoEm)}
                          </span>
                        </span>
                                  <button
                                      onClick={() => handleReabrir(f)}
                                      className="text-xs font-medium text-danger hover:underline"
                                  >
                                    Reabrir
                                  </button>
                                </li>
                            ))}
                          </ul>
                      )}
                    </div>
                  </div>
              )}
            </div>
        )}
        {/* Janela de novo pedido (por cima da tela). Fecha no X, em Cancelar, no Esc ou clicando fora. */}
        {modalAberto && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                onClick={fecharModal}
            >
              <form
                  onSubmit={handleCriar}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="titulo-novo-pedido"
                  onClick={(e) => e.stopPropagation()}
                  className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-xl"
              >
                <div className="mb-1 flex items-start justify-between gap-4">
                  <p id="titulo-novo-pedido" className="text-base font-semibold text-ink">Registrar pedido</p>
                  <button
                      type="button"
                      onClick={fecharModal}
                      aria-label="Fechar"
                      className="text-muted transition-colors hover:text-ink"
                  >
                    <IconeFechar />
                  </button>
                </div>
                <p className="mb-4 text-xs text-muted">
                  Normalmente o funcionário pede pelo app. Use aqui para registrar em nome dele.
                </p>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Funcionário</label>
                  <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} required className={campo}>
                    <option value="" disabled>Selecione</option>
                    {funcionarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome} {u.matricula ? `(${u.matricula})` : ''}
                        </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-1 rounded-sm border border-border p-1">
                  {(['AJUSTE', 'JUSTIFICATIVA'] as TipoSolicitacao[]).map((t) => (
                      <button
                          key={t}
                          type="button"
                          onClick={() => setTipo(t)}
                          className={`rounded-sm py-1.5 text-xs font-medium transition-colors ${
                              tipo === t ? 'bg-primary text-white' : 'text-muted hover:text-ink'
                          }`}
                      >
                        {t === 'AJUSTE' ? 'Esqueceu de bater' : 'Justificativa'}
                      </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Data</label>
                  <input
                      type="date"
                      value={data}
                      max={hojeISO()}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className={campo}
                  />
                </div>

                {tipo === 'AJUSTE' ? (
                    <div className="mb-4 grid grid-cols-[1fr_110px] gap-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink">Marcação</label>
                        <select
                            value={tipoMarcacao}
                            onChange={(e) => setTipoMarcacao(e.target.value as TipoMarcacao)}
                            className={campo}
                        >
                          {TIPOS_MARCACAO.map((t) => (
                              <option key={t} value={t}>{TIPO_MARCACAO_LABELS[t]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-ink">Horário</label>
                        <input
                            type="time"
                            value={horaPretendida}
                            onChange={(e) => setHoraPretendida(e.target.value)}
                            required
                            className={campo}
                        />
                      </div>
                    </div>
                ) : (
                    <div className="mb-4">
                      <label className="mb-1.5 block text-sm font-medium text-ink">Ocorrência</label>
                      <select
                          value={ocorrencia}
                          onChange={(e) => setOcorrencia(e.target.value as TipoOcorrencia)}
                          className={campo}
                      >
                        {OCORRENCIAS.map((o) => (
                            <option key={o} value={o}>{TIPO_OCORRENCIA_LABELS[o]}</option>
                        ))}
                      </select>
                    </div>
                )}

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-ink">Motivo</label>
                  <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      required
                      maxLength={1000}
                      rows={3}
                      className={campo}
                  />
                </div>

                {tipo === 'JUSTIFICATIVA' && (
                    <div className="mb-5">
                      <label className="mb-1.5 block text-sm font-medium text-ink">
                        Anexo <span className="font-normal text-muted">(opcional, ex.: atestado)</span>
                      </label>
                      <input
                          key={chaveArquivo}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                          onChange={(e) => handleAnexoChange(e.target.files?.[0] ?? null)}
                          className="w-full text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
                      />
                      <p className="mt-1.5 text-xs text-muted">PDF, PNG ou JPG, até {TAMANHO_MAXIMO_MB} MB.</p>
                    </div>
                )}

                {erroForm && (
                    <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{erroForm}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                      type="button"
                      onClick={fecharModal}
                      disabled={salvando}
                      className="rounded-sm border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                      type="submit"
                      disabled={salvando}
                      className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {salvando ? 'Salvando...' : 'Registrar pedido'}
                  </button>
                </div>
              </form>
            </div>
        )}
      </div>
  );
}

interface PainelAnaliseProps {
  pedido: Solicitacao;
  contexto: SolicitacaoContexto | null;
  carregando: boolean;
  parecer: string;
  onParecer: (valor: string) => void;
  erro: string | null;
  analisando: boolean;
  onDecidir: (decisao: 'APROVADA' | 'RECUSADA') => void;
}

// O que o gestor precisa para decidir: previsto x batido no dia + parecer.
function PainelAnalise({
                         pedido,
                         contexto,
                         carregando,
                         parecer,
                         onParecer,
                         erro,
                         analisando,
                         onDecidir,
                       }: PainelAnaliseProps) {
  const originais = contexto?.marcacoesDoDia.filter((m) => !m.ajuste) ?? [];
  const ajustes = contexto?.marcacoesDoDia.filter((m) => m.ajuste) ?? [];

  return (
      <div className="border-t border-border bg-canvas/50 px-5 py-4">
        {carregando ? (
            <p className="text-sm text-muted">Carregando o dia {formatarData(pedido.data)}...</p>
        ) : contexto ? (
            <>
              {contexto.periodoFechado && (
                  <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
                    O mês deste pedido já foi fechado — ele só pode ser recusado.
                  </p>
              )}

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Previsto</p>
                  {contexto.turnosPrevistos.length > 0 ? (
                      contexto.turnosPrevistos.map((t, i) => (
                          <p key={`${t.setorId}-${i}`} className="text-sm text-ink">
                            {formatarHora(t.horaInicio)} às {formatarHora(t.horaFim)}
                            <span className="ml-2 text-xs text-muted">{t.setorNome}</span>
                          </p>
                      ))
                  ) : (
                      <p className="text-sm text-ink">
                        {SITUACAO_DIA_LABELS[contexto.situacao]}
                        {contexto.descricao && <span className="ml-1 text-muted">({contexto.descricao})</span>}
                      </p>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Batido no aparelho</p>
                  {originais.length === 0 ? (
                      <p className="text-sm text-muted">Nenhuma marcação</p>
                  ) : (
                      originais.map((m) => (
                          <p key={m.id} className="text-sm text-ink">
                            {soHora(m.horaCorrigida)} · {TIPO_MARCACAO_LABELS[m.tipo]}
                            {m.status !== 'VALIDA' && (
                                <span className="ml-2 text-xs text-danger">{STATUS_MARCACAO_LABELS[m.status]}</span>
                            )}
                          </p>
                      ))
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Ajustes já aprovados</p>
                  {ajustes.length === 0 ? (
                      <p className="text-sm text-muted">Nenhum</p>
                  ) : (
                      ajustes.map((m) => (
                          <p key={m.id} className="text-sm text-ink">
                            {soHora(m.horaCorrigida)} · {TIPO_MARCACAO_LABELS[m.tipo]}
                          </p>
                      ))
                  )}
                </div>
              </div>
            </>
        ) : null}

        <label className="mb-1.5 block text-sm font-medium text-ink">
          Parecer <span className="font-normal text-muted">(obrigatório — o funcionário vai ler)</span>
        </label>
        <textarea
            value={parecer}
            onChange={(e) => onParecer(e.target.value)}
            maxLength={1000}
            rows={2}
            className={campo}
        />

        {erro && <p className="mt-3 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

        <div className="mt-3 flex justify-end gap-2">
          <button
              onClick={() => onDecidir('RECUSADA')}
              disabled={analisando}
              className="rounded-sm border border-danger/40 px-4 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
          >
            Recusar
          </button>
          <button
              onClick={() => onDecidir('APROVADA')}
              disabled={analisando || !!contexto?.periodoFechado}
              className="rounded-sm bg-success px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pedido.tipo === 'AJUSTE' ? 'Aprovar e criar marcação' : 'Aprovar'}
          </button>
        </div>
      </div>
  );
}