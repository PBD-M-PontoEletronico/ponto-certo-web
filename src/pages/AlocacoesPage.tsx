import { useEffect, useState, type FormEvent } from 'react';
import * as usuariosApi from '../api/usuarios';
import * as setoresApi from '../api/setores';
import * as escalasApi from '../api/escalas';
import * as alocacoesApi from '../api/alocacoes';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AgendaTurno, Alocacao, Empresa, Setor, Usuario } from '../types';
import type { Escala } from '../types/escala';

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function ultimoDiaDoMes(dataISO: string): string {
  const [ano, mes] = dataISO.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
}

function estaAtiva(alocacao: Alocacao): boolean {
  return alocacao.dataFim >= hojeISO();
}

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
  const [salvando, setSalvando] = useState(false);

  const [agendaInicio, setAgendaInicio] = useState(hojeISO());
  const [agendaFim, setAgendaFim] = useState(ultimoDiaDoMes(hojeISO()));
  const [agenda, setAgenda] = useState<AgendaTurno[]>([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);
  const [erroAgenda, setErroAgenda] = useState<string | null>(null);

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
    if (usuarioId) {
      alocacoesApi.historicoDoUsuario(usuarioId).then(setHistorico).catch(() => {});
      setAgenda([]);
      setErroAgenda(null);
    } else {
      setHistorico([]);
    }
  }, [usuarioId]);

  function handleDataInicioChange(value: string) {
    setDataInicio(value);
    if (value && !dataFim) {
      setDataFim(ultimoDiaDoMes(value));
    }
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
      setSetorId('');
      setEscalaId('');
      setDataInicio('');
      setDataFim('');
      const atualizado = await alocacoesApi.historicoDoUsuario(usuarioId);
      setHistorico(atualizado);
    } catch (err) {
      setErro(extrairErro(err).message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleEncerrar(alocacaoId: string) {
    const hoje = hojeISO();
    try {
      await alocacoesApi.encerrarAlocacao(alocacaoId, hoje);
      const atualizado = await alocacoesApi.historicoDoUsuario(usuarioId);
      setHistorico(atualizado);
    } catch (err) {
      setErro(extrairErro(err).message);
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
            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
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
            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
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
                  className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
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
                  className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
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
                  className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-ink">Data de fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  required
                  className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
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

            <div className="rounded-lg border border-border bg-surface">
              <p className="border-b border-border px-5 py-3 text-sm font-medium text-ink">
                Setores e escalas atuais e anteriores
              </p>
              {historico.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma alocação ainda.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="px-5 py-3 font-medium">Setor</th>
                      <th className="px-5 py-3 font-medium">Escala</th>
                      <th className="px-5 py-3 font-medium">Início</th>
                      <th className="px-5 py-3 font-medium">Fim</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((a) => (
                      <tr key={a.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-ink">{a.setor.nome}</td>
                        <td className="px-5 py-3 text-ink">{a.escala.nome}</td>
                        <td className="px-5 py-3 text-muted">{a.dataInicio}</td>
                        <td className="px-5 py-3">
                          {estaAtiva(a) ? (
                            <span className="rounded-sm bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                              Ativa até {a.dataFim}
                            </span>
                          ) : (
                            <span className="text-muted">{a.dataFim}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {estaAtiva(a) && (
                            <button
                              onClick={() => handleEncerrar(a.id)}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              Encerrar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-border bg-surface">
            <div className="flex flex-wrap items-end gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Agenda do funcionário</p>
                <p className="text-xs text-muted">Turnos previstos no período, em todos os setores.</p>
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
                      <td className="px-5 py-3 text-ink">{t.data}</td>
                      <td className="px-5 py-3 text-ink">{t.setorNome}</td>
                      <td className="px-5 py-3 text-muted">{t.escalaNome}</td>
                      <td className="px-5 py-3 text-muted">
                        {t.horaInicio} às {t.horaFim}
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
