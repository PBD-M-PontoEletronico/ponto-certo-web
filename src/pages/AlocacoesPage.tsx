import { useEffect, useState, type FormEvent } from 'react';
import * as usuariosApi from '../api/usuarios';
import * as setoresApi from '../api/setores';
import * as alocacoesApi from '../api/alocacoes';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Alocacao, Empresa, Setor, Usuario } from '../types';

export function AlocacoesPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [setorId, setSetorId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [historico, setHistorico] = useState<Alocacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

 

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
      return;
    }
    usuariosApi.listarUsuarios(empresaId).then((todos) => {
      // Só faz sentido alocar quem tem perfil FUNCIONARIO
      setUsuarios(todos.filter((u) => u.perfil === 'FUNCIONARIO'));
    }).catch(() => {});
    setoresApi.listarSetores(empresaId).then(setSetores).catch(() => {});
    setUsuarioId('');
    setHistorico([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaSelecionada]);

  useEffect(() => {
    if (usuarioId) {
      alocacoesApi.historicoDoUsuario(usuarioId).then(setHistorico).catch(() => {});
    } else {
      setHistorico([]);
    }
  }, [usuarioId]);

  async function handleAlocar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await alocacoesApi.alocar({
        usuarioId,
        setorId,
        dataInicio,
        dataFim: dataFim || undefined,
      });
      setSetorId('');
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
    const hoje = new Date().toISOString().slice(0, 10);
    try {
      await alocacoesApi.encerrarAlocacao(alocacaoId, hoje);
      const atualizado = await alocacoesApi.historicoDoUsuario(usuarioId);
      setHistorico(atualizado);
    } catch (err) {
      setErro(extrairErro(err).message);
    }
  }


  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Alocação em setores</h1>
        <p className="mt-1 text-sm text-muted">
          Aloque funcionários em um ou mais setores, com vigência.
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
              <label className="mb-1.5 block text-sm font-medium text-ink">Data de início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Data de fim <span className="text-muted">(opcional)</span>
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
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
              Setores atuais e anteriores
            </p>
            {historico.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma alocação ainda.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-5 py-3 font-medium">Setor</th>
                    <th className="px-5 py-3 font-medium">Início</th>
                    <th className="px-5 py-3 font-medium">Fim</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-ink">{a.setor.nome}</td>
                      <td className="px-5 py-3 text-muted">{a.dataInicio}</td>
                      <td className="px-5 py-3">
                        {a.dataFim ? (
                          <span className="text-muted">{a.dataFim}</span>
                        ) : (
                          <span className="rounded-sm bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                            Ativa
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!a.dataFim && (
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
      )}
    </div>
  );
}