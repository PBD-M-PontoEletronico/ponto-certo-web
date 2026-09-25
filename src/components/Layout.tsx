import { useState, type ComponentType } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERFIL_LABELS, type Perfil } from '../types';
import { ThemeToggle } from './ThemeToggle';
import {
    IconeInicio,
    IconeEmpresas,
    IconeUsuarios,
    IconeSetores,
    IconeAlocacoes,
    IconeEscalas,
    IconeSair,
    IconeMenu,
    IconeFechar,
} from './NavIcons';

const linkBase =
    'flex items-center gap-3 overflow-hidden whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium transition-colors';
const linkAtivo = 'bg-primary text-white';
const linkInativo = 'text-ink/70 hover:bg-primary/5 hover:text-ink';

interface ItemNav {
    to: string;
    label: string;
    icone: ComponentType<{ className?: string }>;
    fim?: boolean;
    perfis?: Perfil[]; // sem essa lista, o item aparece pra todo mundo
}

const itensNav: ItemNav[] = [
    { to: '/', label: 'Início', icone: IconeInicio, fim: true },
    { to: '/empresas', label: 'Empresas', icone: IconeEmpresas, perfis: ['SUPERADMIN'] },
    { to: '/usuarios', label: 'Usuários', icone: IconeUsuarios, perfis: ['SUPERADMIN', 'RH_ADMIN'] },
    { to: '/setores', label: 'Setores', icone: IconeSetores, perfis: ['SUPERADMIN', 'RH_ADMIN'] },
    { to: '/alocacoes', label: 'Alocações', icone: IconeAlocacoes, perfis: ['SUPERADMIN', 'RH_ADMIN'] },
    { to: '/escalas', label: 'Escalas', icone: IconeEscalas, perfis: ['SUPERADMIN', 'RH_ADMIN'] },
];

export function Layout() {
    const { usuario, sair } = useAuth();
    const [menuAberto, setMenuAberto] = useState(false);

    if (!usuario) return null;

    const itensVisiveis = itensNav.filter(
        (item) => !item.perfis || item.perfis.includes(usuario.perfil)
    );

    return (
        <div className="flex min-h-screen bg-canvas">
            {/* Fundo escurecido atrás do menu no mobile — some no desktop */}
            {menuAberto && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    onClick={() => setMenuAberto(false)}
                />
            )}

            {/* Desktop: trilho de 4rem (só ícone), expande no hover por cima do
                conteúdo (position fixed, não empurra nada). Mobile: gaveta que
                entra/sai da tela, controlada pelo botão de menu. */}
            <aside
                className={`group fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-hidden
                    border-r border-border bg-surface transition-transform duration-200
                    ${menuAberto ? 'translate-x-0' : '-translate-x-full'}
                    md:w-16 md:translate-x-0 md:transition-[width] md:duration-200 md:hover:w-60`}
            >
                <div className="flex items-center justify-between gap-2 px-4 py-6">
                    <div className="min-w-0 whitespace-nowrap opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100">
                        <p className="text-lg font-semibold text-primary">PontoCerto</p>
                        <p className="mt-0.5 text-xs text-muted">
                            {PERFIL_LABELS[usuario.perfil]}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMenuAberto(false)}
                        aria-label="Fechar menu"
                        className="shrink-0 text-muted hover:text-ink md:hidden"
                    >
                        <IconeFechar />
                    </button>
                </div>

                <nav className="flex flex-1 flex-col gap-1 px-4">
                    {itensVisiveis.map(({ to, label, icone: Icone, fim }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={fim}
                            onClick={() => setMenuAberto(false)}
                            className={({ isActive }) =>
                                `${linkBase} ${isActive ? linkAtivo : linkInativo}`
                            }
                        >
                            <Icone />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-border px-4 py-4">
                    <div className="mb-2 flex items-center gap-3 overflow-hidden px-1">
                        <ThemeToggle className="shrink-0 rounded-sm border border-border p-1.5 text-ink/70 transition-colors hover:bg-primary/5 hover:text-ink" />
                        <span className="truncate text-xs text-muted">{usuario.nome}</span>
                    </div>
                    <button
                        onClick={sair}
                        className="flex w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-sm px-3 py-1.5 text-left text-sm text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                        <IconeSair />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            <div className="flex flex-1 flex-col md:pl-16">
                <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
                    <button
                        type="button"
                        onClick={() => setMenuAberto(true)}
                        aria-label="Abrir menu"
                        className="text-ink/70 hover:text-ink"
                    >
                        <IconeMenu />
                    </button>
                    <p className="text-sm font-semibold text-primary">PontoCerto</p>
                </header>

                <main className="flex-1 px-6 py-8 md:px-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
