import { useEffect, useState, type FormEvent } from 'react';
import * as usuariosApi from '../api/usuarios';
import * as setoresApi from '../api/setores';
import * as escalasApi from '../api/escalas';
import * as alocacoesApi from '../api/alocacoes';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { mensagemDoErro } from '../utils/erros';
import { ComboboxBusca } from '../components/ComboboxBusca';
import { Modal } from '../components/Modal';
import {
  diaDaSemana,
  formatarData,
  formatarHora,
  hojeISO,
  mesAtualISO,
  somarDias,
  ultimoDiaDoMes,
} from '../utils/datas';
import {
  SITUACAO_DIA_LABELS,
  STATUS_MARCACAO_LABELS,
  TIPO_MARCACAO_LABELS,
  TIPO_OCORRENCIA_LABELS,
  type AgendaTurno,
  type Alocacao,
  type Empresa,
  type EspelhoDia,
  type EspelhoMarcacao,
  type SituacaoDia,
  type Setor,
  type Usuario,
} from '../types';
import type { Escala } from '../types/escala';

type SituacaoAlocacao = 'VIGENTE' | 'FUTURA' | 'ENCERRADA';
type AbaAlocacoes = 'historico' | 'espelho' | 'agenda';

function situacaoDaAlocacao(alocacao: Alocacao): SituacaoAlocacao {
  const hoje = hojeISO();
  if (alocacao.dataFim < hoje) return 'ENCERRADA';
  if (alocacao.dataInicio > hoje) return 'FUTURA';
  return 'VIGENTE';
}

const ESTILO_SITUACAO_DIA: Record<SituacaoDia, string> = {
  TRABALHO: 'bg-success/10 text-success',
  FOLGA: 'bg-border text-muted',
  FERIADO: 'bg-accent/10 text-accent',
  AFASTAMENTO: 'bg-primary/10 text-primary',
  SEM_ALOCACAO: 'text-muted',
};

// Instante ISO -> "08:03"
function horaDoInstante(instante: string): string {
  return new Date(instante).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Minutos -> "8h 00" (com sinal quando negativo); null = dia em andamento.
function formatarMinutos(minutos: number | null): string {
  if (minutos === null) return '—';
  const sinal = minutos < 0 ? '-' : '';
  const abs = Math.abs(minutos);
  const horas = Math.floor(abs / 60);
  const resto = abs % 60;
  return `${sinal}${horas}h ${resto.toString().padStart(2, '0')}`;
}

// Uma linha de marcação no espelho (coluna "Batido" ou "Ajustado")
function LinhaMarcacao({ m }: { m: EspelhoMarcacao }) {
  return (
    <div className={m.status === 'RECUSADA' ? 'line-through opacity-60' : undefined}>
      <span className="text-ink">{horaDoInstante(m.hora)}</span>{' '}
      <span className="text-xs">{TIPO_MARCACAO_LABELS[m.tipo]}</span>
      {m.status !== 'VALIDA' && (
        <span className="ml-1 text-xs text-danger">({STATUS_MARCACAO_LABELS[m.status]})</span>
      )}
      {m.ajuste && m.aprovadoPorNome && (
        <div className="text-xs">
          aprovado por {m.aprovadoPorNome}
          {m.aprovadoEm && ` em ${new Date(m.aprovadoEm).toLocaleDateString('pt-BR')}`}
        </div>
      )}
    </div>
  );
}

const campo =
  'w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary';

const abaBase = 'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors';
const abaAtivaClasse = 'border-primary text-primary';
const abaInativaClasse = 'border-transparent text-muted hover:text-ink';

export function AlocacoesPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [setorId, setSetorId] = useState('');
  const [escalaId, setEscalaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [historico, setHistorico] = useState<Alocacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState<AbaAlocacoes>('historico');
  const [modalNovaAlocacaoAberto, setModalNovaAlocacaoAberto] = useState(false);

  // Troca de escala (no meio de uma alocação)
  const [trocando, setTrocando] = useState<Alocacao | null>(null);
  const [trocaEscalaId, setTrocaEscalaId] = useState('');
  const [trocaSetorId, setTrocaSetorId] = useState('');
  const [trocaData, setTrocaData] = useState('');
  const [trocaDataFim, setTrocaDataFim] = useState('');
  const [trocaErro, setTrocaErro] = useState<string | null>(null);
  const [salvandoTroca, setSalvandoTroca] = useState(false);

  const [agendaInicio, setAgendaInicio] = useState(hojeISO());
  const [agendaFim, setAgendaFim] = useState(ultimoDiaDoMes(hojeISO()));
  const [agenda, setAgenda] = useState<AgendaTurno[]>([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);
  const [erroAgenda, setErroAgenda] = useState<string | null>(null);

  // Espelho do mês (escala vigente em cada dia, com feriados e afastamentos)
  const [mesEspelho, setMesEspelho] = useState(mesAtualISO());
  const [espelho, setEspelho] = useState<EspelhoDia[]>([]);
  const [carregandoEspelho, setCarregandoEspelho] = useState(false);
  const [erroEspelho, setErroEspelho] = useState<string | null>(null);

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  useEffect(() => {
    const empresaId = ehSuperAdmin ? empresaSelecionada : undefined;
    if (ehSuperAdmin && !empresaSelecionada) {
      setUsuarios([]);
      setSetores([]);
      setEscalas([]);
      return;
    }
    usuariosApi.listarUsuarios(empresaId).then((todos) => {
      // Só faz sentido alocar quem tem perfil FUNCIONARIO
      setUsuarios(todos.filter((u) => u.perfil === 'FUNCIONARIO'));
    }).catch(() => {});
    setoresApi.listarSetores(empresaId).then(setSetores).catch(() => {});
    escalasApi.listarEscalas(empresaId).then(setEscalas).catch(() => {});
    setUsuarioId('');
    setHistorico([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSelecionada]);

  useEffect(() => {
    setTrocando(null);
    setSucesso(null);
    setAbaAtiva('historico');
    if (usuarioId) {
      alocacoesApi.historicoDoUsuario(usuarioId).then(setHistorico).catch(() => {});
      setAgenda([]);
      setErroAgenda(null);
    } else {
      setHistorico([]);
    }
  }, [usuarioId]);

  // Recarrega o espelho ao trocar de funcionário ou de mês, e sempre que o
  // histórico muda (nova alocação, encerramento, troca de escala).
  useEffect(() => {
    if (!usuarioId) {
      setEspelho([]);
      return;
    }

    let cancelado = false;
    setCarregandoEspelho(true);
    setErroEspelho(null);

    alocacoesApi
      .espelhoDoUsuario(usuarioId, mesEspelho)
      .then((dias) => {
        if (!cancelado) setEspelho(dias);
      })
      .catch((err) => {
        if (!cancelado) setErroEspelho(mensagemDoErro(err));
      })
      .finally(() => {
        if (!cancelado) setCarregandoEspelho(false);
      });

    return () => {
      cancelado = true;
    };
  }, [usuarioId, mesEspelho, historico]);

  function handleDataInicioChange(value: string) {
    setDataInicio(value);
    if (value && !dataFim) {
      setDataFim(ultimoDiaDoMes(value));
    }
  }

  function abrirModalNovaAlocacao() {
    setSetorId('');
    setEscalaId('');
    setDataInicio('');
    setDataFim('');
    setErro(null);
    setModalNovaAlocacaoAberto(true);
  }

  async function handleAlocar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await alocacoesApi.alocar({
        usuarioId,
        setorId,
        escalaId,
        dataInicio,
        dataFim,
      });
      setModalNovaAlocacaoAberto(false);
      setSucesso('Alocação registrada com sucesso.');
      setAbaAtiva('historico');
      const atualizado = await alocacoesApi.historicoDoUsuario(usuarioId);
      setHistorico(atualizado);
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function handleEncerrar(alocacaoId: string) {
    const hoje = hojeISO();
    setSucesso(null);
    try {
      await alocacoesApi.encerrarAlocacao(alocacaoId, hoje);
      const atualizado = await alocacoesApi.historicoDoUsuario(usuarioId);
      setHistorico(atualizado);
    } catch (err) {
      setErro(extrairErro(err).message);
    }
  }

  async function handleExcluir(alocacao: Alocacao) {
    if (!confirm(
      `Excluir de vez a alocação "${alocacao.escala.nome}" (${alocacao.setor.nome}, ` +
      `${formatarData(alocacao.dataInicio)} a ${formatarData(alocacao.dataFim)})? Essa ação não pode ser desfeita.`
    )) return;

    setSucesso(null);
    try {
      await alocacoesApi.excluirAlocacao(alocacao.id);
      const atualizado = await alocacoesApi.historicoDoUsuario(usuarioId);
      setHistorico(atualizado);
    } catch (err) {
      setErro(extrairErro(err).message);
    }
  }

  function abrirTroca(alocacao: Alocacao) {
    // A troca vale de hoje em diante e sempre depois do início da alocação atual
    const primeiraDataPossivel = somarDias(alocacao.dataInicio, 1);
    const hoje = hojeISO();

    setTrocando(alocacao);
    setTrocaEscalaId('');
    setTrocaSetorId(alocacao.setor.id);
    setTrocaData(primeiraDataPossivel > hoje ? primeiraDataPossivel : hoje);
    setTrocaDataFim(alocacao.dataFim);
    setTrocaErro(null);
    setSucesso(null);
  }

  async function handleTrocar(event: FormEvent) {
    event.preventDefault();
    if (!trocando) return;

    setTrocaErro(null);
    setSalvandoTroca(true);

    try {
      const resultado = await alocacoesApi.trocarEscala(trocando.id, {
        escalaId: trocaEscalaId,
        setorId: trocaSetorId,
        dataTroca: trocaData,
        dataFim: trocaDataFim || undefined,
      });

      setTrocando(null);
      setSucesso(
        `Escala trocada: a anterior termina em ${formatarData(resultado.encerrada.dataFim)} ` +
          `e a nova começa em ${formatarData(resultado.nova.dataInicio)}.`,
      );
      setAbaAtiva('historico');
      const atualizado = await alocacoesApi.historicoDoUsuario(usuarioId);
      setHistorico(atualizado);
    } catch (err) {
      setTrocaErro(mensagemDoErro(err));
    } finally {
      setSalvandoTroca(false);
    }
  }

  async function handleVerAgenda() {
    setErroAgenda(null);
    setCarregandoAgenda(true);
    try {
      const turnos = await alocacoesApi.agendaDoUsuario(usuarioId, agendaInicio, agendaFim);
      setAgenda(turnos);
    } catch (err) {
      setErroAgenda(extrairErro(err).message);
    } finally {
      setCarregandoAgenda(false);
    }
  }

  // Mais recentes primeiro
  const historicoOrdenado = [...historico].sort((a, b) => b.dataInicio.localeCompare(a.dataInicio));

  const nomeDoFuncionarioSelecionado = usuarios.find((u) => u.id === usuarioId)?.nome ?? '';

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Alocação em escalas</h1>
        <p className="mt-1 text-sm text-muted">
          Aloque funcionários numa escala, dentro de um setor, com vigência.
        </p>
      </header>

      {ehSuperAdmin && (
        <div className="mb-4 max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-ink">Empresa</label>
          <ComboboxBusca
            opcoes={empresas.map((e) => ({ id: e.id, label: e.razaoSocial }))}
            valor={empresaSelecionada}
            onSelecionar={setEmpresaSelecionada}
            placeholder="Digite pra buscar a empresa..."
          />
        </div>
      )}

      {(!ehSuperAdmin || empresaSelecionada) && (
        <div className="mb-6 max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-ink">Funcionário</label>
          <ComboboxBusca
            opcoes={usuarios.map((u) => ({
              id: u.id,
              label: u.matricula ? `${u.nome} (${u.matricula})` : u.nome,
            }))}
            valor={usuarioId}
            onSelecionar={setUsuarioId}
            placeholder="Digite pra buscar o funcionário..."
          />
          {usuarios.length === 0 && (
            <p className="mt-1.5 text-xs text-muted">
              Nenhum usuário com perfil "Funcionário" cadastrado ainda.
            </p>
          )}
        </div>
      )}

      {usuarioId && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <div className="flex gap-1">
              <button
                onClick={() => setAbaAtiva('historico')}
                className={`${abaBase} ${abaAtiva === 'historico' ? abaAtivaClasse : abaInativaClasse}`}
              >
                Histórico de escalas
              </button>
              <button
                onClick={() => setAbaAtiva('espelho')}
                className={`${abaBase} ${abaAtiva === 'espelho' ? abaAtivaClasse : abaInativaClasse}`}
              >
                Espelho do mês
              </button>
              <button
                onClick={() => setAbaAtiva('agenda')}
                className={`${abaBase} ${abaAtiva === 'agenda' ? abaAtivaClasse : abaInativaClasse}`}
              >
                Agenda
              </button>
            </div>

            <button
              onClick={abrirModalNovaAlocacao}
              className="mb-2 shrink-0 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Nova alocação
            </button>
          </div>

          {sucesso && (
            <p className="mb-4 rounded-sm bg-success/10 px-3 py-2 text-sm text-success">{sucesso}</p>
          )}

          {abaAtiva === 'historico' && (
            <div className="rounded-lg border border-border bg-surface">
              {historicoOrdenado.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma alocação ainda.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="px-5 py-3 font-medium">Setor</th>
                      <th className="px-5 py-3 font-medium">Escala</th>
                      <th className="px-5 py-3 font-medium">Período</th>
                      <th className="px-5 py-3 font-medium">Situação</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoOrdenado.map((a) => {
                      const situacao = situacaoDaAlocacao(a);
                      return (
                        <tr key={a.id} className="border-b border-border last:border-0">
                          <td className="px-5 py-3 text-ink">{a.setor.nome}</td>
                          <td className="px-5 py-3 text-ink">{a.escala.nome}</td>
                          <td className="px-5 py-3 text-muted">
                            {formatarData(a.dataInicio)} a {formatarData(a.dataFim)}
                          </td>
                          <td className="px-5 py-3">
                            {situacao === 'VIGENTE' && (
                              <span className="rounded-sm bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                Vigente
                              </span>
                            )}
                            {situacao === 'FUTURA' && (
                              <span className="rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                Futura
                              </span>
                            )}
                            {situacao === 'ENCERRADA' && (
                              <span className="text-muted">Encerrada</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right">
                            {situacao !== 'ENCERRADA' && (
                              <>
                                <button
                                  onClick={() => abrirTroca(a)}
                                  className="mr-4 text-sm font-medium text-primary hover:underline"
                                >
                                  Trocar escala
                                </button>
                                <button
                                  onClick={() => handleEncerrar(a.id)}
                                  className="mr-4 text-sm font-medium text-primary hover:underline"
                                >
                                  Encerrar
                                </button>
                              </>
                            )}
                           {ehSuperAdmin && (
                                    <button
                                    onClick={() => handleExcluir(a)}
                                    className="text-sm font-medium text-danger hover:underline"
                                    >
                                    Excluir
                                    </button>
                                    )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {abaAtiva === 'espelho' && (
            <div className="rounded-lg border border-border bg-surface">
              <div className="flex flex-wrap items-end gap-4 border-b border-border px-5 py-4">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-ink">Espelho do mês</p>
                  <p className="text-xs text-muted">
                    Cada dia mostra a escala que valia naquela data e, lado a lado, o que foi batido no
                    aparelho e o que entrou por ajuste aprovado. Feriado e afastamento não geram falta
                    nem atraso.
                  </p>
                </div>
                <div className="ml-auto">
                  <label className="mb-1.5 block text-xs font-medium text-ink">Mês</label>
                  <input
                    type="month"
                    value={mesEspelho}
                    onChange={(e) => e.target.value && setMesEspelho(e.target.value)}
                    className="rounded-sm border border-border bg-canvas px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
              </div>

              {erroEspelho && <p className="px-5 py-3 text-sm text-danger">{erroEspelho}</p>}

              {carregandoEspelho && espelho.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">Carregando...</p>
              ) : espelho.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">Nenhum dado para o mês.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Situação</th>
                      <th className="px-5 py-3 font-medium">Previsto</th>
                      <th className="px-5 py-3 font-medium">Batido</th>
                      <th className="px-5 py-3 font-medium">Ajustado</th>
                      <th className="px-5 py-3 font-medium">Trabalhado</th>
                      <th className="px-5 py-3 font-medium">Atraso</th>
                      <th className="px-5 py-3 font-medium">Saldo do dia</th>
                      <th className="px-5 py-3 font-medium">Saldo acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {espelho.map((dia) => (
                      <tr key={dia.data} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-5 py-3 text-ink">
                          {formatarData(dia.data)}
                          <span className="ml-2 text-xs text-muted">{diaDaSemana(dia.data)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-sm px-2 py-0.5 text-xs font-medium ${ESTILO_SITUACAO_DIA[dia.situacao]}`}
                          >
                            {SITUACAO_DIA_LABELS[dia.situacao]}
                          </span>
                          {dia.justificativas.map((j) => (
                            <div
                              key={j.solicitacaoId}
                              className="mt-1 text-xs text-muted"
                              title={j.parecer ?? undefined}
                            >
                              {TIPO_OCORRENCIA_LABELS[j.ocorrencia]}{' '}
                              {j.status === 'APROVADA'
                                ? `justificado${j.analisadoPorNome ? ` por ${j.analisadoPorNome}` : ''}`
                                : '— justificativa pendente'}
                            </div>
                          ))}
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {dia.turnos.length > 0
                            ? dia.turnos.map((t, i) => (
                                <div key={`${t.setorId}-${t.horaInicio}-${i}`}>
                                  {formatarHora(t.horaInicio)} às {formatarHora(t.horaFim)}
                                  {t.atravessaMeiaNoite && (
                                    <span className="ml-2 rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                      vira o dia
                                    </span>
                                  )}
                                  <span className="ml-2 text-xs">
                                    {t.escalaNome} · {t.setorNome}
                                  </span>
                                </div>
                              ))
                            : (dia.descricao ?? '—')}
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {dia.marcacoes.some((m) => !m.ajuste)
                            ? dia.marcacoes
                                .filter((m) => !m.ajuste)
                                .map((m) => <LinhaMarcacao key={m.id} m={m} />)
                            : '—'}
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {dia.marcacoes.some((m) => m.ajuste)
                            ? dia.marcacoes
                                .filter((m) => m.ajuste)
                                .map((m) => <LinhaMarcacao key={m.id} m={m} />)
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-ink">
                          {formatarMinutos(dia.minutosTrabalhados)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                          {dia.minutosAtraso === null
                            ? '—'
                            : dia.minutosAtraso === 0
                              ? 'no horário'
                              : formatarMinutos(dia.minutosAtraso)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-3 font-medium ${
                            dia.saldoDoDiaMinutos === null
                              ? 'text-muted'
                              : dia.saldoDoDiaMinutos < 0
                                ? 'text-danger'
                                : dia.saldoDoDiaMinutos > 0
                                  ? 'text-success'
                                  : 'text-muted'
                          }`}
                        >
                          {formatarMinutos(dia.saldoDoDiaMinutos)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-3 font-medium ${
                            dia.saldoAcumuladoMinutos < 0 ? 'text-danger' : 'text-success'
                          }`}
                        >
                          {formatarMinutos(dia.saldoAcumuladoMinutos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          {abaAtiva === 'agenda' && (
            <div className="rounded-lg border border-border bg-surface">
              <div className="flex flex-wrap items-end gap-4 border-b border-border px-5 py-4">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-ink">Agenda do funcionário</p>
                  <p className="text-xs text-muted">
                    Turnos previstos no período, em todos os setores (sem feriados e afastamentos).
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink">De</label>
                    <input
                      type="date"
                      value={agendaInicio}
                      onChange={(e) => setAgendaInicio(e.target.value)}
                      className="rounded-sm border border-border bg-canvas px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink">Até</label>
                    <input
                      type="date"
                      value={agendaFim}
                      onChange={(e) => setAgendaFim(e.target.value)}
                      className="rounded-sm border border-border bg-canvas px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={handleVerAgenda}
                    disabled={carregandoAgenda}
                    className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {carregandoAgenda ? 'Buscando...' : 'Ver agenda'}
                  </button>
                </div>
              </div>

              {erroAgenda && (
                <p className="px-5 py-3 text-sm text-danger">{erroAgenda}</p>
              )}

              {agenda.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum turno no período — clique em "Ver agenda".
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Setor</th>
                      <th className="px-5 py-3 font-medium">Escala</th>
                      <th className="px-5 py-3 font-medium">Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agenda.map((t, i) => (
                      <tr key={`${t.data}-${t.setorId}-${t.horaInicio}-${i}`} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-ink">{formatarData(t.data)}</td>
                        <td className="px-5 py-3 text-ink">{t.setorNome}</td>
                        <td className="px-5 py-3 text-muted">{t.escalaNome}</td>
                        <td className="px-5 py-3 text-muted">
                          {formatarHora(t.horaInicio)} às {formatarHora(t.horaFim)}
                          {t.atravessaMeiaNoite && (
                            <span className="ml-2 rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                              vira o dia
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <Modal
            titulo={`Nova alocação — ${nomeDoFuncionarioSelecionado}`}
            aberto={modalNovaAlocacaoAberto}
            onFechar={() => setModalNovaAlocacaoAberto(false)}
            impedirFechar={salvando}
          >
            <form onSubmit={handleAlocar}>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-ink">Setor</label>
                <select
                  value={setorId}
                  onChange={(e) => setSetorId(e.target.value)}
                  required
                  className={campo}
                >
                  <option value="" disabled>Selecione</option>
                  {setores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-ink">Escala</label>
                <select
                  value={escalaId}
                  onChange={(e) => setEscalaId(e.target.value)}
                  required
                  className={campo}
                >
                  <option value="" disabled>Selecione</option>
                  {escalas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
                {escalas.length === 0 && (
                  <p className="mt-1.5 text-xs text-muted">Nenhuma escala cadastrada ainda.</p>
                )}
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-ink">Data de início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => handleDataInicioChange(e.target.value)}
                  required
                  className={campo}
                />
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-ink">Data de fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  required
                  className={campo}
                />
                <p className="mt-1.5 text-xs text-muted">
                  Sugerimos o fim do mês; ajuste se o ciclo for diferente.
                </p>
              </div>

              {erro && (
                <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 rounded-sm bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : 'Alocar'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalNovaAlocacaoAberto(false)}
                  disabled={salvando}
                  className="rounded-sm px-4 py-2 text-sm font-medium text-muted hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            titulo={trocando ? `Trocar escala — ${trocando.escala.nome} (${trocando.setor.nome})` : 'Trocar escala'}
            aberto={!!trocando}
            onFechar={() => setTrocando(null)}
            impedirFechar={salvandoTroca}
          >
            <form onSubmit={handleTrocar}>
              <p className="mb-4 text-xs text-muted">
                A alocação atual termina no dia anterior à troca e a nova começa na data
                escolhida. Nada é apagado: o histórico e o espelho dos dias que já passaram
                continuam com a escala antiga.
              </p>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Nova escala</label>
                  <select
                    value={trocaEscalaId}
                    onChange={(e) => setTrocaEscalaId(e.target.value)}
                    required
                    className={campo}
                  >
                    <option value="" disabled>Selecione</option>
                    {escalas.map((e) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Setor</label>
                  <select
                    value={trocaSetorId}
                    onChange={(e) => setTrocaSetorId(e.target.value)}
                    required
                    className={campo}
                  >
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">A partir de</label>
                  <input
                    type="date"
                    value={trocaData}
                    min={hojeISO()}
                    onChange={(e) => setTrocaData(e.target.value)}
                    required
                    className={campo}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">Até</label>
                  <input
                    type="date"
                    value={trocaDataFim}
                    min={trocaData || undefined}
                    onChange={(e) => setTrocaDataFim(e.target.value)}
                    required
                    className={campo}
                  />
                </div>
              </div>

              {trocaErro && (
                <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{trocaErro}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={salvandoTroca}
                  className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  {salvandoTroca ? 'Trocando...' : 'Trocar escala'}
                </button>
                <button
                  type="button"
                  onClick={() => setTrocando(null)}
                  disabled={salvandoTroca}
                  className="rounded-sm px-4 py-2 text-sm font-medium text-muted hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}