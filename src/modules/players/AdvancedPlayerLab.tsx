'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { CheckCircle2, Download, History, RotateCcw, Save, SlidersHorizontal, Sparkles, Star, Target, Trash2 } from 'lucide-react';
import type { IntegratedPlayerRecord } from '@/modules/core/centralIntelligence';
import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import { readOfficialRulePack } from '@/modules/rules/officialRuleRegistry';
import { TRAINING_LABELS } from '@/lib/trainingEngine';
import {
  PLAYER_LAB_TRAINING_KEYS,
  buildAdvancedPlayerLaboratory,
  createPlayerLabSnapshot,
  normalizePlayerLabPlan,
  type PlayerLabProfileId,
  type PlayerLabSnapshot
} from './advancedPlayerLaboratory';

const HISTORY_KEY = 'buildmaster_player_lab_history_v2940';
const TEMPLATE_KEY = 'buildmaster_player_lab_templates_v2940';

function readSnapshots(key: string): PlayerLabSnapshot[] {
  try {
    const parsed: unknown = JSON.parse(readAccountStorage(key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is PlayerLabSnapshot => Boolean(item && typeof item === 'object' && 'id' in item && 'customTraining' in item)) : [];
  } catch {
    return [];
  }
}

function radarPoints(values: number[], radius = 78, center = 90): string {
  return values.map((value, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / values.length);
    const scaled = radius * Math.max(0, Math.min(100, value)) / 100;
    return `${(center + Math.cos(angle) * scaled).toFixed(1)},${(center + Math.sin(angle) * scaled).toFixed(1)}`;
  }).join(' ');
}

function downloadReport(player: IntegratedPlayerRecord, report: ReturnType<typeof buildAdvancedPlayerLaboratory>) {
  const payload = {
    app: 'BuildMaster Elite Tático',
    version: report.version,
    exportedAt: new Date().toISOString(),
    player: {
      id: report.playerId,
      name: report.playerName,
      originalPosition: player.cardPosition,
      selectedPosition: player.targetPosition,
      playstyle: player.playstyle
    },
    report
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `laboratorio-${player.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'jogador'}-v2940.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdvancedPlayerLab({ player }: { player: IntegratedPlayerRecord }) {
  const [customTraining, setCustomTraining] = useState(() => normalizePlayerLabPlan(player.result.training));
  const [selectedProfiles, setSelectedProfiles] = useState<PlayerLabProfileId[]>(['competitive', 'balanced', 'offensive', 'personalized']);
  const [history, setHistory] = useState<PlayerLabSnapshot[]>(() => readSnapshots(HISTORY_KEY));
  const [templates, setTemplates] = useState<PlayerLabSnapshot[]>(() => readSnapshots(TEMPLATE_KEY));
  const [snapshotLabel, setSnapshotLabel] = useState('Minha ficha personalizada');
  const [message, setMessage] = useState('Ajuste os níveis e compare até quatro propostas sem modificar a ficha salva.');

  useEffect(() => {
    setCustomTraining(normalizePlayerLabPlan(player.result.training));
  }, [player.id, player.result.training]);

  const report = useMemo(() => buildAdvancedPlayerLaboratory(player.result, customTraining), [player.result, customTraining]);
  const comparedProfiles = report.profiles.filter((profile) => selectedProfiles.includes(profile.id));
  const personalized = report.profiles.find((profile) => profile.id === 'personalized') ?? report.profiles[0];
  const playerHistory = history.filter((item) => item.playerId === player.id);
  const playerTemplates = templates.filter((item) => item.playerId === player.id || item.favorite);

  function toggleProfile(id: PlayerLabProfileId) {
    setSelectedProfiles((current) => {
      if (current.includes(id)) return current.length === 1 ? current : current.filter((item) => item !== id);
      return current.length >= 4 ? current : [...current, id];
    });
  }

  function saveVersion(favorite = false) {
    const snapshot = createPlayerLabSnapshot({
      result: player.result,
      label: snapshotLabel,
      favorite,
      selectedProfiles,
      customTraining: personalized.training,
      rulePackVersion: readOfficialRulePack().version
    });
    const next = [snapshot, ...history.filter((item) => item.id !== snapshot.id)].slice(0, 40);
    setHistory(next);
    writeAccountStorage(HISTORY_KEY, JSON.stringify(next));
    if (favorite) {
      const nextTemplates = [snapshot, ...templates.filter((item) => !(item.playerId === snapshot.playerId && item.label === snapshot.label))].slice(0, 20);
      setTemplates(nextTemplates);
      writeAccountStorage(TEMPLATE_KEY, JSON.stringify(nextTemplates));
    }
    setMessage(favorite ? 'Modelo favorito salvo. Nada foi aplicado automaticamente à ficha atual.' : 'Versão salva no histórico local do jogador.');
  }

  function restoreSnapshot(snapshot: PlayerLabSnapshot) {
    setCustomTraining(normalizePlayerLabPlan(snapshot.customTraining));
    setSelectedProfiles(snapshot.selectedProfiles.length ? snapshot.selectedProfiles : ['competitive', 'personalized']);
    setSnapshotLabel(snapshot.label);
    setMessage(`Versão “${snapshot.label}” carregada apenas no simulador. Confirme antes de usar fora do laboratório.`);
  }

  function removeSnapshot(snapshot: PlayerLabSnapshot) {
    const nextHistory = history.filter((item) => item.id !== snapshot.id);
    const nextTemplates = templates.filter((item) => item.id !== snapshot.id);
    setHistory(nextHistory);
    setTemplates(nextTemplates);
    writeAccountStorage(HISTORY_KEY, JSON.stringify(nextHistory));
    writeAccountStorage(TEMPLATE_KEY, JSON.stringify(nextTemplates));
  }

  const radarPolygon = radarPoints(report.radar.map((axis) => axis.value));

  return <section className="bm2940-player-lab luxury-panel" aria-labelledby="bm2940-player-lab-title">
    <div className="bm2940-heading">
      <div><p className="kicker"><Sparkles size={15}/> Bloco 19</p><h3 id="bm2940-player-lab-title">Laboratório avançado de jogadores</h3><span>Compare fichas, simule pontos, veja limites e salve versões sem substituir o resultado original.</span></div>
      <strong>v{report.version}</strong>
    </div>

    <div className="bm2940-lab-summary">
      <article><span>Jogador</span><strong>{player.name}</strong><small>{player.cardPosition} → {player.targetPosition}</small></article>
      <article><span>Função</span><strong>{report.tacticalUse.functionLabel}</strong><small>{player.playstyle}</small></article>
      <article><span>Uso ideal</span><strong>{report.tacticalUse.verdict}</strong><small>Titular {report.tacticalUse.starterScore} • Banco {report.tacticalUse.benchScore}</small></article>
      <article><span>Base ativa</span><strong>{readOfficialRulePack().version}</strong><small>regras usadas nesta simulação</small></article>
    </div>

    <div className="bm2940-profile-selector" role="group" aria-label="Fichas comparadas">
      {report.profiles.map((profile) => <button type="button" key={profile.id} className={selectedProfiles.includes(profile.id) ? 'active' : ''} onClick={() => toggleProfile(profile.id)}><span>{selectedProfiles.includes(profile.id) ? <CheckCircle2 size={15}/> : <Target size={15}/>} {profile.title}</span><strong>{profile.score}/100</strong><small>{profile.pointsUsed}/{player.result.trainingPointsTotal} pontos</small></button>)}
    </div>

    <div className="bm2940-comparison-table" role="region" aria-label="Comparação de fichas">
      <div className="bm2940-comparison-head"><span>Grupo</span>{comparedProfiles.map((profile) => <strong key={profile.id}>{profile.title}</strong>)}</div>
      {PLAYER_LAB_TRAINING_KEYS.filter((key) => comparedProfiles.some((profile) => profile.training[key] > 0)).map((key) => <div key={key}><span>{TRAINING_LABELS[key]}</span>{comparedProfiles.map((profile) => <b key={`${profile.id}-${key}`}>{profile.training[key]}</b>)}</div>)}
      <div className="bm2940-comparison-score"><span>Qualidade</span>{comparedProfiles.map((profile) => <b key={profile.id}>{profile.score}</b>)}</div>
    </div>

    <div className="bm2940-lab-grid">
      <article className="bm2940-simulator">
        <div className="bm2940-card-title"><div><SlidersHorizontal size={18}/><strong>Simulador personalizado</strong></div><span>{personalized.pointsUsed}/{player.result.trainingPointsTotal} pts</span></div>
        <p>O custo progressivo é recalculado em tempo real. Quando a proposta ultrapassa o orçamento, o motor reduz primeiro os grupos menos prioritários.</p>
        <div className="bm2940-slider-list">
          {PLAYER_LAB_TRAINING_KEYS.filter((key) => player.result.bestPosition.code === 'GK' ? key.startsWith('gk') || key === 'aerialStrength' || key === 'lowerBodyStrength' : !key.startsWith('gk')).map((key) => <label key={key}><span>{TRAINING_LABELS[key]} <b>+{customTraining[key]}</b></span><input type="range" min="0" max="16" value={customTraining[key]} onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomTraining((current) => ({ ...current, [key]: Number(event.target.value) }))}/></label>)}
        </div>
        <div className="bm2940-simulator-actions"><button type="button" onClick={() => setCustomTraining(normalizePlayerLabPlan(player.result.training))}><RotateCcw size={16}/> Restaurar ficha atual</button><button type="button" onClick={() => downloadReport(player, report)}><Download size={16}/> Exportar estudo</button></div>
      </article>

      <article className="bm2940-radar-card">
        <div className="bm2940-card-title"><div><Target size={18}/><strong>Radar tático</strong></div><span>{report.tacticalUse.mainPosition}</span></div>
        <svg viewBox="0 0 180 180" role="img" aria-label="Radar de atributos táticos">
          {[20, 40, 60, 80, 100].map((level) => <polygon key={level} points={radarPoints(report.radar.map(() => level))} className="grid"/>)}
          <polygon points={radarPolygon} className="value"/>
          {report.radar.map((axis, index) => {
            const angle = -Math.PI / 2 + index * (Math.PI * 2 / report.radar.length);
            const x = 90 + Math.cos(angle) * 83;
            const y = 90 + Math.sin(angle) * 83;
            return <text key={axis.id} x={x} y={y} textAnchor={x < 75 ? 'end' : x > 105 ? 'start' : 'middle'} dominantBaseline="middle">{axis.label} {axis.value}</text>;
          })}
        </svg>
        <div className="bm2940-style-fit">{report.tacticalUse.styleFits.map((style) => <span key={style.id}><b>{style.label}</b><em>{style.score}/100</em><small>{style.note}</small></span>)}</div>
      </article>
    </div>

    <div className="bm2940-intelligence-grid">
      <article><div className="bm2940-card-title"><div><Target size={18}/><strong>Limites e retorno</strong></div><span>{report.thresholds.length}</span></div>{report.thresholds.map((item) => <span key={item.training} className={`state-${item.status}`}><b>{item.label} +{item.currentLevel}</b><em>{item.returnLabel} • próximo custa {item.nextPointCost}</em><small>{item.note}</small></span>)}</article>
      <article><div className="bm2940-card-title"><div><Sparkles size={18}/><strong>Habilidades beneficiadas</strong></div><span>{report.skillImpacts.length}</span></div>{report.skillImpacts.map((item) => <span key={item.name} className={`skill-${item.status.replace(' ', '-')}`}><b>{item.name}</b><em>{item.status}</em><small>{item.note}</small></span>)}</article>
      <article><div className="bm2940-card-title"><div><Target size={18}/><strong>Posições e uso</strong></div><span>{report.tacticalUse.verdict}</span></div><span><b>Principal</b><em>{report.tacticalUse.mainPosition}</em><small>Escolha do usuário preservada.</small></span>{report.tacticalUse.alternativePositions.map((position) => <span key={position.code}><b>{position.label}</b><em>{position.score}/100</em><small>Alternativa sugerida, nunca aplicada automaticamente.</small></span>)}</article>
    </div>

    <div className="bm2940-history-grid">
      <article>
        <div className="bm2940-card-title"><div><History size={18}/><strong>Histórico de versões</strong></div><span>{playerHistory.length}</span></div>
        <label className="bm2940-version-name"><span>Nome da versão</span><input value={snapshotLabel} onChange={(event: ChangeEvent<HTMLInputElement>) => setSnapshotLabel(event.target.value)} maxLength={60}/></label>
        <div className="bm2940-save-actions"><button type="button" onClick={() => saveVersion(false)}><Save size={16}/> Salvar versão</button><button type="button" onClick={() => saveVersion(true)}><Star size={16}/> Salvar como modelo</button></div>
        <div className="bm2940-history-list">{playerHistory.slice(0, 8).map((snapshot) => <div key={snapshot.id}><button type="button" onClick={() => restoreSnapshot(snapshot)}><strong>{snapshot.label}</strong><span>{new Date(snapshot.createdAt).toLocaleString('pt-BR')}</span><small>{snapshot.customPointsUsed} pts • regras {snapshot.rulePackVersion}</small></button><button type="button" aria-label={`Excluir ${snapshot.label}`} onClick={() => removeSnapshot(snapshot)}><Trash2 size={15}/></button></div>)}{!playerHistory.length && <p>Nenhuma versão salva para este jogador.</p>}</div>
      </article>
      <article>
        <div className="bm2940-card-title"><div><Star size={18}/><strong>Modelos favoritos</strong></div><span>{playerTemplates.length}</span></div>
        <div className="bm2940-template-list">{playerTemplates.slice(0, 8).map((snapshot) => <button type="button" key={snapshot.id} onClick={() => restoreSnapshot(snapshot)}><Star size={15}/><div><strong>{snapshot.label}</strong><span>{snapshot.playerName} • {snapshot.customPointsUsed} pts</span></div></button>)}{!playerTemplates.length && <p>Salve uma versão como modelo para reutilizar a distribuição.</p>}</div>
        <div className="bm2940-safeguards">{report.safeguards.map((item) => <span key={item}><CheckCircle2 size={14}/>{item}</span>)}</div>
      </article>
    </div>

    <p className="bm2940-message" role="status">{message}</p>
  </section>;
}
