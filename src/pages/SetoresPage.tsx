import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as setoresApi from '../api/setores';
import * as empresasApi from '../api/empresas';
import * as alocacoesApi from '../api/alocacoes';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
    POLITICA_FORA_PERIMETRO_LABELS,
    type Alocacao,
    type Empresa,
    type Setor,
} from '../types';

export function SetoresPage() {
    const { usuario: usuarioLogado } = useAuth();
    const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

    const navigate = useNavigate();
    const location = useLocation();

    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [empresaFiltro, setEmpresaFiltro] = useState('');

    const [setores, setSetores] = useState<Setor[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    // Mensagem de sucesso vinda da página de cadastro (após "salvar e sair")
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

    async function carregar() {
        if (ehSuperAdmin && !empresaFiltro) {
            setSetores([]);
            setCarregando(false);
            return;
        }

        setCarregando(true);
        try {
            const dados = await setoresApi.listarSetores(
                ehSuperAdmin ? empresaFiltro : undefined
            );
            setSetores(dados);
        } catch (err) {
            setErro(extrairErro(err).message);
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empresaFiltro]);

    // Limpa o state da navegação para a mensagem não reaparecer num refresh
    useEffect(() => {
        if (sucesso) {
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleExcluir(setor: Setor) {
        if (!confirm(`Excluir o setor "${setor.nome}"?`)) return;

        setErro(null);
        setSucesso(null);
        try {
            await setoresApi.excluirSetor(setor.id);
            await carregar();
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

    return (
        <div>
            <header className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-ink">Setores</h1>
                    <p className="mt-1 text-sm text-muted">
                        Cadastre onde se trabalha, o perímetro de aceite do ponto e a
                        política de marcação de cada setor.
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
                <div className="mb-4">
                    <label className="mb-1.5 block text-sm font-medium text-ink">
                        Ver setores da empresa
                    </label>
                    <select
                        value={empresaFiltro}
                        onChange={(e) => setEmpresaFiltro(e.target.value)}
                        className="w-full max-w-xs rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                    >
                        <option value="">Selecione uma empresa</option>
                        {empresas.map((empresa) => (
                            <option key={empresa.id} value={empresa.id}>
                                {empresa.razaoSocial}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="rounded-lg border border-border bg-surface">
                {carregando ? (
                    <p className="px-5 py-8 text-center text-sm text-muted">
                        Carregando...
                    </p>
                ) : setores.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-muted">
                        {ehSuperAdmin && !empresaFiltro
                            ? 'Escolha uma empresa para ver os setores dela.'
                            : 'Nenhum setor cadastrado ainda.'}
                    </p>
                ) : (
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
                        </thead>
                        <tbody>
                        {setores.map((setor) => (
                            <>
                                <tr
                                    key={setor.id}
                                    className="border-b border-border last:border-0"
                                >
                                    <td className="px-5 py-3 text-ink">{setor.nome}</td>
                                    <td className="px-5 py-3 text-muted">
                                        {setor.endereco}
                                    </td>
                                    <td className="px-5 py-3 text-muted">
                                        {setor.ignorarLocalizacao
                                            ? '—'
                                            : `${setor.raioMetros} m`}
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
                                        {POLITICA_FORA_PERIMETRO_LABELS[
                                            setor.politicaForaPerimetro
                                            ]}
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
                                                {setorExpandido === setor.id
                                                    ? 'Ocultar'
                                                    : 'Ver alocados'}
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
                                                <p className="text-sm text-muted">
                                                    Carregando...
                                                </p>
                                            ) : alocadosNoSetor.length === 0 ? (
                                                <p className="text-sm text-muted">
                                                    Ninguém alocado neste setor no momento.
                                                </p>
                                            ) : (
                                                <ul className="space-y-1">
                                                    {alocadosNoSetor.map((a) => (
                                                        <li
                                                            key={a.id}
                                                            className="text-sm text-ink"
                                                        >
                                                            {a.usuario.nome}
                                                            {a.usuario.matricula && (
                                                                <span className="text-muted">
                                  {' '}
                                                                    ({a.usuario.matricula})
                                </span>
                                                            )}
                                                            <span className="text-muted">
                                {' '}
                                                                — desde {a.dataInicio}
                              </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
