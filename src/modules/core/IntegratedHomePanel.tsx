'use client';

import {
  ArrowRight,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Clock3,
  Gamepad2,
  Gauge,
  Keyboard,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wand2
} from 'lucide-react';
import type { CentralDashboard, CentralRecommendation, TeamDiagnosis } from '@/modules/core/centralIntelligence';

function recommendation(
  id: string,
  title: string,
  action: CentralRecommendation['action'],
  detail = '',
  playerId?: string
): CentralRecommendation {
  return { id, title, detail, action, playerId, priority: 'info' };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BM';
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
  const latest = dashboard.latestPlayer;

  function open(action: CentralRecommendation['action'], id: string, title: string, detail = '', playerId?: string) {
    onAction(recommendation(id, title, action, detail, playerId));
  }

  function openLatestResult(id: string, title: string) {
    if (latest) {
      open('result', id, title, latest.name, latest.id);
      return;
    }
    open('reader', `${id}-reader`, 'Ler primeira carta', 'Adicione uma carta para liberar esta análise.');
  }

  return (
    <section className="bm-premium-dashboard" aria-label="Início premium do Marques Fichas">
      <header className="bm-premium-dashboard-heading">
        <div>
          <span><Sparkles size={14} /> Central Elite</span>
          <h1>Seu time, suas fichas e sua estratégia em um só lugar.</h1>
          <p>Interface direta, recursos organizados e inteligência tática sem esconder as funções importantes.</p>
        </div>
        <div className="bm-premium-health-pill">
          <ShieldCheck size={17} />
          <div><strong>{healthScore}/100</strong><small>saúde do app</small></div>
        </div>
      </header>

      <section className="bm-premium-reader-hero" aria-label="Leitor inteligente de cartas">
        <div className="bm-premium-reader-copy">
          <span className="bm-premium-kicker"><Camera size={15} /> Leitor inteligente</span>
          <h2>Transforme um print em uma ficha competitiva completa.</h2>
          <p>O app lê a carta, recorta a imagem, confirma os dados e calcula ficha, habilidades e Ímpeto no mesmo fluxo.</p>
          <div className="bm-premium-reader-actions">
            <button type="button" className="primary" onClick={() => open('reader', 'home-reader', 'Criar ficha por print')}>
              <Camera size={19} /><span><strong>Iniciar leitura</strong><small>Mais rápido e recomendado</small></span><ArrowRight size={18} />
            </button>
            <button type="button" onClick={() => open('manual', 'home-manual', 'Criar ficha manualmente')}>
              <Keyboard size={18} /><span><strong>Modo manual</strong><small>Digite somente o necessário</small></span>
            </button>
          </div>
        </div>

        <div className="bm-premium-player-card" aria-label={latest ? `Última carta: ${latest.name}` : 'Prévia do leitor'}>
          <div className="bm-premium-card-glow" />
          <span className="bm-premium-card-rating">{dashboard.squadReadiness || 99}</span>
          <span className="bm-premium-card-position">{latest?.targetPosition || 'CA'}</span>
          <div className="bm-premium-card-avatar">{latest ? initials(latest.name) : <Trophy size={38} />}</div>
          <div className="bm-premium-card-name"><strong>{latest?.name || 'Sua próxima carta'}</strong><small>Ficha competitiva definitiva</small></div>
          <div className="bm-premium-card-stars">★★★★★</div>
        </div>
      </section>

      <section className="bm-premium-feature-section" aria-label="Funções principais">
        <div className="bm-premium-section-heading">
          <div><span>Funções principais</span><h2>Tudo fácil de encontrar</h2></div>
          <small>{dashboard.players} jogador(es) no Cofre</small>
        </div>
        <div className="bm-premium-feature-grid">
          <button type="button" onClick={() => open('players', 'home-builds', 'Fichas')}><Trophy size={23}/><span><strong>Fichas</strong><small>Progressão ideal</small></span></button>
          <button type="button" onClick={() => openLatestResult('home-skills', 'Habilidades adicionais')}><Wand2 size={23}/><span><strong>Habilidades</strong><small>5 escolhas personalizadas</small></span></button>
          <button type="button" onClick={() => openLatestResult('home-boosters', 'Ímpeto ideal')}><Sparkles size={23}/><span><strong>Ímpetos</strong><small>Melhor escolha por carta</small></span></button>
          <button type="button" onClick={() => open('team', 'home-formations', 'Formações')}><Target size={23}/><span><strong>Formações</strong><small>Técnicos, estilos e guias</small></span></button>
          <button type="button" onClick={() => open('matches', 'home-opponent', 'Analisar adversário')}><Gamepad2 size={23}/><span><strong>Adversário</strong><small>Partidas e leitura tática</small></span></button>
          <button type="button" onClick={() => open('matches', 'home-training', 'Treinos')}><Gauge size={23}/><span><strong>Treinos</strong><small>Evolução e teste A/B</small></span></button>
          <button type="button" onClick={() => open('team', 'home-team', 'Meu Time')}><Users size={23}/><span><strong>Meu Time</strong><small>Escalação inteligente</small></span></button>
          <button type="button" onClick={() => open('settings', 'home-settings', 'Ajustes')}><Settings2 size={23}/><span><strong>Ajustes</strong><small>Conta, backup e atualização</small></span></button>
        </div>
      </section>

      <section className="bm-premium-dashboard-grid">
        <article className="bm-premium-formation-card">
          <div className="bm-premium-card-heading">
            <div><span>Formação ativa</span><h2>{team.formation}</h2><small>{team.styleNote}</small></div>
            <strong>{team.globalScore}</strong>
          </div>
          <div className="bm-premium-mini-pitch" aria-label={`Escalação ${team.formation}`}>
            <i className="half-line"/><i className="center-circle"/><i className="box box-top"/><i className="box box-bottom"/>
            {team.lineup.map((item) => (
              <button
                key={item.slot.id}
                type="button"
                className={item.player ? 'filled' : 'empty'}
                style={{ left: `${item.slot.x}%`, top: `${item.slot.y}%` }}
                title={item.player ? `${item.player.parsed.playerName} — ${item.slot.label}` : `${item.slot.label} sem jogador`}
                onClick={() => open('team', `lineup-${item.slot.id}`, item.player ? `Revisar ${item.slot.label}` : `Preencher ${item.slot.label}`)}
              >
                <b>{item.slot.label.replace(/\s.*/, '')}</b><span>{item.player ? initials(item.player.parsed.playerName) : '+'}</span>
              </button>
            ))}
          </div>
          <footer><span>{team.filledSlots}/{team.totalSlots} posições preenchidas</span><button type="button" onClick={() => open('team', 'home-open-team', 'Abrir Meu Time')}>Editar time <ArrowRight size={15}/></button></footer>
        </article>

        <article className="bm-premium-activity-card">
          <div className="bm-premium-card-heading"><div><span>Resumo inteligente</span><h2>Seu progresso</h2></div><BrainCircuit size={24}/></div>
          <div className="bm-premium-metric-grid">
            <div><Users size={18}/><strong>{dashboard.players}</strong><span>jogadores</span></div>
            <div><CheckCircle2 size={18}/><strong>{dashboard.confirmed}</strong><span>fichas prontas</span></div>
            <div><Trophy size={18}/><strong>{dashboard.matchRecords}</strong><span>partidas</span></div>
            <div><Clock3 size={18}/><strong>{backupLabel}</strong><span>último backup</span></div>
          </div>
          {latest ? (
            <button type="button" className="bm-premium-latest-player" onClick={() => openLatestResult('home-continue', `Continuar ${latest.name}`)}>
              <span>{initials(latest.name)}</span><div><small>Última análise</small><strong>{latest.name}</strong><em>{latest.targetPosition}</em></div><ArrowRight size={18}/>
            </button>
          ) : (
            <button type="button" className="bm-premium-latest-player empty" onClick={() => open('reader', 'home-first-card', 'Adicionar primeira carta')}>
              <span>+</span><div><small>Comece agora</small><strong>Adicione sua primeira carta</strong><em>Leitura por print</em></div><ArrowRight size={18}/>
            </button>
          )}
          {nextStep && (
            <div className="bm-premium-next-step"><Target size={18}/><div><small>Próximo passo sugerido</small><strong>{nextStep.title}</strong><span>{nextStep.detail}</span></div><button type="button" onClick={() => onAction(nextStep)}>Abrir</button></div>
          )}
        </article>
      </section>
    </section>
  );
}
