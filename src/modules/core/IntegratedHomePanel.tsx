'use client';

import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Clock3,
  Gamepad2,
  Gauge,
  Keyboard,
  LayoutDashboard,
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
    : 'Pendente';
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
    <section className="bm-premium-dashboard bm-v36-home" aria-label="Central premium do BuildMaster">
      <header className="bm-premium-dashboard-heading bm-v36-home-header">
        <div className="bm-v36-title-block">
          <span className="bm-v36-eyebrow"><LayoutDashboard size={15} /> Central Elite</span>
          <h1>Desempenho real. Sem perseguir overall.</h1>
          <p>Crie fichas, compare Perfis de Gameplay e organize seu elenco em um fluxo direto.</p>
        </div>
        <div className="bm-premium-health-pill bm-v36-health-pill">
          <span className="bm-v36-health-icon"><ShieldCheck size={18} /></span>
          <div><small>Integridade do app</small><strong>{healthScore}/100</strong></div>
          <i aria-hidden="true"><b style={{ width: `${Math.max(4, Math.min(100, healthScore))}%` }} /></i>
        </div>
      </header>

      <section className="bm-premium-reader-hero bm-v36-command-deck" aria-label="Criar ficha de alto desempenho">
        <div className="bm-premium-reader-copy bm-v36-command-copy">
          <span className="bm-premium-kicker bm-v36-command-kicker"><BrainCircuit size={16} /> Build Intelligence</span>
          <h2>A ficha mais forte para a carta e para a posição que você escolher.</h2>
          <p>O motor cruza DNA técnico, posição, estilo, pontos e habilidades oficiais para priorizar jogabilidade dentro da partida.</p>
          <div className="bm-premium-reader-actions bm-v36-command-actions">
            <button type="button" className="primary" onClick={() => open('reader', 'home-reader', 'Criar ficha por print')}>
              <span className="bm-v36-action-icon"><Camera size={21} /></span>
              <span><strong>Analisar uma carta</strong><small>Importar print completo</small></span>
              <ArrowRight size={18} />
            </button>
            <button type="button" onClick={() => open('manual', 'home-manual', 'Criar ficha manualmente')}>
              <Keyboard size={19} /><span><strong>Manual Pro</strong><small>Preencher os dados</small></span>
            </button>
          </div>
          <div className="bm-v36-trust-row" aria-label="Recursos da análise">
            <span><CheckCircle2 size={14} /> Ficha anti-overall</span>
            <span><Wand2 size={14} /> 5 habilidades oficiais</span>
            <span><Target size={14} /> Posição escolhida</span>
          </div>
        </div>

        <article className="bm-premium-player-card bm-v36-spotlight-card" aria-label={latest ? `Última carta: ${latest.name}` : 'Prévia da próxima ficha'}>
          <div className="bm-v36-spotlight-top">
            <span>ÚLTIMA ANÁLISE</span>
            <em>{latest ? 'Disponível' : 'Aguardando carta'}</em>
          </div>
          <div className="bm-v36-card-stage">
            <span className="bm-premium-card-rating">{dashboard.squadReadiness || 99}</span>
            <span className="bm-premium-card-position">{latest?.targetPosition || 'CA'}</span>
            <div className="bm-premium-card-avatar">{latest ? initials(latest.name) : <Trophy size={39} />}</div>
            <div className="bm-premium-card-stars">★★★★★</div>
          </div>
          <div className="bm-premium-card-name bm-v36-spotlight-name">
            <div><small>{latest ? 'Ficha pronta' : 'Comece sua análise'}</small><strong>{latest?.name || 'Nova carta'}</strong></div>
            <button type="button" onClick={() => openLatestResult('home-spotlight', latest ? `Abrir ${latest.name}` : 'Criar primeira ficha')} aria-label={latest ? `Abrir ficha de ${latest.name}` : 'Criar primeira ficha'}><ArrowRight size={18} /></button>
          </div>
        </article>
      </section>

      <section className="bm-v36-metrics" aria-label="Resumo do aplicativo">
        <article><span><Users size={18} /></span><div><strong>{dashboard.players}</strong><small>Jogadores salvos</small></div></article>
        <article><span><CheckCircle2 size={18} /></span><div><strong>{dashboard.confirmed}</strong><small>Fichas concluídas</small></div></article>
        <article><span><Gamepad2 size={18} /></span><div><strong>{dashboard.matchRecords}</strong><small>Partidas registradas</small></div></article>
        <article><span><Clock3 size={18} /></span><div><strong>{backupLabel}</strong><small>Último backup</small></div></article>
      </section>

      <section className="bm-premium-feature-section bm-v36-workspace" aria-label="Áreas principais">
        <div className="bm-premium-section-heading bm-v36-section-heading">
          <div><span>Workspace</span><h2>O que você quer fazer agora?</h2></div>
          <small>{dashboard.players} carta(s) no seu ambiente</small>
        </div>
        <div className="bm-premium-feature-grid bm-v36-feature-grid">
          <button type="button" className="featured" onClick={() => open('players', 'home-builds', 'Fichas')}><span><Trophy size={23}/></span><div><strong>Minhas fichas</strong><small>Progressões e Perfis de Gameplay</small></div><ArrowRight size={17}/></button>
          <button type="button" onClick={() => openLatestResult('home-skills', 'Habilidades adicionais')}><span><Wand2 size={23}/></span><div><strong>Habilidades</strong><small>Top 5 oficial e Ímpetos</small></div><ArrowRight size={17}/></button>
          <button type="button" onClick={() => open('team', 'home-team', 'Meu Time')}><span><Users size={23}/></span><div><strong>Meu Time</strong><small>Elenco, setores e escalação</small></div><ArrowRight size={17}/></button>
          <button type="button" onClick={() => open('matches', 'home-training', 'Treinos')}><span><Gauge size={23}/></span><div><strong>Partidas</strong><small>Testes e evolução real</small></div><ArrowRight size={17}/></button>
          <button type="button" onClick={() => open('team', 'home-formations', 'Formações')}><span><Target size={23}/></span><div><strong>Tática</strong><small>Técnicos, estilos e funções</small></div><ArrowRight size={17}/></button>
          <button type="button" onClick={() => open('settings', 'home-settings', 'Ajustes')}><span><Settings2 size={23}/></span><div><strong>Configurações</strong><small>Conta, aparência e backup</small></div><ArrowRight size={17}/></button>
        </div>
      </section>

      <section className="bm-premium-dashboard-grid bm-v36-dashboard-grid">
        <article className="bm-premium-formation-card bm-v36-team-card">
          <div className="bm-premium-card-heading bm-v36-card-heading">
            <div><span>Meu Time</span><h2>{team.formation}</h2><small>{team.styleNote}</small></div>
            <div className="bm-v36-score"><strong>{team.globalScore}</strong><small>nota</small></div>
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
          <footer><span>{team.filledSlots}/{team.totalSlots} posições preenchidas</span><button type="button" onClick={() => open('team', 'home-open-team', 'Abrir Meu Time')}>Abrir elenco <ArrowRight size={15}/></button></footer>
        </article>

        <article className="bm-premium-activity-card bm-v36-insight-card">
          <div className="bm-premium-card-heading bm-v36-card-heading"><div><span>Inteligência</span><h2>Próxima melhor ação</h2></div><BarChart3 size={24}/></div>
          {nextStep ? (
            <button type="button" className="bm-v36-next-action" onClick={() => onAction(nextStep)}>
              <span><BrainCircuit size={22}/></span>
              <div><small>Recomendação do app</small><strong>{nextStep.title}</strong><p>{nextStep.detail || 'Abra a área recomendada para continuar a evolução do seu elenco.'}</p></div>
              <ArrowRight size={19}/>
            </button>
          ) : (
            <button type="button" className="bm-v36-next-action" onClick={() => open('reader', 'home-first-card', 'Adicionar primeira carta')}>
              <span><Camera size={22}/></span>
              <div><small>Primeiro passo</small><strong>Adicione uma carta</strong><p>O BuildMaster libera recomendações personalizadas depois da primeira análise.</p></div>
              <ArrowRight size={19}/>
            </button>
          )}
          <div className="bm-v36-insight-list">
            <div><span><Sparkles size={17}/></span><div><strong>Perfis de Gameplay</strong><small>Até 3 fichas por DNA técnico</small></div></div>
            <div><span><ShieldCheck size={17}/></span><div><strong>Catálogo oficial</strong><small>Sem habilidades inventadas</small></div></div>
            <div><span><Target size={17}/></span><div><strong>Posição soberana</strong><small>Ficha recalculada para sua escolha</small></div></div>
          </div>
          {latest && (
            <button type="button" className="bm-premium-latest-player bm-v36-latest-player" onClick={() => openLatestResult('home-continue', `Continuar ${latest.name}`)}>
              <span>{initials(latest.name)}</span><div><small>Retomar ficha</small><strong>{latest.name}</strong><em>{latest.targetPosition}</em></div><ArrowRight size={18}/>
            </button>
          )}
        </article>
      </section>
    </section>
  );
}
