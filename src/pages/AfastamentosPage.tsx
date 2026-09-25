import { useEffect, useState, type FormEvent } from 'react';
import * as afastamentosApi from '../api/afastamentos';
import * as usuariosApi from '../api/usuarios';
import * as empresasApi from '../api/empresas';
import { useAuth } from '../context/AuthContext';
import { mensagemDoErro } from '../utils/erros';
import { formatarData } from '../utils/datas';
import {
  TIPO_AFASTAMENTO_LABELS,
  type Afastamento,
  type Empresa,
  type TipoAfastamento,
  type Usuario,
} from '../types';

const campo =
  'w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary';

const TAMANHO_MAXIMO_MB = 5;

export function AfastamentosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');

  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [usuarioId, setUsuarioId] = useState('');
  const [tipo, setTipo] = useState<TipoAfastamento>('FERIAS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [anexo, setAnexo] = useState<File | null>(null);
  const [chaveArquivo, setChaveArquivo] = useState(0); // troca para limpar o campo de arquivo

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const pronto = !ehSuperAdmin || !!empresaSelecionada;
  const empresaId = ehSuperAdmin ? empresaSelecionada : undefined;

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  useEffect(() => {
    setUsuarioId('');
    if (!pronto) {
      setFuncionarios([]);
      return;
    }
    usuariosApi
      .listarUsuarios(empresaId)
      .then((todos) => setFuncionarios(todos.filter((u) => u.perfil === 'FUNCIONARIO')))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSelecionada]);

  async function carregarAfastamentos() {
    if (!pronto) {
      setAfastamentos([]);
      return;
    }
    setCarregando(true);
    try {
      setAfastamentos(await afastamentosApi.listarAfastamentos(empresaId));
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAfastamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSelecionada]);

  function handleDataInicioChange(valor: string) {
    setDataInicio(valor);
    if (valor && !dataFim) {
      setDataFim(valor);
    }
  }

  function handleAnexoChange(arquivo: File | null) {
    if (arquivo && arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      setErro(`O anexo deve ter no máximo ${TAMANHO_MAXIMO_MB} MB`);
      setAnexo(null);
      setChaveArquivo((c) => c + 1);
      return;
    }
    setErro(null);
    setAnexo(arquivo);
  }

  async function handleCadastrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSucesso(null);

    if (dataFim < dataInicio) {
      setErro('A data de fim não pode ser anterior à data de início');
      return;
    }

    setSalvando(true);
    try {
      await afastamentosApi.criarAfastamento({ usuarioId, tipo, dataInicio, dataFim, anexo });

      setSucesso('Afastamento registrado.');
      setDataInicio('');
      setDataFim('');
      setAnexo(null);
      setChaveArquivo((c) => c + 1);
      await carregarAfastamentos();
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(afastamento: Afastamento) {
    const nome = afastamento.usuario.nome;
    if (!confirm(`Excluir o afastamento de ${nome} (${formatarData(afastamento.dataInicio)} a ${formatarData(afastamento.dataFim)})?`)) return;

    setErro(null);
    setSucesso(null);
    try {
      await afastamentosApi.excluirAfastamento(afastamento.id);
      await carregarAfastamentos();
    } catch (err) {
      setErro(mensagemDoErro(err));
    }
  }

  async function handleBaixarAnexo(afastamento: Afastamento) {
    setErro(null);
    try {
      await afastamentosApi.baixarAnexo(afastamento);
    } catch {
      setErro('Não foi possível baixar o anexo');
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Afastamentos</h1>
        <p className="mt-1 text-sm text-muted">
          Férias, atestados e licenças. Nos dias de afastamento o funcionário não tem falta nem
          atraso, e o dia aparece assim no espelho.
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
            <p className="mb-4 text-sm font-medium text-ink">Novo afastamento</p>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">Funcionário</label>
              <select
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
                required
                className={campo}
              >
                <option value="" disabled>Selecione</option>
                {funcionarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} {u.matricula ? `(${u.matricula})` : ''}
                  </option>
                ))}
              </select>
              {funcionarios.length === 0 && (
                <p className="mt-1.5 text-xs text-muted">
                  Nenhum usuário com perfil "Funcionário" cadastrado ainda.
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAfastamento)}
                className={campo}
              >
                {(Object.keys(TIPO_AFASTAMENTO_LABELS) as TipoAfastamento[]).map((t) => (
                  <option key={t} value={t}>{TIPO_AFASTAMENTO_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => handleDataInicioChange(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">Fim</label>
              <input
                type="date"
                value={dataFim}
                min={dataInicio || undefined}
                onChange={(e) => setDataFim(e.target.value)}
                required
                className={campo}
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Anexo <span className="font-normal text-muted">(opcional)</span>
              </label>
              <input
                key={chaveArquivo}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => handleAnexoChange(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
              />
              <p className="mt-1.5 text-xs text-muted">
                PDF, PNG ou JPG, até {TAMANHO_MAXIMO_MB} MB.
              </p>
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
              {salvando ? 'Salvando...' : 'Registrar afastamento'}
            </button>
          </form>

          <div className="rounded-lg border border-border bg-surface">
            <p className="border-b border-border px-5 py-3 text-sm font-medium text-ink">
              Afastamentos registrados
            </p>

            {carregando ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Carregando...</p>
            ) : afastamentos.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                Nenhum afastamento registrado ainda.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-5 py-3 font-medium">Funcionário</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Período</th>
                    <th className="px-5 py-3 font-medium">Anexo</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {afastamentos.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-ink">
                        {a.usuario.nome}
                        {a.usuario.matricula && (
                          <span className="ml-2 text-xs text-muted">{a.usuario.matricula}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {TIPO_AFASTAMENTO_LABELS[a.tipo]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {formatarData(a.dataInicio)} a {formatarData(a.dataFim)}
                      </td>
                      <td className="px-5 py-3">
                        {a.temAnexo ? (
                          <button
                            onClick={() => handleBaixarAnexo(a)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Baixar
                          </button>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleExcluir(a)}
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
