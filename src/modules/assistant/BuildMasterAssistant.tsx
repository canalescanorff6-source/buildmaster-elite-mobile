'use client';

import { useMemo, useState } from 'react';
import { Bot, ChevronDown, Send, Sparkles, X } from 'lucide-react';
import { answerCentralAssistant, type IntegratedPlayerRecord, type TeamDiagnosis } from '@/modules/core/centralIntelligence';

const QUICK_QUESTIONS = ['Quem é meu melhor VOL?', 'Qual ficha combina melhor com a 4-2-2-2?', 'Quem joga ao lado do meu Artilheiro?', 'Meu time está muito ofensivo?', 'Quem entra no segundo tempo?', 'Quais cartas precisam de revisão?'];

export function BuildMasterAssistant({ open, onOpenChange, players, team }: { open: boolean; onOpenChange: (value: boolean) => void; players: IntegratedPlayerRecord[]; team: TeamDiagnosis }) {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const suggestion = useMemo(() => answerCentralAssistant('resumo do time', players, team), [players, team]);

  const ask = (value = question) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setHistory((current) => [...current.slice(-5), { question: trimmed, answer: answerCentralAssistant(trimmed, players, team) }]);
    setQuestion('');
  };

  return <>
    <button type="button" className={`v27-assistant-trigger ${open ? 'active' : ''}`} onClick={() => onOpenChange(!open)} aria-expanded={open}><Bot size={21}/><span>Assistente</span><ChevronDown size={16}/></button>
    {open && <aside className="v27-assistant-panel luxury-panel" role="dialog" aria-label="Assistente BuildMaster">
      <header><div><span><Sparkles size={17}/></span><div><strong>Assistente BuildMaster</strong><small>Respostas com os dados do seu app</small></div></div><button type="button" onClick={() => onOpenChange(false)} aria-label="Fechar assistente"><X size={18}/></button></header>
      <div className="v27-assistant-feed">
        {!history.length && <div className="v27-assistant-message assistant"><Bot size={17}/><p>{suggestion}</p></div>}
        {history.map((item, index) => <div key={`${item.question}-${index}`} className="v27-assistant-exchange"><div className="v27-assistant-message user"><p>{item.question}</p></div><div className="v27-assistant-message assistant"><Bot size={17}/><p>{item.answer}</p></div></div>)}
      </div>
      <div className="v27-quick-questions">{QUICK_QUESTIONS.map((item) => <button type="button" key={item} onClick={() => ask(item)}>{item}</button>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); ask(); }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte sobre seu elenco..."/><button type="submit" aria-label="Enviar pergunta"><Send size={17}/></button></form>
    </aside>}
  </>;
}
