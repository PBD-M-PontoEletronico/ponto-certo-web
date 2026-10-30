import { useEffect, type ReactNode } from 'react';
import { IconeFechar } from './NavIcons';

interface ModalProps {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  impedirFechar?: boolean; // ex: enquanto está salvando
  tamanho?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const LARGURA: Record<NonNullable<ModalProps['tamanho']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export function Modal({ titulo, aberto, onFechar, impedirFechar, tamanho = 'md', children }: ModalProps) {
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape' && !impedirFechar) onFechar();
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto, impedirFechar, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => !impedirFechar && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[90vh] w-full ${LARGURA[tamanho]} overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-xl`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <p id="titulo-modal" className="text-base font-semibold text-ink">{titulo}</p>
          <button
            type="button"
            onClick={onFechar}
            disabled={impedirFechar}
            aria-label="Fechar"
            className="text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <IconeFechar />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}