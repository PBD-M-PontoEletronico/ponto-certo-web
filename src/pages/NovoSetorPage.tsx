import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as setoresApi from '../api/setores';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
    POLITICA_FORA_PERIMETRO_LABELS,
    type Empresa,
    type PoliticaForaPerimetro,
} from '../types';

// Ação disparada ao enviar o formulário: qual botão foi clicado
type AcaoSalvar = 'continuar' | 'sair';

export function NovoSetorPage() {
    const { usuario: usuarioLogado } = useAuth();
    const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

    const navigate = useNavigate();

    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);

    // Controla qual dos dois botões está em loading
    const [acaoSalvando, setAcaoSalvando] = useState<AcaoSalvar | null>(null);

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

    function limparFormulario() {
        setNome('');
        setEndereco('');
        setLatitude('');
        setLongitude('');
        setRaioMetros('');
        setExigirSelfie(true);
        setPoliticaForaPerimetro('BLOQUEAR');
        setIgnorarLocalizacao(false);
        // Mantém a empresa selecionada ao continuar cadastrando (fluxo mais rápido)
    }

    async function salvar(acao: AcaoSalvar) {
        setErro(null);
        setSucesso(null);
        setAcaoSalvando(acao);

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

            const mensagem = `Setor "${nome}" cadastrado com sucesso.`;

            if (acao === 'sair') {
                navigate('/setores', { state: { sucesso: mensagem } });
                return;
            }

            // "salvar e continuar": limpa o formulário e mantém o usuário na página
            setSucesso(mensagem);
            limparFormulario();
        } catch (err) {
            setErro(extrairErro(err).message);
        } finally {
            setAcaoSalvando(null);
        }
    }

    const salvando = acaoSalvando !== null;

    return (
        <div className="mx-auto max-w-xl">
            <header className="mb-8">
                <Link
                    to="/setores"
                    className="mb-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                    ← Voltar para Setores
                </Link>
                <h1 className="text-xl font-semibold text-ink">Registrar setor</h1>
                <p className="mt-1 text-sm text-muted">
                    Defina o endereço, o perímetro de aceite do ponto e a política de
                    marcação do novo setor.
                </p>
            </header>

            <form
                onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    salvar('continuar');
                }}
                className="rounded-lg border border-border bg-surface p-5"
            >
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

                <div className="mb-5 border-t border-border pt-4">
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

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={salvando}
                        className="flex-1 rounded-sm border border-primary py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
                    >
                        {acaoSalvando === 'continuar' ? 'Salvando...' : 'Salvar e continuar'}
                    </button>
                    <button
                        type="button"
                        onClick={() => salvar('sair')}
                        disabled={salvando}
                        className="flex-1 rounded-sm bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                    >
                        {acaoSalvando === 'sair' ? 'Salvando...' : 'Salvar e sair'}
                    </button>
                </div>
            </form>
        </div>
    );
}
