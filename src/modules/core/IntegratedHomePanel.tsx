'use client';

import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Keyboard,
  Settings2,
  ShieldCheck,
  Target,
  Trophy,
  Users
} from 'lucide-react';
import type { CentralDashboard, CentralRecommendation, TeamDiagnosis } from '@/modules/core/centralIntelligence';

function recommendation(
  id: string,
  title: string,
  action: CentralRecommendation['action'],
  detail = ''
): CentralRecommendation {
  return { id, title, detail, action, priority: 'info' };
}

export function IntegratedHomePanel({
  dashboard,
  team,
  healthScore,
  lastBackupAt,
  onAction
}: {
  dashboard: CentralDashboard;
  team: TeamDiagnosis;
  healthScore: number;
  lastBackupAt: string | null;
  onAction: (item: CentralRecommendation) => void;
}) {
  const nextStep = dashboard.recommendations[0] ?? null;
  const backupLabel = lastBackupAt
    ? new Date(lastBackupAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : 'Não feito';

  function open(action: CentralRecommendation['action'], id: string, title: string, detail = '') {
    onAction(recommendation(id, title, action, detail));
  }

  return (
    <section className="bm-simple-home" aria-label="Início do BuildMaster">
      <header className="bm-simple-welcome">
        <span className="bm-simple-eyebrow">BuildMaster Elite Tático</span>
        <h1>O que você quer fazer agora?</h1>
        <p>Escolha uma opção. O aplicativo mostra somente o necessário em cada etapa.</p>
      </header>

      <section className="bm-simple-primary-actions" aria-label="Ações principais">
        <button
          type="button"
          className="bm-simple-action bm-simple-action-primary"
          onClick={() => open('reader', 'home-reader', 'Criar ficha por print')}
        >
          <span className="bm-simple-action-icon"><Camera size={28} /></span>
          <span className="bm-simple-action-copy">
            <strong>Criar ficha por print</strong>
            <small>Importe uma imagem, confirme os dados e receba uma ficha final.</small>
          </span>
          <em>Recomendado</em>
          <ArrowRight size={20} />
        </button>

        <button
          type="button"
          className="bm-simple-action"
          onClick={() => open('manual', 'home-manual', 'Criar ficha manualmente')}
        >
          <span className="bm-simple-action-icon"><Keyboard size={27} /></span>
          <span className="bm-simple-action-copy">
            <strong>Preencher manualmente</strong>
            <small>Use quando o print não estiver nítido ou quando preferir digitar.</small>
          </span>
          <ArrowRight size={20} />
        </button>

        <button
          type="button"
          className="bm-simple-action"
          onClick={() => {
            if (dashboard.latestPlayer) {
              onAction({
                id: 'home-continue',
                title: 'Continuar ficha',
                detail: dashboard.latestPlayer.name,
                action: 'result',
                playerId: dashboard.latestPlayer.id,
                priority: 'info'
              });
              return;
            }
            open('players', 'home-players', 'Abrir jogadores');
          }}
        >
          <span className="bm-simple-action-icon"><Trophy size={27} /></span>
          <span className="bm-simple-action-copy">
            <strong>{dashboard.latestPlayer ? `Continuar ${dashboard.latestPlayer.name}` : 'Ver meus jogadores'}</strong>
            <small>{dashboard.latestPlayer ? 'Retome a última ficha que estava usando.' : 'Abra o banco de jogadores salvos.'}</small>
          </span>
          <ArrowRight size={20} />
        </button>
      </section>

      {nextStep && (
        <section className="bm-simple-next-step" aria-label="Próximo passo sugerido">
          <span className="bm-simple-next-icon"><Target size={21} /></span>
          <div>
            <small>Próximo passo sugerido</small>
            <strong>{nextStep.title}</strong>
            <p>{nextStep.detail}</p>
          </div>
          <button type="button" onClick={() => onAction(nextStep)}>Abrir</button>
        </section>
      )}

      <section className="bm-simple-status" aria-label="Resumo rápido">
        <article><Users size={19} /><div><strong>{dashboard.players}</strong><span>jogadores</span></div></article>
        <article><CheckCircle2 size={19} /><div><strong>{dashboard.confirmed}</strong><span>fichas prontas</span></div></article>
        <article><Clock3 size={19} /><div><strong>{backupLabel}</strong><span>último backup</span></div></article>
      </section>

      <section className="bm-simple-shortcuts" aria-label="Outras áreas">
        <div className="bm-simple-section-title">
          <div><span>Outras áreas</span><h2>Acesse somente quando precisar</h2></div>
          <small>{healthScore >= 85 ? <><ShieldCheck size={14} /> Aplicativo protegido</> : 'Manutenção recomendada'}</small>
        </div>
        <div className="bm-simple-shortcut-grid">
          <button type="button" onClick={() => open('team', 'home-team', 'Meu Time')}>
            <Target size={22} /><span><strong>Meu Time</strong><small>Escalação e formação</small></span><ArrowRight size={17} />
          </button>
          <button type="button" onClick={() => open('matches', 'home-matches', 'Partidas')}>
            <Trophy size={22} /><span><strong>Partidas</strong><small>Treinos e avaliação real</small></span><ArrowRight size={17} />
          </button>
          <button type="button" onClick={() => open('settings', 'home-settings', 'Ajustes')}>
            <Settings2 size={22} /><span><strong>Ajustes</strong><small>Conta, backup e atualização</small></span><ArrowRight size={17} />
          </button>
        </div>
      </section>

      <footer className="bm-simple-team-note">
        <span>Formação atual</span><strong>{team.formation}</strong><small>Você pode alterar isso em Meu Time.</small>
      </footer>
    </section>
  );
}
