import { useEffect, useState, type FormEvent } from 'react';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import type { Empresa } from '../types';

export function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [razaoSocial, setRazaoSocial] = useState('');
  const [contato, setContato] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await empresasApi.listarEmpresas();
      setEmpresas(dados);
    } catch (err) {
      setErro(extrairErro(err).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCriar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      await empresasApi.criarEmpresa({ razaoSocial, contato });
      setRazaoSocial('');
      setContato('');
      await carregar();
    } catch (err) {
      setErro(extrairErro(err).message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlternarSituacao(empresa: Empresa) {
    setErro(null);
    try {
      await empresasApi.atualizarSituacaoEmpresa(empresa.id, !empresa.ativa);
      await carregar();
    } catch (err) {
      setErro(extrairErro(err).message);
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Empresas</h1>
        <p className="mt-1 text-sm text-muted">
          Cadastre as empresas que vão usar o sistema.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <form
          onSubmit={handleCriar}
          className="h-fit rounded-lg border border-border bg-surface p-5"
        >
          <p className="mb-4 text-sm font-medium text-ink">Nova empresa</p>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Razão social
            </label>
            <input
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              required
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Contato
            </label>
            <input
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded-sm bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Cadastrar empresa'}
          </button>
        </form>

        <div className="rounded-lg border border-border bg-surface">
          {erro && (
            <p className="border-b border-border bg-danger/10 px-5 py-3 text-sm text-danger">
              {erro}
            </p>
          )}

          {carregando ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Carregando...
            </p>
          ) : empresas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              Nenhuma empresa cadastrada ainda.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="px-5 py-3 font-medium">Razão social</th>
                  <th className="px-5 py-3 font-medium">Contato</th>
                  <th className="px-5 py-3 font-medium">Situação</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-ink">{empresa.razaoSocial}</td>
                    <td className="px-5 py-3 text-muted">
                      {empresa.contato || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                          empresa.ativa
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}
                      >
                        {empresa.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleAlternarSituacao(empresa)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {empresa.ativa ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
