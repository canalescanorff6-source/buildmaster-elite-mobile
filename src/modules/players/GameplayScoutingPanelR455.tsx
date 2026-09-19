'use client';

import { useMemo, useState } from 'react';
import { Activity, BookOpen, BrainCircuit, Link2, Network, ShieldCheck, Sparkles } from 'lucide-react';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';
import { evaluateTacticalFitR454 } from '@/modules/scouting/gameplayScoutingR454';
import { readGameplayScoutingForResultR454 } from '@/modules/scouting/gameplayScoutingRepositoryR454';

type ScoutingTabR455 = 'visao' | 'gameplay' | 'funcoes' | 'builds' | 'formacoes' | 'sinergias' | 'fontes';

const tabs: Array<{ id: ScoutingTabR455; label: string }> = [
  { id: 'visao', label: 'Visão geral' },
  { id: 'gameplay', label: 'Gameplay' },
  { id: 'funcoes', label: 'Funções' },
  { id: 'builds', label: 'Builds' },
  { id: 'formacoes', label: 'Formações' },
  { id: 'sinergias', label: 'Sinergias' },
  { id: 'fontes', label: 'Fontes' }
];

function TextList({ values, empty }: { values: string[]; empty: string }) {
  if (!values.length) return <p>{empty}</p>;
  return <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul>;
}

export function GameplayScoutingPanelR455({ player }: { player: IntegratedPlayerRecord }) {
  const [tab, setTab] = useState<ScoutingTabR455>('visao');
  const scouting = useMemo(() => readGameplayScoutingForResultR454(player.result), [player.result]);
  const position = player.result.bestPosition?.code ?? player.result.parsed.mainPosition;
  const fit = useMemo(() => evaluateTacticalFitR454(player.result, {
    position,
    formationId: player.result.tacticalProfile?.formation ?? null,
    teamStyle: player.result.tacticalProfile?.style ?? 'AUTO',
    desiredFunctions: [player.functionLabel].filter(Boolean)
  }, scouting), [player.functionLabel, player.result, position, scouting]);

  return (
    <details className="luxury-panel" data-r455-gameplay-scouting>
      <summary>
        <span><BrainCircuit size={18}/> <strong>GAMEPLAY SCOUTING</strong></span>
        <small>{scouting.status === 'READY' ? `Confiança ${scouting.confidence}` : scouting.status === 'SOURCE_CONFLICT' ? 'SOURCE_CONFLICT' : 'SCOUTING PENDENTE'}</small>
      </summary>

      <div>
        <nav className="bm32-category-tabs" role="tablist" aria-label={`Gameplay Scouting de ${player.name}`}>
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'visao' && (
          <section aria-label="Visão geral do scouting">
            <p><ShieldCheck size={16}/> <strong>{fit.label}</strong> • Tactical Fit {fit.score}/100 em {position}</p>
            <p>{fit.reasons[0]}</p>
            <p><strong>Card ID:</strong> {scouting.cardId}</p>
            <p><strong>Versão da carta:</strong> {scouting.playerVersion} • <strong>jogo:</strong> {scouting.gameVersion}</p>
            <p><strong>Estilo:</strong> {scouting.activePlaystyle || 'não confirmado'}{fit.activePlaystyle === false ? ' — ESTILO INATIVO NESTA POSIÇÃO' : ''}</p>
            <TextList values={fit.warnings} empty="Sem alerta contextual confirmado."/>
          </section>
        )}

        {tab === 'gameplay' && (
          <section aria-label="Comportamento de gameplay">
            <p><Activity size={16}/> Evidência comportamental separada dos dados oficiais.</p>
            <strong>Sem bola</strong><TextList values={scouting.offBallBehaviour} empty="Sem observação confirmada."/>
            <strong>Construção</strong><TextList values={scouting.buildUpBehaviour} empty="Sem observação confirmada."/>
            <strong>Resistência à pressão</strong><TextList values={scouting.pressResistance} empty="Sem observação confirmada."/>
            <strong>Passe</strong><TextList values={scouting.passingBehaviour} empty="Sem observação confirmada."/>
            <strong>Drible</strong><TextList values={scouting.dribblingBehaviour} empty="Sem observação confirmada."/>
            <strong>Finalização</strong><TextList values={scouting.finishingBehaviour} empty="Sem observação confirmada."/>
            <strong>Defesa</strong><TextList values={scouting.defensiveBehaviour} empty="Sem observação confirmada."/>
            <strong>Transição</strong><TextList values={scouting.transitionBehaviour} empty="Sem observação confirmada."/>
          </section>
        )}

        {tab === 'funcoes' && (
          <section aria-label="Funções recomendadas">
            <strong>Melhores funções</strong>
            {scouting.bestRoles.length ? <ul>{scouting.bestRoles.map((role) => <li key={role.id}>{role.position} • {role.function} • {role.fit} — {role.reason}</li>)}</ul> : <p>Scouting pendente para esta versão da carta.</p>}
            <strong>Aceitáveis</strong>
            {scouting.acceptableRoles.length ? <ul>{scouting.acceptableRoles.map((role) => <li key={role.id}>{role.position} • {role.function} • {role.fit}</li>)}</ul> : <p>Nenhuma função adicional confirmada.</p>}
            <strong>Evitar</strong>
            {scouting.badRoles.length ? <ul>{scouting.badRoles.map((role) => <li key={role.id}>{role.position} • {role.function} • {role.fit}</li>)}</ul> : <p>Nenhuma incompatibilidade de função registrada.</p>}
          </section>
        )}

        {tab === 'builds' && (
          <section aria-label="Builds e habilidades">
            <p><Sparkles size={16}/> A ficha continua subordinada à função e ao DNA da carta; o scouting não substitui a autoridade de progressão.</p>
            <strong>Builds recomendadas</strong><TextList values={scouting.recommendedBuilds} empty={player.buildName ? `Build atual: ${player.buildName}` : 'Nenhuma build de scouting confirmada.'}/>
            <strong>5 habilidades adicionais</strong><TextList values={scouting.recommendedSkills.slice(0, 5)} empty="Nenhuma habilidade adicional confirmada."/>
          </section>
        )}

        {tab === 'formacoes' && (
          <section aria-label="Formações">
            <strong>Melhores formações</strong><TextList values={scouting.bestFormations} empty="Sem formação confirmada pelo scouting."/>
            <strong>Evitar</strong><TextList values={scouting.badFormations} empty="Nenhuma formação marcada para evitar."/>
            <strong>Sinergia com treinador</strong><TextList values={scouting.coachSynergies} empty="Sem evidência confirmada."/>
          </section>
        )}

        {tab === 'sinergias' && (
          <section aria-label="Sinergias">
            <p><Network size={16}/> A avaliação depende dos parceiros e da formação, não de ranking universal.</p>
            <strong>Melhores parceiros</strong><TextList values={scouting.bestPartners} empty="Sem parceiro confirmado."/>
            <strong>Parceiros problemáticos</strong><TextList values={scouting.badPartners} empty="Nenhum conflito de parceiro registrado."/>
            <strong>Sinergias de formação</strong><TextList values={scouting.formationSynergies} empty="Sem sinergia específica registrada."/>
            <strong>Sinergias de estilo</strong><TextList values={scouting.playstyleSynergies} empty="Sem sinergia específica registrada."/>
          </section>
        )}

        {tab === 'fontes' && (
          <section aria-label="Fontes do scouting">
            <p><BookOpen size={16}/> Dados oficiais, bancos, reviews, comunidade e testes pessoais permanecem separados.</p>
            {scouting.sources.length ? <ul>{scouting.sources.map((source) => <li key={source.id}><strong>{source.type}</strong> • {source.label} • versão {source.gameVersion} • confiança {source.confidence}{source.url ? <> • <span><Link2 size={13}/> {source.url}</span></> : null}</li>)}</ul> : <p>SCOUTING PENDENTE — nenhuma fonte validada para esta edição da carta.</p>}
            {scouting.conflicts.length ? <><strong>Conflitos</strong><ul>{scouting.conflicts.map((conflict) => <li key={conflict.id}>SOURCE_CONFLICT • {conflict.field}: {conflict.sourceA} x {conflict.sourceB} • decisão: {conflict.adoptedDecision || 'pendente'} • confiança {conflict.confidence}</li>)}</ul></> : null}
            {scouting.userFeedback.length ? <><strong>MEUS TESTES</strong><ul>{scouting.userFeedback.map((feedback) => <li key={feedback.id}>{feedback.note} • {feedback.gameVersion}</li>)}</ul></> : null}
          </section>
        )}
      </div>
    </details>
  );
}
