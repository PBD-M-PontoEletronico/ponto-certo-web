import { useEffect, useState } from 'react';
import * as dispositivosApi from '../api/dispositivos';
import * as empresasApi from '../api/empresas';
import * as setoresApi from '../api/setores';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  PERFIL_LABELS,
  TIPO_DISPOSITIVO_LABELS,
  type Dispositivo,
  type DispositivoFiltro,
  type Empresa,
  type Pagina,
  type Setor,
  type TipoDispositivo,
} from '../types';

const TIPOS: TipoDispositivo[] = ['PESSOAL', 'RELOGIO_SETOR'];

export function DispositivosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);

  const [filtros, setFiltros] = useState<DispositivoFiltro>({});
  const [filtrosAplicados, setFiltrosAplicados] = useState<DispositivoFiltro>({});
  const [pagina, setPagina] = useState(0);

  const [resultado, setResultado] = useState<Pagina<Dispositivo> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (ehSuperAdmin) {
      empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
    }
  }, [ehSuperAdmin]);

  // Setores dependem da empresa: RH_ADMIN sempre vê os da própria empresa;
  // superadmin só carrega a lista depois de escolher uma empresa específica
  // (com "Todas" selecionado, não faz sentido filtrar por setor).
  useEffect(() => {
    if (!ehSuperAdmin) {
      setoresApi.listarSetores(undefined).then(setSetores).catch(() => {});
    } else if (filtros.empresaId) {
      setoresApi.listarSetores(filtros.empresaId).then(setSetores).catch(() => {});
    } else {
      setSetores([]);
    }
  }, [ehSuperAdmin, filtros.empresaId]);

  // Debounce: só aplica o filtro (e volta pra primeira página) 350ms depois
  // da última mudança, pra não disparar uma busca a cada tecla digitada.
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
    dispositivosApi
      .buscarDispositivos(filtrosAplicados, pagina)
      .then(setResultado)
      .catch((err) => setErro(extrairErro(err).message))
      .finally(() => setCarregando(false));
  }, [filtrosAplicados, pagina]);

  function atualizarFiltro<K extends keyof DispositivoFiltro>(campo: K, valor: DispositivoFiltro[K]) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleRevogar(dispositivo: Dispositivo) {
    if (!confirm(`Revogar o dispositivo de "${dispositivo.usuarioNome}"?`)) return;

    setErro(null);
    try {
      await dispositivosApi.revogarDispositivo(dispositivo.id);
      dispositivosApi.buscarDispositivos(filtrosAplicados, pagina).then(setResultado);
    } catch (err) {
      setErro(extrairErro(err).message);
    }
  }

  const dispositivos = resultado?.conteudo ?? [];
  const numeroColunas = ehSuperAdmin ? 8 : 7;
  const inputClasse =
    'w-full rounded-sm border border-border bg-canvas px-2 py-1 text-xs text-ink outline-none focus:border-primary';

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-ink">Dispositivos</h1>
        <p className="mt-1 text-sm text-muted">
          Aparelhos vinculados a cada conta — pessoal (celular do funcionário)
          ou relógio de setor (tablet fixo operado por uma conta de setor).
        </p>
      </header>

      {erro && (
        <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
          {erro}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-5 py-3 font-medium">Usuário</th>
              {ehSuperAdmin && <th className="px-5 py-3 font-medium">Empresa</th>}
              <th className="px-5 py-3 font-medium">Perfil</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Setor</th>
              <th className="px-5 py-3 font-medium">Vinculado em</th>
              <th className="px-5 py-3 font-medium">Último acesso</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
            <tr className="border-b border-border bg-canvas/50">
              <th className="px-5 py-2">
                <input
                  value={filtros.usuarioNome ?? ''}
                  onChange={(e) => atualizarFiltro('usuarioNome', e.target.value || undefined)}
                  placeholder="Filtrar..."
                  className={inputClasse}
                />
              </th>
              {ehSuperAdmin && (
                <th className="px-5 py-2">
                  <select
                    value={filtros.empresaId ?? ''}
                    onChange={(e) => atualizarFiltro('empresaId', e.target.value || undefined)}
                    className={inputClasse}
                  >
                    <option value="">Todas</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.razaoSocial}</option>
                    ))}
                  </select>
                </th>
              )}
              <th className="px-5 py-2"></th>
              <th className="px-5 py-2">
                <select
                  value={filtros.tipo ?? ''}
                  onChange={(e) => atualizarFiltro('tipo', (e.target.value || undefined) as TipoDispositivo | undefined)}
                  className={inputClasse}
                >
                  <option value="">Todos</option>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{TIPO_DISPOSITIVO_LABELS[t]}</option>
                  ))}
                </select>
              </th>
              <th className="px-5 py-2">
                <select
                  value={filtros.setorId ?? ''}
                  onChange={(e) => atualizarFiltro('setorId', e.target.value || undefined)}
                  disabled={setores.length === 0}
                  className={inputClasse}
                >
                  <option value="">Todos</option>
                  {setores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </th>
              <th className="px-5 py-2">
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={filtros.dataVinculoDe ?? ''}
                    onChange={(e) => atualizarFiltro('dataVinculoDe', e.target.value || undefined)}
                    className={inputClasse}
                  />
                  <input
                    type="date"
                    value={filtros.dataVinculoAte ?? ''}
                    onChange={(e) => atualizarFiltro('dataVinculoAte', e.target.value || undefined)}
                    className={inputClasse}
                  />
                </div>
              </th>
              <th className="px-5 py-2">
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={filtros.ultimoAcessoDe ?? ''}
                    onChange={(e) => atualizarFiltro('ultimoAcessoDe', e.target.value || undefined)}
                    className={inputClasse}
                  />
                  <input
                    type="date"
                    value={filtros.ultimoAcessoAte ?? ''}
                    onChange={(e) => atualizarFiltro('ultimoAcessoAte', e.target.value || undefined)}
                    className={inputClasse}
                  />
                </div>
              </th>
              <th className="px-5 py-2">
                <select
                  value={filtros.ativo === undefined ? '' : String(filtros.ativo)}
                  onChange={(e) =>
                    atualizarFiltro('ativo', e.target.value === '' ? undefined : e.target.value === 'true')
                  }
                  className={inputClasse}
                >
                  <option value="">Todos</option>
                  <option value="true">Ativo</option>
                  <option value="false">Revogado</option>
                </select>
              </th>
              <th className="px-5 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={numeroColunas} className="px-5 py-8 text-center text-sm text-muted">
                  Carregando...
                </td>
              </tr>
            ) : dispositivos.length === 0 ? (
              <tr>
                <td colSpan={numeroColunas} className="px-5 py-8 text-center text-sm text-muted">
                  Nenhum dispositivo encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              dispositivos.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-ink">{d.usuarioNome}</td>
                  {ehSuperAdmin && (
                    <td className="px-5 py-3 text-muted">{d.empresaNome ?? '—'}</td>
                  )}
                  <td className="px-5 py-3 text-muted">{PERFIL_LABELS[d.usuarioPerfil]}</td>
                  <td className="px-5 py-3 text-muted">{TIPO_DISPOSITIVO_LABELS[d.tipo]}</td>
                  <td className="px-5 py-3 text-muted">{d.setorNome ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(d.dataVinculo).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(d.ultimoAcesso).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                        d.ativo ? 'bg-success/10 text-success' : 'bg-canvas text-muted'
                      }`}
                    >
                      {d.ativo ? 'Ativo' : 'Revogado'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {d.ativo && (
                      <button
                        onClick={() => handleRevogar(d)}
                        className="text-sm font-medium text-danger hover:underline"
                      >
                        Revogar
                      </button>
                    )}
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
            {resultado.totalElementos} dispositivo{resultado.totalElementos === 1 ? '' : 's'}
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