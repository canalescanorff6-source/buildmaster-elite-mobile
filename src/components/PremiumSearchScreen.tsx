'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Crown,
  Filter,
  History,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Users
} from 'lucide-react';
import type { AppCommand } from '@/components/AppCommandPalette';
import { clearRecentCommandsR152, readRecentCommandIdsR152, recordRecentCommandR152, resolveRecentCommandsR152 } from '@/lib/searchCommandHistoryR152';

type Category = 'todos' | 'jogadores' | 'formacoes' | 'tecnicos' | 'funcoes' | 'habilidades' | 'taticas';

type Props = {
  commands: AppCommand[];
  playerCount: number;
};

const categoryWords: Record<Exclude<Category, 'todos'>, string[]> = {
  jogadores: ['jogador', 'ficha', 'cofre', 'elenco'],
  formacoes: ['formação', 'formacoes', 'time'],
  tecnicos: ['técnico', 'tecnico', 'estilo'],
  funcoes: ['função', 'funcao', 'posição', 'posicao'],
  habilidades: ['habilidade', 'ímpeto', 'impeto'],
  taticas: ['tática', 'tatica', 'partida', 'treino', 'plano']
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function PremiumSearchScreen({ commands, playerCount }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('todos');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [actionStatus, setActionStatus] = useState('');

  useEffect(() => { setRecentIds(readRecentCommandIdsR152()); }, []);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return commands.filter((item) => {
      const haystack = normalize([item.label, item.description, item.group, ...(item.keywords ?? [])].join(' '));
      if (category !== 'todos' && !categoryWords[category].some((word) => haystack.includes(normalize(word)))) return false;
      return !needle || haystack.includes(needle);
    });
  }, [category, commands, query]);

  const recentCommands = useMemo(() => resolveRecentCommandsR152(commands, recentIds), [commands, recentIds]);
  const suggestions = commands.filter((item) => !recentIds.includes(item.id)).slice(0, 4);

  function executeCommand(command: AppCommand): void {
    try {
      const next = recordRecentCommandR152(command.id);
      setRecentIds(next);
      setActionStatus(`Abrindo ${command.label}.`);
      command.run();
    } catch (error) {
      setActionStatus(error instanceof Error ? `Não foi possível abrir ${command.label}: ${error.message}` : `Não foi possível abrir ${command.label}.`);
    }
  }

  function clearRecent(): void {
    clearRecentCommandsR152();
    setRecentIds([]);
    setActionStatus('Histórico de buscas recentes limpo.');
  }

  return (
    <section className="bm32-search-screen" aria-label="Buscar">
      <header className="bm32-screen-heading">
        <div className="bm32-heading-icon"><Search size={28}/></div>
        <div><h1>Buscar</h1><p>Encontre jogadores, formações, técnicos e qualquer função do app.</p></div>
        <span className="bm32-elite-badge"><Crown size={17}/> ELITE</span>
      </header>

      <label className="bm32-global-search">
        <Search size={24}/>
        <span className="sr-only">Buscar em todo o aplicativo</span>
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jogadores, formações, técnicos..."/>
        <Filter size={20}/>
      </label>

      <nav className="bm32-search-categories" aria-label="Categorias da busca">
        <button type="button" className={category === 'todos' ? 'active' : ''} onClick={() => setCategory('todos')}><Search size={16}/> Todos</button>
        <button type="button" className={category === 'jogadores' ? 'active' : ''} onClick={() => setCategory('jogadores')}><Users size={16}/> Jogadores</button>
        <button type="button" className={category === 'formacoes' ? 'active' : ''} onClick={() => setCategory('formacoes')}><Target size={16}/> Formações</button>
        <button type="button" className={category === 'tecnicos' ? 'active' : ''} onClick={() => setCategory('tecnicos')}><UserRound size={16}/> Técnicos</button>
        <button type="button" className={category === 'funcoes' ? 'active' : ''} onClick={() => setCategory('funcoes')}><ShieldCheck size={16}/> Funções</button>
        <button type="button" className={category === 'habilidades' ? 'active' : ''} onClick={() => setCategory('habilidades')}><Sparkles size={16}/> Habilidades</button>
        <button type="button" className={category === 'taticas' ? 'active' : ''} onClick={() => setCategory('taticas')}><Trophy size={16}/> Táticas</button>
      </nav>

      {!query && category === 'todos' && (
        <>
          <section className="bm32-ai-search-card"><span><Bot size={29}/></span><div><strong>Busca contextual ativa</strong><p>Filtramos comandos por termo e categoria para levar você direto à área certa.</p></div><em>Pronta</em></section>
          <section className="bm32-search-block"><header><h2><History size={19}/> Buscas recentes</h2>{recentCommands.length > 0 && <button type="button" onClick={clearRecent}>Limpar</button>}</header><div className="bm32-recent-searches">{recentCommands.slice(0, 4).map((item) => <button type="button" key={item.id} onClick={() => executeCommand(item)}><span><History size={17}/></span><div><strong>{item.label}</strong><small>{item.group}</small></div></button>)}{!recentCommands.length && <span className="bm32-recent-empty">Nenhuma busca recente nesta conta.</span>}</div></section>
          <section className="bm32-search-block"><header><h2><Sparkles size={19}/> Sugestões</h2></header><div className="bm32-recent-searches">{suggestions.map((item) => <button type="button" key={item.id} onClick={() => executeCommand(item)}><span><Sparkles size={17}/></span><div><strong>{item.label}</strong><small>{item.group}</small></div></button>)}</div></section>
        </>
      )}

      <section className="bm32-search-results">
        <header><h2>Resultados</h2><span>{filtered.length} encontrado(s)</span></header>
        <div>
          {filtered.map((item) => <button type="button" key={item.id} onClick={() => executeCommand(item)}><span className="bm32-result-icon"><Search size={20}/></span><span><strong>{item.label}</strong><small>{item.group} • {item.description}</small></span><ArrowRight size={19}/></button>)}
          {!filtered.length && <div className="bm32-empty-state"><Search size={32}/><strong>Nenhum resultado encontrado</strong><span>Tente outro termo ou escolha uma categoria diferente.</span></div>}
        </div>
      </section>
      <span className="sr-only" role="status" aria-live="polite">{actionStatus}</span>
    </section>
  );
}
