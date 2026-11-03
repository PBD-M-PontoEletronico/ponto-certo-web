import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as relatoriosApi from '../api/relatorios';
import * as empresasApi from '../api/empresas';
import * as setoresApi from '../api/setores';
import * as usuariosApi from '../api/usuarios';
import { useAuth } from '../context/AuthContext';
import { ComboboxBusca } from '../components/ComboboxBusca';
import { mensagemDoErro } from '../utils/erros';
import { formatarData, hojeISO, mesAtualISO, somarDias, ultimoDiaDoMes } from '../utils/datas';
import type {
  AgrupamentoRelatorio,
  Empresa,
  RelatorioFiltro,
  RelatorioIndicadores,
  RelatorioLinha,
  RelatorioPrevistoRealizado,
  Setor,
  Usuario,
} from '../types';

// W12 — Relatório de previsto contra realizado.
// O RH escolhe o período (um mês, uma semana ou datas livres), como quebrar
// as colunas (por semana ou por mês) e, se quiser, um setor e/ou funcionário.
// Os números vêm prontos da API; aqui só formata e mostra.

type TipoPeriodo = 'MES' | 'SEMANA' | 'PERSONALIZADO';
type Aba = 'FUNCIONARIOS' | 'SETORES';

// ----------------------------------------------------------------- helpers

// Segunda-feira da semana de "dataISO"
function segundaDaSemana(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const diaDaSemana = new Date(ano, mes - 1, dia).getDay(); // 0 = domingo
  const voltar = diaDaSemana === 0 ? 6 : diaDaSemana - 1;
  return somarDias(dataISO, -voltar);
}

// 485 -> "8h05"; -90 -> "-1h30"; 35 -> "35min"; 0 -> "0h"
function horas(minutos: number): string {
  const sinal = minutos < 0 ? '-' : '';
  const abs = Math.abs(minutos);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0 && m > 0) return `${sinal}${m}min`;
  return m === 0 ? `${sinal}${h}h` : `${sinal}${h}h${String(m).padStart(2, '0')}`;
}

function horasComSinal(minutos: number): string {
  return minutos > 0 ? `+${horas(minutos)}` : horas(minutos);
}

function corDiferenca(minutos: number): string {
  if (minutos < 0) return 'text-danger';
  if (minutos > 0) return 'text-success';
  return 'text-muted';
}

// Quanto do previsto foi cumprido (0 a 1, podendo passar de 1)
function proporcao(ind: RelatorioIndicadores): number {
  if (ind.minutosPrevistos === 0) return ind.minutosRealizados > 0 ? 1 : 0;
  return ind.minutosRealizados / ind.minutosPrevistos;
}

function plural(n: number, singular: string, pluralTexto: string): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

// --------------------------------------------------------------- componente

export function RelatoriosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  // Filtros
  const [empresaId, setEmpresaId] = useState('');
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>('MES');
  const [mes, setMes] = useState(mesAtualISO());
  const [diaDaSemana, setDiaDaSemana] = useState(hojeISO());
  const [inicioLivre, setInicioLivre] = useState(`${mesAtualISO()}-01`);
  const [fimLivre, setFimLivre] = useState(hojeISO());
  const [agrupamento, setAgrupamento] = useState<AgrupamentoRelatorio>('SEMANA');
  const [setorId, setSetorId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');

  // Listas dos filtros
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);

  // Resultado
  const [relatorio, setRelatorio] = useState<RelatorioPrevistoRealizado | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>('FUNCIONARIOS');
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  const precisaEscolherEmpresa = ehSuperAdmin && !empresaId;
  const empresaDaBusca = ehSuperAdmin ? empresaId || undefined : undefined;

  // Período efetivo a partir do tipo escolhido
  const { inicio, fim } = useMemo(() => {
    if (tipoPeriodo === 'MES') {
      return { inicio: `${mes}-01`, fim: ultimoDiaDoMes(`${mes}-01`) };
    }
    if (tipoPeriodo === 'SEMANA') {
      const segunda = segundaDaSemana(diaDaSemana);
      return { inicio: segunda, fim: somarDias(segunda, 6) };
    }
    return { inicio: inicioLivre, fim: fimLivre };
  }, [tipoPeriodo, mes, diaDaSemana, inicioLivre, fimLivre]);

  const filtro: RelatorioFiltro = useMemo(
    () => ({
      inicio,
      fim,
      agrupamento,
      setorId: setorId || undefined,
      usuarioId: usuarioId || undefined,
      empresaId: empresaDaBusca,
    }),
    [inicio, fim, agrupamento, setorId, usuarioId, empresaDaBusca],
  );

  // Empresas (só superadmin)
  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  // Setores e funcionários da empresa
  useEffect(() => {
    setSetorId('');
    setUsuarioId('');
    if (precisaEscolherEmpresa) {
      setSetores([]);
      setFuncionarios([]);
      return;
    }
    setoresApi.listarSetores(empresaDaBusca).then(setSetores).catch(() => setSetores([]));
    usuariosApi
      .listarUsuarios(empresaDaBusca)
      .then((lista) => setFuncionarios(lista.filter((u) => u.perfil === 'FUNCIONARIO')))
      .catch(() => setFuncionarios([]));
  }, [empresaDaBusca, precisaEscolherEmpresa]);

  // Busca o relatório quando algum filtro muda (com uma pausa curta para
  // não disparar uma requisição a cada tecla nas datas).
  useEffect(() => {
    if (precisaEscolherEmpresa || !inicio || !fim) {
      setRelatorio(null);
      return;
    }
    const handle = setTimeout(() => {
      setCarregando(true);
      setErro(null);
      relatoriosApi
        .buscarPrevistoRealizado(filtro)
        .then((r) => {
          setRelatorio(r);
          setAbertos(new Set());
        })
        .catch((err) => {
          setRelatorio(null);
          setErro(mensagemDoErro(err));
        })
        .finally(() => setCarregando(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [filtro, precisaEscolherEmpresa, inicio, fim]);

  async function exportarCsv() {
    setExportando(true);
    setErro(null);
    try {
      await relatoriosApi.baixarPrevistoRealizadoCsv(filtro);
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setExportando(false);
    }
  }

  function alternar(chave: string) {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }

  const linhas = relatorio ? (aba === 'FUNCIONARIOS' ? relatorio.funcionarios : relatorio.setores) : [];
  const total = relatorio?.totalGeral.total;
  const semDados = !!relatorio && relatorio.funcionarios.length === 0;
  const variosPeriodos = (relatorio?.periodos.length ?? 0) > 1;
  const nomeSetorFiltrado = setores.find((s) => s.id === setorId)?.nome;

  const inputClasse =
    'h-[38px] rounded-sm border border-border bg-canvas px-3 text-sm text-ink outline-none focus:border-primary';

  return (
    <div className="mx-auto max-w-7xl">
      {/* ---------------------------------------------------------- topo */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Previsto x realizado</h1>
          <p className="mt-1 text-sm text-muted">
            Horas da escala contra horas trabalhadas, por funcionário e por setor.
          </p>
        </div>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={!relatorio || semDados || exportando || carregando}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconeDownload />
          {exportando ? 'Gerando...' : 'Exportar CSV'}
        </button>
      </header>

      {/* ------------------------------------------------------- filtros */}
      <section className="mb-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          {ehSuperAdmin && (
            <Campo rotulo="Empresa" className="w-full sm:w-64">
              <ComboboxBusca
                opcoes={empresas.map((e) => ({ id: e.id, label: e.razaoSocial }))}
                valor={empresaId}
                onSelecionar={setEmpresaId}
                placeholder="Escolha a empresa..."
              />
            </Campo>
          )}

          <Campo rotulo="Período">
            <div className="flex flex-wrap items-center gap-2">
              <Alternador
                opcoes={[
                  { valor: 'MES', rotulo: 'Mês' },
                  { valor: 'SEMANA', rotulo: 'Semana' },
                  { valor: 'PERSONALIZADO', rotulo: 'Datas' },
                ]}
                valor={tipoPeriodo}
                onMudar={setTipoPeriodo}
              />
              {tipoPeriodo === 'MES' && (
                <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputClasse} />
              )}
              {tipoPeriodo === 'SEMANA' && (
                <input
                  type="date"
                  value={diaDaSemana}
                  onChange={(e) => setDiaDaSemana(e.target.value)}
                  title="Escolha qualquer dia: a semana vai de segunda a domingo"
                  className={inputClasse}
                />
              )}
              {tipoPeriodo === 'PERSONALIZADO' && (
                <span className="flex items-center gap-2">
                  <input
                    type="date"
                    value={inicioLivre}
                    onChange={(e) => setInicioLivre(e.target.value)}
                    className={inputClasse}
                  />
                  <span className="text-sm text-muted">até</span>
                  <input
                    type="date"
                    value={fimLivre}
                    onChange={(e) => setFimLivre(e.target.value)}
                    className={inputClasse}
                  />
                </span>
              )}
            </div>
          </Campo>

          <Campo rotulo="Quebrar por">
            <Alternador
              opcoes={[
                { valor: 'SEMANA', rotulo: 'Semana' },
                { valor: 'MES', rotulo: 'Mês' },
              ]}
              valor={agrupamento}
              onMudar={setAgrupamento}
            />
          </Campo>

          <Campo rotulo="Setor" className="w-full sm:w-52">
            <ComboboxBusca
              opcoes={setores.map((s) => ({ id: s.id, label: s.nome }))}
              valor={setorId}
              onSelecionar={setSetorId}
              placeholder="Todos"
              opcaoVaziaLabel="Todos os setores"
              disabled={precisaEscolherEmpresa}
            />
          </Campo>

          <Campo rotulo="Funcionário" className="w-full sm:w-64">
            <ComboboxBusca
              opcoes={funcionarios.map((u) => ({
                id: u.id,
                label: u.matricula ? `${u.nome} (${u.matricula})` : u.nome,
              }))}
              valor={usuarioId}
              onSelecionar={setUsuarioId}
              placeholder="Todos"
              opcaoVaziaLabel="Todos os funcionários"
              disabled={precisaEscolherEmpresa}
            />
          </Campo>
        </div>
      </section>

      {/* ------------------------------------------- legenda do período */}
      {relatorio && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="rounded-sm bg-primary/10 px-2 py-0.5 font-medium text-primary">
            {formatarData(relatorio.inicio)} a {formatarData(relatorio.fim)}
          </span>
          {relatorio.calculadoAte !== relatorio.fim && (
            <span>Contado até hoje ({formatarData(relatorio.calculadoAte)}). Dias futuros ficam de fora.</span>
          )}
          {total && total.diasEmAberto > 0 && (
            <span className="text-accent">
              {plural(total.diasEmAberto, 'dia em aberto', 'dias em aberto')} (entrada sem saída) fora da conta.
            </span>
          )}
          {carregando && <span>Atualizando...</span>}
        </div>
      )}

      {erro && <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>}

      {precisaEscolherEmpresa && <Vazio titulo="Escolha a empresa" texto="O relatório é sempre de uma empresa por vez." />}

      {carregando && !relatorio && !precisaEscolherEmpresa && (
        <div className="rounded-lg border border-border bg-surface px-5 py-16 text-center text-sm text-muted">
          Calculando...
        </div>
      )}

      {semDados && (
        <Vazio
          titulo="Nada para mostrar nesse período"
          texto={
            `Nenhum funcionário com escala ou batida de ponto entre ${formatarData(relatorio!.inicio)} e ` +
            `${formatarData(relatorio!.calculadoAte)}` +
            (nomeSetorFiltrado ? ` no setor ${nomeSetorFiltrado}` : '') +
            '. Tente outro período ou tire os filtros.'
          }
        />
      )}

      {relatorio && total && !semDados && (
        <div className={`transition-opacity ${carregando ? 'opacity-60' : ''}`}>
          {/* -------------------------------------------------- resumo */}
          <section className="mb-6 grid overflow-hidden rounded-lg border border-border bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Horas trabalhadas</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
                <span className="text-3xl font-semibold tabular-nums text-ink">{horas(total.minutosRealizados)}</span>
                <span className="text-sm text-muted">de {horas(total.minutosPrevistos)} previstas</span>
              </p>
              <BarraProgresso valor={proporcao(total)} className="mt-4 h-2" />
              <p className="mt-3 text-sm">
                <span className={`font-semibold tabular-nums ${corDiferenca(total.diferencaMinutos)}`}>
                  {horasComSinal(total.diferencaMinutos)}
                </span>{' '}
                <span className="text-muted">
                  {total.diferencaMinutos < 0
                    ? 'faltando em relação à escala'
                    : total.diferencaMinutos > 0
                      ? 'acima da escala'
                      : 'exatamente o previsto'}
                </span>
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
              <Indicador titulo="Horas extras" valor={horas(total.minutosExtras)} />
              <Indicador
                titulo="Atrasos"
                valor={String(total.atrasosJustificados + total.atrasosNaoJustificados)}
                alerta={total.atrasosNaoJustificados > 0 ? `${total.atrasosNaoJustificados} sem justificativa` : undefined}
                detalhe={total.minutosAtraso > 0 ? `${horas(total.minutosAtraso)} no total` : 'nenhum'}
              />
              <Indicador
                titulo="Faltas"
                valor={String(total.faltasJustificadas + total.faltasNaoJustificadas)}
                alerta={total.faltasNaoJustificadas > 0 ? `${total.faltasNaoJustificadas} sem justificativa` : undefined}
                detalhe={
                  total.faltasJustificadas > 0
                    ? plural(total.faltasJustificadas, 'justificada', 'justificadas')
                    : 'nenhuma justificada'
                }
              />
              <Indicador
                titulo="Afastamento"
                valor={plural(total.diasAfastamento, 'dia', 'dias')}
                detalhe={total.afastamentos.length > 0 ? total.afastamentos.join(', ') : 'ninguém afastado'}
              />
            </dl>
          </section>

          {/* ---------------------------------------------------- abas */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <Alternador
              opcoes={[
                { valor: 'FUNCIONARIOS', rotulo: `Por funcionário · ${relatorio.funcionarios.length}` },
                { valor: 'SETORES', rotulo: `Por setor · ${relatorio.setores.length}` },
              ]}
              valor={aba}
              onMudar={(a) => {
                setAba(a);
                setAbertos(new Set());
              }}
            />
            {variosPeriodos && (
              <span className="hidden text-xs text-muted sm:inline">
                Clique numa linha para ver {agrupamento === 'SEMANA' ? 'semana a semana' : 'mês a mês'}
              </span>
            )}
          </div>

          {/* --------------------------------------------------- tabela */}
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">{aba === 'FUNCIONARIOS' ? 'Funcionário' : 'Setor'}</th>
                  <th className="px-4 py-3 text-right font-medium">Previsto</th>
                  <th className="px-4 py-3 font-medium">Realizado</th>
                  <th className="px-4 py-3 text-right font-medium">Diferença</th>
                  <th className="px-4 py-3 text-right font-medium">Extras</th>
                  <th className="px-4 py-3 font-medium">Atrasos</th>
                  <th className="px-4 py-3 font-medium">Faltas</th>
                  <th className="px-4 py-3 font-medium">Afastamento</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => {
                  const chave = `${aba}-${linha.id ?? 'sem'}`;
                  const aberto = abertos.has(chave);
                  return (
                    <Fragment key={chave}>
                      <LinhaIndicadores
                        nome={linha.nome}
                        detalhe={linha.detalhe}
                        ind={linha.total}
                        expansivel={variosPeriodos}
                        aberto={aberto}
                        onAlternar={() => alternar(chave)}
                      />
                      {aberto &&
                        relatorio.periodos.map((periodo, i) => (
                          <LinhaIndicadores
                            key={`${chave}-${periodo.inicio}`}
                            nome={periodo.rotulo}
                            ind={linha.porPeriodo[i]}
                            subLinha
                          />
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
              {linhas.length > 1 && (
                <tfoot>
                  <TotalGeral linha={relatorio.totalGeral} />
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------- subpartes

function Campo({
  rotulo,
  className,
  children,
}: {
  rotulo: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{rotulo}</span>
      {children}
    </div>
  );
}

// Botões lado a lado, um ativo por vez (no lugar de um <select>)
function Alternador<T extends string>({
  opcoes,
  valor,
  onMudar,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onMudar: (v: T) => void;
}) {
  return (
    <div className="inline-flex h-[38px] items-center rounded-sm border border-border bg-canvas p-0.5">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onMudar(o.valor)}
          className={`h-full whitespace-nowrap rounded-sm px-3 text-sm font-medium transition-colors ${
            o.valor === valor ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

// Barra de quanto do previsto foi cumprido. Passou de 100%: o excesso aparece
// em outra cor no fim da barra.
function BarraProgresso({ valor, className }: { valor: number; className?: string }) {
  const cumprido = Math.min(valor, 1);
  const excesso = valor > 1 ? Math.min(valor - 1, 1) / valor : 0;
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-border ${className ?? ''}`}>
      <div className="h-full bg-primary" style={{ width: `${(valor > 1 ? 1 - excesso : cumprido) * 100}%` }} />
      {excesso > 0 && <div className="h-full bg-success" style={{ width: `${excesso * 100}%` }} />}
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  detalhe,
  alerta,
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  alerta?: string;
}) {
  return (
    <div className="bg-surface p-5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{titulo}</dt>
      <dd className="mt-2 text-xl font-semibold tabular-nums text-ink">{valor}</dd>
      {alerta && <dd className="mt-1 text-xs font-medium text-danger">{alerta}</dd>}
      {detalhe && <dd className="mt-0.5 text-xs text-muted">{detalhe}</dd>}
    </div>
  );
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IconeGrafico />
      </div>
      <p className="text-sm font-medium text-ink">{titulo}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{texto}</p>
    </div>
  );
}

// Contagem de atraso/falta: total em destaque e, se tiver, quantos sem justificativa.
function Ocorrencias({ justificados, naoJustificados, extra }: { justificados: number; naoJustificados: number; extra?: string }) {
  const totalOcorrencias = justificados + naoJustificados;
  if (totalOcorrencias === 0) {
    return <span className="text-muted">—</span>;
  }
  return (
    <span className="block leading-tight">
      <span className="tabular-nums text-ink">{totalOcorrencias}</span>
      {extra && <span className="ml-1 text-xs text-muted">· {extra}</span>}
      <span className={`block text-xs ${naoJustificados > 0 ? 'text-danger' : 'text-success'}`}>
        {naoJustificados > 0 ? `${naoJustificados} sem justif.` : 'todas justificadas'}
      </span>
    </span>
  );
}

function CelulasIndicadores({ ind }: { ind: RelatorioIndicadores }) {
  return (
    <>
      <td className="px-4 py-3 text-right tabular-nums text-muted">{horas(ind.minutosPrevistos)}</td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-3">
          <span className="w-12 tabular-nums text-ink">{horas(ind.minutosRealizados)}</span>
          <BarraProgresso valor={proporcao(ind)} className="h-1.5 max-w-24 flex-1" />
        </span>
      </td>
      <td className={`px-4 py-3 text-right font-medium tabular-nums ${corDiferenca(ind.diferencaMinutos)}`}>
        {horasComSinal(ind.diferencaMinutos)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-ink">
        {ind.minutosExtras > 0 ? horas(ind.minutosExtras) : <span className="text-muted">—</span>}
      </td>
      <td className="px-4 py-3">
        <Ocorrencias
          justificados={ind.atrasosJustificados}
          naoJustificados={ind.atrasosNaoJustificados}
          extra={ind.minutosAtraso > 0 ? horas(ind.minutosAtraso) : undefined}
        />
      </td>
      <td className="px-4 py-3">
        <Ocorrencias justificados={ind.faltasJustificadas} naoJustificados={ind.faltasNaoJustificadas} />
      </td>
      <td className="px-4 py-3">
        {ind.diasAfastamento > 0 ? (
          <span className="inline-flex rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {ind.afastamentos.join(', ') || 'Afastado'} · {plural(ind.diasAfastamento, 'dia', 'dias')}
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
    </>
  );
}

function LinhaIndicadores({
  nome,
  detalhe,
  ind,
  expansivel,
  aberto,
  onAlternar,
  subLinha,
}: {
  nome: string;
  detalhe?: string | null;
  ind: RelatorioIndicadores;
  expansivel?: boolean;
  aberto?: boolean;
  onAlternar?: () => void;
  subLinha?: boolean;
}) {
  return (
    <tr
      onClick={expansivel ? onAlternar : undefined}
      className={`border-b border-border last:border-0 ${
        subLinha ? 'bg-canvas/70 text-xs' : expansivel ? 'cursor-pointer hover:bg-canvas/60' : ''
      }`}
    >
      <td className={`px-4 py-3 ${subLinha ? 'pl-11 text-muted' : ''}`}>
        <span className="flex items-center gap-2">
          {expansivel && (
            <svg
              className={`h-4 w-4 shrink-0 text-muted transition-transform ${aberto ? 'rotate-90' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M7.2 14.8a.75.75 0 010-1.06L10.94 10 7.2 6.26a.75.75 0 111.06-1.06l4.27 4.27a.75.75 0 010 1.06l-4.27 4.27a.75.75 0 01-1.06 0z" clipRule="evenodd" />
            </svg>
          )}
          <span className="whitespace-nowrap leading-tight">
            <span className={subLinha ? '' : 'font-medium text-ink'}>{nome}</span>
            {detalhe && <span className="block text-xs text-muted">Matrícula {detalhe}</span>}
          </span>
        </span>
      </td>
      <CelulasIndicadores ind={ind} />
    </tr>
  );
}

function TotalGeral({ linha }: { linha: RelatorioLinha }) {
  return (
    <tr className="border-t border-border bg-canvas/60">
      <td className="px-4 py-3 font-semibold text-ink">Total</td>
      <CelulasIndicadores ind={linha.total} />
    </tr>
  );
}

function IconeDownload() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function IconeGrafico() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
