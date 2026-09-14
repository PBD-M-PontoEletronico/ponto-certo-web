import { useEffect, useState, type FormEvent } from 'react';
import * as escalasApi from '../api/escalas';
import * as empresasApi from '../api/empresas';
import { extrairErro } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { type Empresa } from '../types';
import { type Escala, type PrevisaoDia, type Turno, ModeloEscala } from '../types/escala';
import {
    duracaoTurnoMinutos,
    exigeDataReferencia,
    formatarDuracao,
    turnoAtravessaMeiaNoite,
} from '../utils/escalaCalculos';

const NOMES_MODELO: Record<ModeloEscala, string> = {
    [ModeloEscala.JORNADA_24X72]: '24x72',
    [ModeloEscala.JORNADA_12X36]: '12x36',
    [ModeloEscala.TURNO_DIURNO]: 'Turno diurno',
    [ModeloEscala.COMERCIAL_5X2]: 'Comercial 5x2',
};

const TURNO_VAZIO: Turno = { horaInicio: '08:00', horaFim: '17:00', intervaloMinutos: 60 };

export function EscalasPage() {
    const { usuario: usuarioLogado } = useAuth();
    const ehSuperAdmin = usuarioLogado?.perfil === 'SUPERADMIN';

    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [empresaFiltro, setEmpresaFiltro] = useState('');

    const [escalas, setEscalas] = useState<Escala[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);

    const [nome, setNome] = useState('');
    const [modelo, setModelo] = useState<ModeloEscala>(ModeloEscala.COMERCIAL_5X2);
    const [turnos, setTurnos] = useState<Turno[]>([{ ...TURNO_VAZIO }]);
    const [dataReferencia, setDataReferencia] = useState('');
    const [empresaIdForm, setEmpresaIdForm] = useState('');

    const [escalaExpandida, setEscalaExpandida] = useState<string | null>(null);
    const [previsao, setPrevisao] = useState<PrevisaoDia[]>([]);
    const [carregandoPrevisao, setCarregandoPrevisao] = useState(false);

    useEffect(() => {
        if (ehSuperAdmin) {
            empresasApi.listarEmpresas().then(setEmpresas).catch(() => {});
        }
    }, [ehSuperAdmin]);

    async function carregar() {
        if (ehSuperAdmin && !empresaFiltro) {
            setEscalas([]);
            setCarregando(false);
            return;
        }

        setCarregando(true);
        try {
            const dados = await escalasApi.listarEscalas(ehSuperAdmin ? empresaFiltro : undefined);
            setEscalas(dados);
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
        setModelo(ModeloEscala.COMERCIAL_5X2);
        setTurnos([{ ...TURNO_VAZIO }]);
        setDataReferencia('');
        setEmpresaIdForm('');
    }

    function atualizarTurno(indice: number, campo: keyof Turno, valor: string | number) {
        const novos = [...turnos];
        novos[indice] = { ...novos[indice], [campo]: valor };
        setTurnos(novos);
    }

    function adicionarTurno() {
        setTurnos([...turnos, { ...TURNO_VAZIO }]);
    }

    function removerTurno(indice: number) {
        setTurnos(turnos.filter((_, i) => i !== indice));
    }

    async function handleCriar(event: FormEvent) {
        event.preventDefault();
        setErro(null);
        setSucesso(null);

        if (exigeDataReferencia(modelo) && !dataReferencia) {
            setErro('Escalas 24x72 e 12x36 exigem uma data de referência.');
            return;
        }

        setSalvando(true);
        try {
            await escalasApi.criarEscala({
                nome,
                modelo,
                turnos,
                dataReferencia: dataReferencia || null,
                diasSemana: null,
                empresaId: ehSuperAdmin ? empresaIdForm : undefined,
            });

            setSucesso(`Escala "${nome}" cadastrada com sucesso.`);
            limparFormulario();
            await carregar();
        } catch (err) {
            setErro(extrairErro(err).message);
        } finally {
            setSalvando(false);
        }
    }

    async function handleExcluir(escala: Escala) {
        if (!confirm(`Excluir a escala "${escala.nome}"?`)) return;

        setErro(null);
        setSucesso(null);
        try {
            await escalasApi.removerEscala(escala.id);
            await carregar();
        } catch (err) {
            setErro(extrairErro(err).message);
        }
    }

    async function toggleVerPrevisao(escalaId: string) {
        if (escalaExpandida === escalaId) {
            setEscalaExpandida(null);
            return;
        }

        setEscalaExpandida(escalaId);
        setCarregandoPrevisao(true);
        try {
            const hoje = new Date().toISOString().slice(0, 10);
            const dados = await escalasApi.obterPrevisaoEscala(escalaId, hoje, 14);
            setPrevisao(dados);
        } catch {
            setPrevisao([]);
        } finally {
            setCarregandoPrevisao(false);
        }
    }

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-xl font-semibold text-ink">Escalas</h1>
                <p className="mt-1 text-sm text-muted">
                    Cadastre os modelos de escala da empresa e veja a previsão de
                    trabalho para os próximos dias.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
                <form
                    onSubmit={handleCriar}
                    className="h-fit rounded-lg border border-border bg-surface p-5"
                >
                    <p className="mb-4 text-sm font-medium text-ink">Nova escala</p>

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
                            Nome
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
                            Modelo
                        </label>
                        <select
                            value={modelo}
                            onChange={(e) => setModelo(e.target.value as ModeloEscala)}
                            className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                        >
                            {Object.values(ModeloEscala).map((valor) => (
                                <option key={valor} value={valor}>
                                    {NOMES_MODELO[valor]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {exigeDataReferencia(modelo) && (
                        <div className="mb-4">
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Data de referência
                            </label>
                            <input
                                type="date"
                                value={dataReferencia}
                                onChange={(e) => setDataReferencia(e.target.value)}
                                required
                                className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                            />
                            <p className="mt-1 text-xs text-muted">
                                Dia em que o ciclo considera a pessoa trabalhando.
                            </p>
                        </div>
                    )}

                    <div className="mb-5 border-t border-border pt-4">
                        <p className="mb-3 text-sm font-medium text-ink">Turnos</p>

                        {turnos.map((turno, indice) => {
                            const vira = turnoAtravessaMeiaNoite(turno);
                            const duracao = duracaoTurnoMinutos(turno);
                            return (
                                <div
                                    key={indice}
                                    className="mb-3 rounded-sm border border-border p-3"
                                >
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            value={turno.horaInicio}
                                            onChange={(e) =>
                                                atualizarTurno(indice, 'horaInicio', e.target.value)
                                            }
                                            className="flex-1 rounded-sm border border-border bg-canvas px-2 py-1 text-sm text-ink outline-none focus:border-primary"
                                        />
                                        <input
                                            type="time"
                                            value={turno.horaFim}
                                            onChange={(e) =>
                                                atualizarTurno(indice, 'horaFim', e.target.value)
                                            }
                                            className="flex-1 rounded-sm border border-border bg-canvas px-2 py-1 text-sm text-ink outline-none focus:border-primary"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            value={turno.intervaloMinutos}
                                            onChange={(e) =>
                                                atualizarTurno(indice, 'intervaloMinutos', Number(e.target.value))
                                            }
                                            className="w-20 rounded-sm border border-border bg-canvas px-2 py-1 text-sm text-ink outline-none focus:border-primary"
                                        />
                                        {turnos.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removerTurno(indice)}
                                                className="text-sm font-medium text-danger hover:underline"
                                            >
                                                Remover
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-1.5 text-xs text-muted">
                                        {vira ? 'Vira o dia seguinte · ' : ''}
                                        Duração: {formatarDuracao(duracao)}
                                    </p>
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={adicionarTurno}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            + Adicionar turno
                        </button>
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
                        {salvando ? 'Salvando...' : 'Cadastrar escala'}
                    </button>
                </form>

                <div>
                    {ehSuperAdmin && (
                        <div className="mb-4">
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Ver escalas da empresa
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
                        ) : escalas.length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-muted">
                                {ehSuperAdmin && !empresaFiltro
                                    ? 'Escolha uma empresa para ver as escalas dela.'
                                    : 'Nenhuma escala cadastrada ainda.'}
                            </p>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                <tr className="border-b border-border text-muted">
                                    <th className="px-5 py-3 font-medium">Nome</th>
                                    <th className="px-5 py-3 font-medium">Modelo</th>
                                    <th className="px-5 py-3 font-medium">Turnos</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                                </thead>
                                <tbody>
                                {escalas.map((escala) => (
                                    <>
                                        <tr
                                            key={escala.id}
                                            className="border-b border-border last:border-0"
                                        >
                                            <td className="px-5 py-3 text-ink">{escala.nome}</td>
                                            <td className="px-5 py-3 text-muted">
                                                {NOMES_MODELO[escala.modelo]}
                                            </td>
                                            <td className="px-5 py-3 text-muted">
                                                {escala.turnos.length}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => toggleVerPrevisao(escala.id)}
                                                        className="text-sm font-medium text-primary hover:underline"
                                                    >
                                                        {escalaExpandida === escala.id
                                                            ? 'Ocultar'
                                                            : 'Ver previsão'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleExcluir(escala)}
                                                        className="text-sm font-medium text-danger hover:underline"
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {escalaExpandida === escala.id && (
                                            <tr key={`${escala.id}-previsao`}>
                                                <td colSpan={4} className="bg-canvas px-5 py-4">
                                                    <p className="mb-2 text-xs font-medium uppercase text-muted">
                                                        Próximos 14 dias
                                                    </p>
                                                    {carregandoPrevisao ? (
                                                        <p className="text-sm text-muted">
                                                            Carregando...
                                                        </p>
                                                    ) : (
                                                        <ul className="space-y-1">
                                                            {previsao.map((dia) => (
                                                                <li
                                                                    key={dia.data}
                                                                    className={`flex justify-between rounded-sm px-3 py-1.5 text-sm ${
                                                                        dia.trabalha
                                                                            ? 'bg-success/10 text-success'
                                                                            : 'text-muted'
                                                                    }`}
                                                                >
                                  <span>
                                    {new Date(dia.data).toLocaleDateString('pt-BR', {
                                        weekday: 'short',
                                        day: '2-digit',
                                        month: '2-digit',
                                    })}
                                  </span>
                                                                    <span>
                                    {dia.trabalha ? 'Trabalha' : 'Folga'}
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
            </div>
        </div>
    );
}