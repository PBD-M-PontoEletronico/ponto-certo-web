import { useEffect, useState, type FormEvent } from 'react';
import * as setoresApi from '../api/setores';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
    POLITICA_FORA_PERIMETRO_LABELS,
    type Empresa,
    type PoliticaForaPerimetro,
    type Setor,
} from '../types';

export function SetoresPage() {
    const { usuario: usuarioLogado } = useAuth();
    const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [empresaFiltro, setEmpresaFiltro] = useState('');

    const [setores, setSetores] = useState<Setor[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);

    const [nome, setNome] = useState('');
    const [endereco, setEndereco] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [raioMetros, setRaioMetros] = useState('');
    const [exigirSelfie, setExigirSelfie] = useState(true);
    const [politicaForaPerimetro, setPoliticaForaPerimetro] =
        useState<PoliticaForaPerimetro>('BLOQUEAR');
    const [ignorarLocalizacao, setIgnorarLocalizacao] = useState(false);
    const [empresaIdForm, setEmpresaIdForm] = useState('');

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

    function limparFormulario() {
        setNome('');
        setEndereco('');
        setLatitude('');
        setLongitude('');
        setRaioMetros('');
        setExigirSelfie(true);
        setPoliticaForaPerimetro('BLOQUEAR');
        setIgnorarLocalizacao(false);
        setEmpresaIdForm('');
    }

    async function handleCriar(event: FormEvent) {
        event.preventDefault();
        setErro(null);
        setSucesso(null);
        setSalvando(true);

        try {
            await setoresApi.criarSetor({
                nome,
                endereco,
                latitude: Number(latitude),
                longitude: Number(longitude),
                raioMetros: Number(raioMetros),
                exigirSelfie,
                politicaForaPerimetro,
                ignorarLocalizacao,
                empresaId: ehSuperAdmin ? empresaIdForm : undefined,
            });

            setSucesso(`Setor "${nome}" cadastrado com sucesso.`);
            limparFormulario();
            await carregar();
        } catch (err) {
            setErro(extrairErro(err).message);
        } finally {
            setSalvando(false);
        }
    }

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

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-xl font-semibold text-ink">Setores</h1>
                <p className="mt-1 text-sm text-muted">
                    Cadastre onde se trabalha, o perímetro de aceite do ponto e a
                    política de marcação de cada setor.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
                <form
                    onSubmit={handleCriar}
                    className="h-fit rounded-lg border border-border bg-surface p-5"
                >
                    <p className="mb-4 text-sm font-medium text-ink">Novo setor</p>

                    {ehSuperAdmin && (
                        <div className="mb-4">
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Empresa
                            </label>
                            <select
                                value={empresaIdForm}
                                onChange={(e) => setEmpresaIdForm(e.target.value)}
                                required
                                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                            >
                                <option value="" disabled>
                                    Selecione
                                </option>
                                {empresas.map((empresa) => (
                                    <option key={empresa.id} value={empresa.id}>
                                        {empresa.razaoSocial}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-medium text-ink">
                            Nome do setor
                        </label>
                        <input
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-medium text-ink">
                            Endereço
                        </label>
                        <input
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            required
                            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                        />
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Latitude
                            </label>
                            <input
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                type="number"
                                step="any"
                                required
                                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Longitude
                            </label>
                            <input
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                type="number"
                                step="any"
                                required
                                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="mb-1.5 block text-sm font-medium text-ink">
                            Raio de aceite (metros)
                        </label>
                        <input
                            value={raioMetros}
                            onChange={(e) => setRaioMetros(e.target.value)}
                            type="number"
                            min={1}
                            required
                            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                        />
                    </div>

                    <div className="mb-4 border-t border-border pt-4">
                        <p className="mb-3 text-sm font-medium text-ink">Política</p>

                        <label className="mb-3 flex items-center gap-2 text-sm text-ink">
                            <input
                                type="checkbox"
                                checked={exigirSelfie}
                                onChange={(e) => setExigirSelfie(e.target.checked)}
                            />
                            Exigir selfie na marcação
                        </label>

                        <div className="mb-3">
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Marcação fora do perímetro
                            </label>
                            <select
                                value={politicaForaPerimetro}
                                onChange={(e) =>
                                    setPoliticaForaPerimetro(
                                        e.target.value as PoliticaForaPerimetro
                                    )
                                }
                                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                            >
                                {(
                                    Object.keys(
                                        POLITICA_FORA_PERIMETRO_LABELS
                                    ) as PoliticaForaPerimetro[]
                                ).map((valor) => (
                                    <option key={valor} value={valor}>
                                        {POLITICA_FORA_PERIMETRO_LABELS[valor]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-ink">
                            <input
                                type="checkbox"
                                checked={ignorarLocalizacao}
                                onChange={(e) => setIgnorarLocalizacao(e.target.checked)}
                            />
                            Ignorar localização (setor sem lugar fixo — motorista, equipe
                            de rua)
                        </label>
                    </div>

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

                    <button
                        type="submit"
                        disabled={salvando}
                        className="w-full rounded-sm bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                    >
                        {salvando ? 'Salvando...' : 'Cadastrar setor'}
                    </button>
                </form>

                <div>
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
                                            <button
                                                onClick={() => handleExcluir(setor)}
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
            </div>
        </div>
    );
}