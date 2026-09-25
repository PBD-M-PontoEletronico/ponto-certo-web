import { useEffect, useState, type FormEvent } from 'react';
import * as usuariosApi from '../api/usuarios';
import * as setoresApi from '../api/setores';
import * as escalasApi from '../api/escalas';
import * as alocacoesApi from '../api/alocacoes';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { mensagemDoErro } from '../utils/erros';
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
  type AgendaTurno,
  type Alocacao,
  type Empresa,
  type EspelhoDia,
  type SituacaoDia,
  type Setor,
  type Usuario,
} from '../types';
import type { Escala } from '../types/escala';

type SituacaoAlocacao = 'VIGENTE' | 'FUTURA' | 'ENCERRADA';

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

const campo =
  'w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary';

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

  async function handleAlocar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);

    try {
      await alocacoesApi.alocar({
        usuarioId,
        setorId,
        escalaId,
        dataInicio,
        dataFim,
      });
      setSetorId('');
      setEscalaId('');
      setDataInicio('');
      setDataFim('');
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

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Alocação em escalas</h1>
        <p className="mt-1 text-sm text-muted">
          Aloque funcionários numa escala, dentro de um setor, com vigência.
        </p>
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

      {(!ehSuperAdmin || empresaSelecionada) && (
        <div className="mb-6 max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-ink">Funcionário</label>
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className={campo}
          >
            <option value="">Selecione um funcionário</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome} {u.matricula ? `(${u.matricula})` : ''}
              </option>
            ))}
          </select>
          {usuarios.length === 0 && (
            <p className="mt-1.5 text-xs text-muted">
              Nenhum usuário com perfil "Funcionário" cadastrado ainda.
            </p>
          )}
        </div>
      )}

      {usuarioId && (
        <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
            <form onSubmit={handleAlocar} className="h-fit rounded-lg border border-border bg-surface p-5">
              <p className="mb-4 text-sm font-medium text-ink">Nova alocação</p>

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

              <button
                type="submit"
                disabled={salvando}
                className="w-full rounded-sm bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Alocar'}
              </button>
            </form>

            <div className="space-y-6">
              {sucesso && (
                <p className="rounded-sm bg-success/10 px-3 py-2 text-sm text-success">{sucesso}</p>
              )}

              {trocando && (
                <form onSubmit={handleTrocar} className="rounded-lg border border-accent bg-surface p-5">
                  <p className="text-sm font-medium text-ink">
                    Trocar escala — {trocando.escala.nome} ({trocando.setor.nome})
                  </p>
                  <p className="mb-4 mt-1 text-xs text-muted">
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
                      className="rounded-sm px-4 py-2 text-sm font-medium text-muted hover:text-ink"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="rounded-lg border border-border bg-surface">
                <p className="border-b border-border px-5 py-3 text-sm font-medium text-ink">
                  Histórico de escalas
                </p>
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
                                    className="text-sm font-medium text-primary hover:underline"
                                  >
                                    Encerrar
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-border bg-surface">
            <div className="flex flex-wrap items-end gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Espelho do mês</p>
                <p className="text-xs text-muted">
                  Cada dia mostra a escala que valia naquela data. Feriado e afastamento não geram
                  falta nem atraso.
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
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium">Situação</th>
                    <th className="px-5 py-3 font-medium">Detalhe</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-surface">
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
        </>
      )}
    </div>
  );
}
