'use client';

import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, Database, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analyzer';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import {
  buildGameplayScoutingRecordR454,
  evaluateContextualTacticalFitR454,
  type GameplayScoutingRecordR454
} from '@/lib/gameplayScoutingR454';
import {
  appendUserGameplayFeedbackR454,
  getGameplayScoutingRecordR454,
  saveGameplayScoutingRecordR454
} from '@/lib/gameplayScoutingStoreR454';

function sourceLabel(type: GameplayScoutingRecordR454['sourceTypes'][number]) {
  return ({
    OFFICIAL: 'DADOS OFICIAIS',
    DATABASE: 'BANCO DE DADOS',
    REVIEWER: 'SCOUTING / REVIEW',
    COMMUNITY: 'COMUNIDADE',
    USER_GAMEPLAY: 'MEUS TESTES'
  } as const)[type];
}

export function GameplayScoutingR454Card({ result }: { result: AnalysisResult }) {
  const preview = useMemo(() => buildGameplayScoutingRecordR454(result), [result]);
  const [record, setRecord] = useState<GameplayScoutingRecordR454>(preview);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const stored = getGameplayScoutingRecordR454(preview.cardId);
    const next = stored
      ? buildGameplayScoutingRecordR454(result, stored.sources.filter((item) => item.type !== 'OFFICIAL'), stored.gameVersion)
      : preview;
    setRecord(next);
    if (!stored) saveGameplayScoutingRecordR454(next);
  }, [preview.cardId, result]);

  const fit = useMemo(() => {
    const position = analysisUsagePositionR138(result);
    return evaluateContextualTacticalFitR454(result, {
      formationId: String(result.tacticalProfile?.formation ?? '4-2-2-2'),
      targetPosition: position,
      teamStyle: result.tacticalProfile?.style ?? 'POSSE_DE_BOLA',
      partners: []
    });
  }, [result]);

  const saveFeedback = () => {
    const clean = feedback.trim();
    if (!clean) return;
    setRecord(appendUserGameplayFeedbackR454(result, clean));
    setFeedback('');
  };

  return (
    <article className="luxury-panel wide-card">
      <div className="section-title-row">
        <div>
          <p className="kicker">Gameplay Scouting • R454</p>
          <h3>Gameplay + função + encaixe contextual</h3>
        </div>
        <span>{record.status.replaceAll('_', ' ')}</span>
      </div>

      <p className="panel-note">
        Card ID: <b>{record.cardId}</b> • eFootball {record.gameVersion} • Confiança <b>{record.confidence}</b>.
        O GER/OVR não participa do Fit Tático.
      </p>

      <div className="skill-grid">
        <div className="skill-check-card">
          <strong><BrainCircuit size={16} /> Tactical Fit neste contexto</strong>
          <span><b>{fit.label}</b> • {fit.targetPositionLabel} • {fit.formationId}</span>
          <span>Função: {fit.recommendedRole ?? 'confirmar função'}</span>
          <span>Estilo: {fit.styleName ?? 'não identificado'} • {fit.styleActivation}</span>
          {fit.styleActivation === 'INATIVO' && <span><ShieldAlert size={14} /> ESTILO INATIVO NESTA POSIÇÃO</span>}
        </div>

        <div className="skill-check-card">
          <strong><Sparkles size={16} /> Funções e formações</strong>
          <span>Melhores funções: {record.bestRoles.join(', ') || 'scouting pendente'}</span>
          <span>Formações compatíveis: {record.bestFormations.join(', ') || 'scouting pendente'}</span>
          <span>Parceiros: {record.bestPartners.join(', ') || 'depende do contexto do XI'}</span>
        </div>

        <div className="skill-check-card">
          <strong><Database size={16} /> Fontes separadas</strong>
          {record.sourceTypes.map((type) => <span key={type}><CheckCircle2 size={14} /> {sourceLabel(type)}</span>)}
          {record.conflicts.length > 0 && <span><ShieldAlert size={14} /> SOURCE_CONFLICT: {record.conflicts.length}</span>}
        </div>

        <div className="skill-check-card">
          <strong>5 habilidades adicionais</strong>
          {record.recommendedSkills.length
            ? record.recommendedSkills.map((skill, index) => <span key={skill}>{index + 1}. {skill}</span>)
            : <span>Aguardando ficha completa.</span>}
        </div>
      </div>

      <div className="chip-cloud">
        {fit.reasons.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
      </div>
      {fit.warnings.map((item) => <p className="panel-note" key={item}>⚠ {item}</p>)}

      <div className="skill-check-card">
        <strong><MessageSquare size={16} /> Meus testes</strong>
        <p className="panel-note">Registre observações como “essa carta está pesada”, “intercepta muito”, “essa dupla funcionou” ou “some do jogo”. Isso entra como USER_GAMEPLAY e não sobrescreve dados oficiais.</p>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Adicionar feedback desta carta..."
          rows={3}
          style={{ width: '100%', resize: 'vertical' }}
        />
        <button className="primary-button" type="button" onClick={saveFeedback} disabled={!feedback.trim()}>
          Salvar feedback de gameplay
        </button>
      </div>
    </article>
  );
}
