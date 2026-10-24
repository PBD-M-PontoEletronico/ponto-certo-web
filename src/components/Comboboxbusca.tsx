import { useEffect, useRef, useState } from 'react';

export interface OpcaoCombobox {
  id: string;
  label: string;
}

interface ComboboxBuscaProps {
  opcoes: OpcaoCombobox[];
  valor: string;
  onSelecionar: (id: string) => void;
  placeholder?: string;
  opcaoVaziaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function ComboboxBusca({
  opcoes,
  valor,
  onSelecionar,
  placeholder = 'Buscar...',
  opcaoVaziaLabel,
  disabled,
  className,
}: ComboboxBuscaProps) {
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const opcaoSelecionada = opcoes.find((o) => o.id === valor);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
        setTermo('');
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const opcoesFiltradas = opcoes.filter((o) =>
    o.label.toLowerCase().includes(termo.toLowerCase())
  );

  function handleSelecionar(id: string) {
    onSelecionar(id);
    setAberto(false);
    setTermo('');
  }

  const valorExibido = aberto ? termo : (opcaoSelecionada?.label ?? '');

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <input
        value={valorExibido}
        onChange={(e) => setTermo(e.target.value)}
        onFocus={() => {
          if (disabled) return;
          setAberto(true);
          setTermo('');
        }}
        disabled={disabled}
        placeholder={opcaoSelecionada?.label ?? placeholder}
        className="w-full rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary disabled:opacity-50"
      />
      {aberto && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-surface shadow-lg">
          {opcaoVaziaLabel && (
            <li
              onMouseDown={() => handleSelecionar('')}
              className="cursor-pointer px-3 py-2 text-sm text-muted hover:bg-primary/5"
            >
              {opcaoVaziaLabel}
            </li>
          )}
          {opcoesFiltradas.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Nenhum resultado</li>
          ) : (
            opcoesFiltradas.map((o) => (
              <li
                key={o.id}
                onMouseDown={() => handleSelecionar(o.id)}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-primary/5 ${
                  o.id === valor ? 'bg-primary/10 text-primary' : 'text-ink'
                }`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}