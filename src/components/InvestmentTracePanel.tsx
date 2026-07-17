'use client';

import { Activity, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { AnalysisResult, TrainingKey } from '@/lib/analyzer';

const LABELS: Record<TrainingKey, string> = {
  shooting: 'Finalização', passing: 'Passe', dribbling: 'Drible', dexterity: 'Destreza', lowerBodyStrength: 'Força das pernas', aerialStrength: 'Bola aérea', defending: 'Defendendo', gk1: 'Goleiro 1', gk2: 'Goleiro 2', gk3: 'Goleiro 3'
};

function reasonFor(key: TrainingKey, result: AnalysisResult) {
  const position = result.bestPosition.label;
  const role = result.teamMap?.functionLabel ?? result.buildName;
  const style = result.parsed.playstyle ?? 'estilo não confirmado';
  const reasons: Record<TrainingKey, string> = {
    shooting: `Melhora a capacidade de concluir jogadas na função ${role}, considerando ${position}.`,
    passing: `Sustenta circulação, último passe e saída sob pressão para ${role}.`,
    dribbling: `Ajuda controle, giro e proteção da bola no espaço típico de ${position}.`,
    dexterity: `Ajusta aceleração, equilíbrio e resposta curta exigidos pela função.`,
    lowerBodyStrength: `Equilibra velocidade, resistência e potência sem perseguir apenas GER.`,
    aerialStrength: `Atende duelos, cabeceio e contato quando a função usa bolas altas.`,
    defending: `Reforça leitura, desarme e agressividade para proteger o setor.`,
    gk1: `Prioriza fundamentos de goleiro relacionados à leitura e segurança.`,
    gk2: `Reforça defesa de chutes e resposta em situações de gol.`,
    gk3: `Ajusta alcance e cobertura do goleiro conforme o perfil da carta.`
  };
  return `${reasons[key]} Contexto: ${style}.`;
}

export function InvestmentTracePanel({ result }: { result: AnalysisResult }) {
  const items = (Object.entries(result.training) as Array<[TrainingKey, number]>)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ key, value, cost: result.trainingCost[key] ?? 0, reason: reasonFor(key, result) }));
  return <article className="luxury-panel wide-card investment-trace-panel">
    <div className="section-title-row"><div><p className="kicker"><Activity size={14}/> Rastro da ficha</p><h3>Por que cada ponto foi investido</h3></div><span>{result.trainingPointsUsed}/{result.trainingPointsTotal} pontos</span></div>
    <p className="panel-note">A explicação usa posição escolhida, função, estilo e necessidades da carta. Não é uma justificativa genérica de overall.</p>
    <div className="investment-trace-list">
      {items.map((item) => <div key={item.key}><span><CheckCircle2 size={16}/></span><div><strong>{LABELS[item.key]} +{item.value}</strong><small>{item.cost} ponto(s) de orçamento</small><p>{item.reason}</p></div></div>)}
    </div>
    <footer><ShieldCheck size={15}/><span>{Math.max(0, result.trainingPointsTotal - result.trainingPointsUsed)} ponto(s) restantes; nenhum investimento oculto.</span></footer>
  </article>;
}
