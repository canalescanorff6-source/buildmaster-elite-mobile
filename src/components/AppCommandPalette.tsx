'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';

export type AppCommand = {
  id: string;
  label: string;
  description: string;
  group: string;
  keywords?: string[];
  run: () => void;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: AppCommand[];
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function AppCommandPalette({ open, onOpenChange, commands }: Props) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return commands;
    return commands.filter((item) => normalize([item.label, item.description, item.group, ...(item.keywords ?? [])].join(' ')).includes(needle));
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setQuery('');
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (activeIndex < filtered.length) return;
    setActiveIndex(Math.max(0, filtered.length - 1));
  }, [activeIndex, filtered.length]);

  if (!open) return null;

  function execute(command: AppCommand | undefined) {
    if (!command) return;
    onOpenChange(false);
    window.setTimeout(command.run, 0);
  }

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onOpenChange(false); }}>
      <section className="command-palette-dialog" role="dialog" aria-modal="true" aria-labelledby="command-palette-title" onKeyDown={(event) => {
        if (event.key === 'Escape') onOpenChange(false);
        if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((value) => Math.min(filtered.length - 1, value + 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((value) => Math.max(0, value - 1)); }
        if (event.key === 'Enter') { event.preventDefault(); execute(filtered[activeIndex]); }
      }}>
        <header className="command-palette-search">
          <Search size={19} />
          <div>
            <label id="command-palette-title" htmlFor="command-palette-input">Buscar no BuildMaster</label>
            <input ref={inputRef} id="command-palette-input" value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} placeholder="Ex.: nova ficha, backup, meu time..." autoComplete="off" />
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Fechar busca"><X size={18} /></button>
        </header>

        <div className="command-palette-results" role="listbox" aria-label="Resultados da busca">
          {filtered.length ? filtered.map((item, index) => (
            <button key={item.id} type="button" role="option" aria-selected={activeIndex === index} className={activeIndex === index ? 'is-active' : ''} onMouseEnter={() => setActiveIndex(index)} onClick={() => execute(item)}>
              <span><small>{item.group}</small><strong>{item.label}</strong><em>{item.description}</em></span>
              <ArrowRight size={17} />
            </button>
          )) : <div className="command-palette-empty"><Search size={24} /><strong>Nenhuma área encontrada</strong><span>Tente buscar por ficha, jogador, time, partida, backup ou atualização.</span></div>}
        </div>

        <footer><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></footer>
      </section>
    </div>
  );
}
