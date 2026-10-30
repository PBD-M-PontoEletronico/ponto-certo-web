import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as setoresApi from '../api/setores';
import * as empresasApi from '../api/empresas';
import * as alocacoesApi from '../api/alocacoes';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ComboboxBusca } from '../components/ComboboxBusca';
import {
    POLITICA_FORA_PERIMETRO_LABELS,
    type Alocacao,
    type Empresa,
    type Pagina,
    type PoliticaForaPerimetro,
    type Setor,
    type SetorFiltro,
} from '../types';

const POLITICAS: PoliticaForaPerimetro[] = ['BLOQUEAR', 'PENDENTE_ANALISE'];

export function SetoresPage() {
    const { usuario: usuarioLogado } = useAuth();
    const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

    const navigate = useNavigate();
    const location = useLocation();

    const [empresas, setEmpresas] = useState<Empresa[]>([]);

    const [filtros, setFiltros] = useState<SetorFiltro>({});
    const [filtrosAplicados, setFiltrosAplicados] = useState<SetorFiltro>({});
    const [pagina, setPagina] = useState(0);

    const [resultado, setResultado] = useState<Pagina<Setor> | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const [sucesso, setSucesso] = useState<string | null>(
        (location.state as { sucesso?: string } | null)?.sucesso ?? null
    );

    const [setorExpandido, setSetorExpandido] = useState<string | null>(null);
    const [alocadosNoSetor, setAlocadosNoSetor] = useState<Alocacao[]>([]);
    const [carregandoAlocados, setCarregandoAlocados] = useState(false);

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

    function carregar() {
        if (ehSuperAdmin && !filtrosAplicados.empresaId) {
            setResultado(null);
            setCarregando(false);
            return;
        }

        setCarregando(true);
        setErro(null);
        setoresApi
            .buscarSetores(filtrosAplicados, pagina)
            .then(setResultado)
            .catch((err) => setErro(extrairErro(err).message))
            .finally(() => setCarregando(false));
    }

    useEffect(() => {
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtrosAplicados, pagina]);

    useEffect(() => {
        if (sucesso) {
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function atualizarFiltro<K extends keyof SetorFiltro>(campo: K, valor: SetorFiltro[K]) {
        setSucesso(null);
        setFiltros((atual) => ({ ...atual, [campo]: valor }));
    }

    async function handleExcluir(setor: Setor) {
        if (!confirm(`Excluir o setor "${setor.nome}"?`)) return;

        setErro(null);
        setSucesso(null);
        try {
            await setoresApi.excluirSetor(setor.id);
            carregar();
        } catch (err) {
            setErro(extrairErro(err).message);
        }
    }

    async function toggleVerAlocados(setorId: string) {
        if (setorExpandido === setorId) {
            setSetorExpandido(null);
            return;
        }

        setSetorExpandido(setorId);
        setCarregandoAlocados(true);
        try {
            const dados = await alocacoesApi.alocadosAtualmenteNoSetor(setorId);
            setAlocadosNoSetor(dados);
        } catch {
            setAlocadosNoSetor([]);
        } finally {
            setCarregandoAlocados(false);
        }
    }

    const setores = resultado?.conteudo ?? [];
    const inputClasse =
        'w-full rounded-sm border border-border bg-canvas px-2 py-1 text-xs text-ink outline-none focus:border-primary';

    return (
        <div>
            <header className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-ink">Setores</h1>
                    <p className="mt-1 text-sm text-muted">
                        Busque e filtre os setores, o perímetro de aceite do ponto e a
                        política de marcação de cada um.
                    </p>
                </div>

                <Link
                    to="/setores/novo"
                    className="shrink-0 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                    Registrar Setor
                </Link>
            </header>

            {erro && (
                <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
                    {erro}
                </p>
            )}

            {sucesso && (
                <p className="mb-4 rounded-sm bg-success/10 px-3 py-2 text-sm text-success">
                    {sucesso}
                </p>
            )}

            {ehSuperAdmin && (
                <div className="mb-4 max-w-xs">
                    <label className="mb-1.5 block text-sm font-medium text-ink">
                        Empresa
                    </label>
                    <ComboboxBusca
                        opcoes={empresas.map((e) => ({ id: e.id, label: e.razaoSocial }))}
                        valor={filtros.empresaId ?? ''}
                        onSelecionar={(id) => atualizarFiltro('empresaId', id || undefined)}
                        placeholder="Digite pra buscar a empresa..."
                    />
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border text-muted">
                            <th className="px-5 py-3 font-medium">Nome</th>
                            <th className="px-5 py-3 font-medium">Endereço</th>
                            <th className="px-5 py-3 font-medium">Raio</th>
                            <th className="px-5 py-3 font-medium">Selfie</th>
                            <th className="px-5 py-3 font-medium">Fora do perímetro</th>
                            <th className="px-5 py-3 font-medium">Localização</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                        <tr className="border-b border-border bg-canvas/50">
                            <th className="px-5 py-2">
                                <input
                                    value={filtros.nome ?? ''}
                                    onChange={(e) => atualizarFiltro('nome', e.target.value || undefined)}
                                    placeholder="Filtrar..."
                                    className={inputClasse}
                                />
                            </th>
                            <th className="px-5 py-2"></th>
                            <th className="px-5 py-2"></th>
                            <th className="px-5 py-2">
                                <select
                                    value={filtros.exigirSelfie === undefined ? '' : String(filtros.exigirSelfie)}
                                    onChange={(e) =>
                                        atualizarFiltro(
                                            'exigirSelfie',
                                            e.target.value === '' ? undefined : e.target.value === 'true'
                                        )
                                    }
                                    className={inputClasse}
                                >
                                    <option value="">Todos</option>
                                    <option value="true">Exige</option>
                                    <option value="false">Não exige</option>
                                </select>
                            </th>
                            <th className="px-5 py-2">
                                <select
                                    value={filtros.politicaForaPerimetro ?? ''}
                                    onChange={(e) =>
                                        atualizarFiltro(
                                            'politicaForaPerimetro',
                                            (e.target.value || undefined) as PoliticaForaPerimetro | undefined
                                        )
                                    }
                                    className={inputClasse}
                                >
                                    <option value="">Todas</option>
                                    {POLITICAS.map((p) => (
                                        <option key={p} value={p}>{POLITICA_FORA_PERIMETRO_LABELS[p]}</option>
                                    ))}
                                </select>
                            </th>
                            <th className="px-5 py-2">
                                <select
                                    value={filtros.ignorarLocalizacao === undefined ? '' : String(filtros.ignorarLocalizacao)}
                                    onChange={(e) =>
                                        atualizarFiltro(
                                            'ignorarLocalizacao',
                                            e.target.value === '' ? undefined : e.target.value === 'true'
                                        )
                                    }
                                    className={inputClasse}
                                >
                                    <option value="">Todos</option>
                                    <option value="true">Ignorada</option>
                                    <option value="false">Validada</option>
                                </select>
                            </th>
                            <th className="px-5 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {carregando ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted">
                                    Carregando...
                                </td>
                            </tr>
                        ) : setores.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted">
                                    {ehSuperAdmin && !filtros.empresaId
                                        ? 'Escolha uma empresa para ver os setores dela.'
                                        : 'Nenhum setor encontrado com esses filtros.'}
                                </td>
                            </tr>
                        ) : (
                            setores.map((setor) => (
                                <>
                                    <tr key={setor.id} className="border-b border-border last:border-0">
                                        <td className="px-5 py-3 text-ink">{setor.nome}</td>
                                        <td className="px-5 py-3 text-muted">{setor.endereco}</td>
                                        <td className="px-5 py-3 text-muted">
                                            {setor.ignorarLocalizacao ? '—' : `${setor.raioMetros} m`}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                                                    setor.exigirSelfie
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-canvas text-muted'
                                                }`}
                                            >
                                                {setor.exigirSelfie ? 'Exige' : 'Não exige'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-muted">
                                            {POLITICA_FORA_PERIMETRO_LABELS[setor.politicaForaPerimetro]}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                                                    setor.ignorarLocalizacao
                                                        ? 'bg-accent/10 text-accent'
                                                        : 'bg-canvas text-muted'
                                                }`}
                                            >
                                                {setor.ignorarLocalizacao ? 'Ignorada' : 'Validada'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => toggleVerAlocados(setor.id)}
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    {setorExpandido === setor.id ? 'Ocultar' : 'Ver alocados'}
                                                </button>
                                                <button
                                                    onClick={() => handleExcluir(setor)}
                                                    className="text-sm font-medium text-danger hover:underline"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {setorExpandido === setor.id && (
                                        <tr key={`${setor.id}-alocados`}>
                                            <td colSpan={7} className="bg-canvas px-5 py-4">
                                                <p className="mb-2 text-xs font-medium uppercase text-muted">
                                                    Alocados hoje
                                                </p>
                                                {carregandoAlocados ? (
                                                    <p className="text-sm text-muted">Carregando...</p>
                                                ) : alocadosNoSetor.length === 0 ? (
                                                    <p className="text-sm text-muted">
                                                        Ninguém alocado neste setor no momento.
                                                    </p>
                                                ) : (
                                                    <ul className="space-y-1">
                                                        {alocadosNoSetor.map((a) => (
                                                            <li key={a.id} className="text-sm text-ink">
                                                                {a.usuario.nome}
                                                                {a.usuario.matricula && (
                                                                    <span className="text-muted"> ({a.usuario.matricula})</span>
                                                                )}
                                                                <span className="text-muted"> — desde {a.dataInicio}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {resultado && resultado.totalElementos > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm text-muted">
                    <span>
                        Página {resultado.paginaAtual + 1} de {resultado.totalPaginas} —{' '}
                        {resultado.totalElementos} setor{resultado.totalElementos === 1 ? '' : 'es'}
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