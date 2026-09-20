import { useEffect, useState, type FormEvent } from 'react';
import * as feriadosApi from '../api/feriados';
import * as setoresApi from '../api/setores';
import * as empresasApi from '../api/empresas';
import { useAuth } from '../context/AuthContext';
import { mensagemDoErro } from '../utils/erros';
import { diaDaSemana, formatarData } from '../utils/datas';
import type { Empresa, Feriado, Setor } from '../types';

const campo =
  'w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary';

export function FeriadosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');

  const [setores, setSetores] = useState<Setor[]>([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [carregando, setCarregando] = useState(false);

  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);

  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setorId, setSetorId] = useState(''); // vazio = empresa inteira

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // O SUPERADMIN não pertence a nenhuma empresa: precisa escolher uma primeiro
  const pronto = !ehSuperAdmin || !!empresaSelecionada;
  const empresaId = ehSuperAdmin ? empresaSelecionada : undefined;

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  useEffect(() => {
    setSetorId('');
    if (!pronto) {
      setSetores([]);
      return;
    }
    setoresApi.listarSetores(empresaId).then(setSetores).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSelecionada]);

  async function carregarFeriados() {
    if (!pronto) {
      setFeriados([]);
      return;
    }
    setCarregando(true);
    try {
      setFeriados(await feriadosApi.listarFeriados(empresaId, ano));
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFeriados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSelecionada, ano]);

  async function handleCadastrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);

    try {
      await feriadosApi.criarFeriado({
        data,
        descricao,
        setorId: setorId || undefined,
        empresaId: ehSuperAdmin ? empresaSelecionada : undefined,
      });

      const anoDoFeriado = Number(data.slice(0, 4));
      setSucesso('Feriado cadastrado.');
      setData('');
      setDescricao('');

      if (anoDoFeriado !== ano) {
        setAno(anoDoFeriado); // já dispara o recarregamento da lista
      } else {
        await carregarFeriados();
      }
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(feriado: Feriado) {
    if (!confirm(`Excluir o feriado "${feriado.descricao}" de ${formatarData(feriado.data)}?`)) return;

    setErro(null);
    setSucesso(null);
    try {
      await feriadosApi.excluirFeriado(feriado.id);
      await carregarFeriados();
    } catch (err) {
      setErro(mensagemDoErro(err));
    }
  }

  const anosDisponiveis = Array.from(
    new Set([anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1, anoAtual + 2, ano]),
  ).sort();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Feriados</h1>
        <p className="mt-1 text-sm text-muted">
          Cadastre feriados da empresa inteira ou de um setor. Nesses dias ninguém escalado ali
          tem falta nem atraso.
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

      {pronto && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
          <form onSubmit={handleCadastrar} className="h-fit rounded-lg border border-border bg-surface p-5">
            <p className="mb-4 text-sm font-medium text-ink">Novo feriado</p>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">Descrição</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                maxLength={120}
                placeholder="Ex.: Independência do Brasil"
                className={campo}
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">Vale para</label>
              <select value={setorId} onChange={(e) => setSetorId(e.target.value)} className={campo}>
                <option value="">Empresa inteira</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>Somente o setor: {s.nome}</option>
                ))}
              </select>
            </div>

            {erro && (
              <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{erro}</p>
            )}
            {sucesso && (
              <p className="mb-4 rounded-sm bg-success/10 px-3 py-2 text-sm text-success">{sucesso}</p>
            )}

            <button
              type="submit"
              disabled={salvando}
              className="w-full rounded-sm bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Cadastrar feriado'}
            </button>
          </form>

          <div className="rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-sm font-medium text-ink">Feriados cadastrados</p>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-ink">Ano</label>
                <select
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="rounded-sm border border-border bg-canvas px-2 py-1 text-sm text-ink outline-none focus:border-primary"
                >
                  {anosDisponiveis.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {carregando ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Carregando...</p>
            ) : feriados.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                Nenhum feriado cadastrado em {ano}.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium">Descrição</th>
                    <th className="px-5 py-3 font-medium">Vale para</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {feriados.map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-ink">
                        {formatarData(f.data)}
                        <span className="ml-2 text-xs text-muted">{diaDaSemana(f.data)}</span>
                      </td>
                      <td className="px-5 py-3 text-ink">{f.descricao}</td>
                      <td className="px-5 py-3">
                        {f.setorNome ? (
                          <span className="rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                            Setor: {f.setorNome}
                          </span>
                        ) : (
                          <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Empresa inteira
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleExcluir(f)}
                          className="text-sm font-medium text-danger hover:underline"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
