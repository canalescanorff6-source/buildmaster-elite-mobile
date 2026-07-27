'use client';

import { useMemo, useState } from 'react';
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

type Category = 'todos' | 'jogadores' | 'formacoes' | 'tecnicos' | 'funcoes' | 'habilidades' | 'taticas';

type Props = {
  commands: AppCommand[];
  playerCount: number;
  onClose?: () => void;
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

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return commands.filter((item) => {
      const haystack = normalize([item.label, item.description, item.group, ...(item.keywords ?? [])].join(' '));
      if (category !== 'todos' && !categoryWords[category].some((word) => haystack.includes(normalize(word)))) return false;
      return !needle || haystack.includes(needle);
    });
  }, [category, commands, query]);

  const suggestions = commands.slice(0, 4);

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
          <section className="bm32-ai-search-card"><span><Bot size={29}/></span><div><strong>Busca inteligente ativa</strong><p>Entendemos o contexto e mostramos as áreas mais relevantes para você.</p></div><em>Aprendendo...</em></section>
          <section className="bm32-search-block"><header><h2><History size={19}/> Buscas recentes</h2><button type="button">Ver todas</button></header><div className="bm32-recent-searches">{suggestions.map((item) => <button type="button" key={item.id} onClick={item.run}><span><Search size={17}/></span><div><strong>{item.label}</strong><small>{item.group}</small></div></button>)}</div></section>
          <section className="bm32-search-block"><header><h2><Sparkles size={19}/> Sugestões inteligentes</h2></header><div className="bm32-suggestion-grid"><article><Users size={22}/><strong>Jogadores especiais</strong><span>{playerCount} cartas no catálogo</span></article><article><Target size={22}/><strong>Formações populares</strong><span>Compare encaixes do elenco</span></article><article><ShieldCheck size={22}/><strong>Táticas vencedoras</strong><span>Planos com validação real</span></article><article><Trophy size={22}/><strong>Guias e conteúdos</strong><span>Aprenda e evolua a equipe</span></article></div></section>
        </>
      )}

      <section className="bm32-search-results">
        <header><h2>Resultados</h2><span>{filtered.length} encontrado(s)</span></header>
        <div>
          {filtered.map((item) => <button type="button" key={item.id} onClick={item.run}><span className="bm32-result-icon"><Search size={20}/></span><span><strong>{item.label}</strong><small>{item.group} • {item.description}</small></span><ArrowRight size={19}/></button>)}
          {!filtered.length && <div className="bm32-empty-state"><Search size={32}/><strong>Nenhum resultado encontrado</strong><span>Tente outro termo ou escolha uma categoria diferente.</span></div>}
        </div>
      </section>
    </section>
  );
}
