import { useEffect, useState } from 'react';
import * as fechamentosApi from '../api/fechamentos';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ComboboxBusca } from '../components/ComboboxBusca';
import {
  ACAO_FECHAMENTO_LABELS,
  type AcaoFechamento,
  type Empresa,
  type FechamentoLog,
  type FechamentoLogFiltro,
  type Pagina,
} from '../types';

const ACOES: AcaoFechamento[] = ['FECHADO', 'REABERTO'];
const MESES = Array.from({ length: 12 }, (_, i) => i + 1);

function rotuloMes(ano: number, mes: number): string {
  return `${mes.toString().padStart(2, '0')}/${ano}`;
}

export function FechamentosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const [filtros, setFiltros] = useState<FechamentoLogFiltro>({});
  const [filtrosAplicados, setFiltrosAplicados] = useState<FechamentoLogFiltro>({});
  const [pagina, setPagina] = useState(0);

  const [resultado, setResultado] = useState<Pagina<FechamentoLog> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

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
    fechamentosApi
      .buscarHistoricoFechamentos(filtrosAplicados, pagina)
      .then(setResultado)
      .catch((err) => setErro(extrairErro(err).message))
      .finally(() => setCarregando(false));
  }, [filtrosAplicados, pagina]);

  function atualizarFiltro<K extends keyof FechamentoLogFiltro>(campo: K, valor: FechamentoLogFiltro[K]) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  const logs = resultado?.conteudo ?? [];
  const inputClasse =
    'w-full rounded-sm border border-border bg-canvas px-2 py-1 text-xs text-ink outline-none focus:border-primary';

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Histórico de fechamentos</h1>
        <p className="mt-1 text-sm text-muted">
          Toda vez que um mês é fechado ou reaberto, fica registrado aqui quem fez e quando.
        </p>
      </header>

      {erro && (
        <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>
      )}

      {ehSuperAdmin && (
        <div className="mb-4 max-w-xs">
          <label className="mb-1.5 block text-sm font-medium text-ink">Empresa</label>
          <ComboboxBusca
            opcoes={empresas.map((e) => ({ id: e.id, label: e.razaoSocial }))}
            valor={filtros.empresaId ?? ''}
            onSelecionar={(id) => atualizarFiltro('empresaId', id || undefined)}
            placeholder="Todas as empresas..."
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-5 py-3 font-medium">Mês</th>
              <th className="px-5 py-3 font-medium">Ação</th>
              {ehSuperAdmin && <th className="px-5 py-3 font-medium">Empresa</th>}
              <th className="px-5 py-3 font-medium">Por quem</th>
              <th className="px-5 py-3 font-medium">Quando</th>
            </tr>
            <tr className="border-b border-border bg-canvas/50">
              <th className="px-5 py-2">
                <select
                  value={filtros.mes ?? ''}
                  onChange={(e) => atualizarFiltro('mes', e.target.value ? Number(e.target.value) : undefined)}
                  className={inputClasse}
                >
                  <option value="">Mês</option>
                  {MESES.map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </th>
              <th className="px-5 py-2">
                <select
                  value={filtros.acao ?? ''}
                  onChange={(e) =>
                    atualizarFiltro('acao', (e.target.value || undefined) as AcaoFechamento | undefined)
                  }
                  className={inputClasse}
                >
                  <option value="">Todas</option>
                  {ACOES.map((a) => (
                    <option key={a} value={a}>{ACAO_FECHAMENTO_LABELS[a]}</option>
                  ))}
                </select>
              </th>
              {ehSuperAdmin && <th className="px-5 py-2"></th>}
              <th className="px-5 py-2"></th>
              <th className="px-5 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={ehSuperAdmin ? 5 : 4} className="px-5 py-8 text-center text-sm text-muted">
                  Carregando...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={ehSuperAdmin ? 5 : 4} className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum fechamento ou reabertura registrado com esses filtros.
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr key={`${log.ano}-${log.mes}-${log.quando}-${i}`} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-ink">{rotuloMes(log.ano, log.mes)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                        log.acao === 'FECHADO' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                      }`}
                    >
                      {ACAO_FECHAMENTO_LABELS[log.acao]}
                    </span>
                  </td>
                  {ehSuperAdmin && <td className="px-5 py-3 text-muted">{log.empresaNome}</td>}
                  <td className="px-5 py-3 text-muted">{log.usuarioNome}</td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(log.quando).toLocaleString('pt-BR')}
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
            {resultado.totalElementos} registro{resultado.totalElementos === 1 ? '' : 's'}
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