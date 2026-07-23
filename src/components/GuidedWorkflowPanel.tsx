'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, ListChecks, RotateCcw, Target } from 'lucide-react';
import {
  GUIDED_WORKFLOWS,
  readWorkflowProgress,
  resetWorkflowProgress,
  toggleWorkflowStep,
  type WorkflowTarget
} from '@/lib/appExperienceV2740';

export function GuidedWorkflowPanel({ onOpenTarget }: { onOpenTarget: (target: WorkflowTarget) => void }) {
  const [selectedId, setSelectedId] = useState(GUIDED_WORKFLOWS[0]?.id ?? '');
  const [progress, setProgress] = useState(() => readWorkflowProgress());
  const selected = GUIDED_WORKFLOWS.find((item) => item.id === selectedId) ?? GUIDED_WORKFLOWS[0];
  const selectedProgress = progress.find((item) => item.workflowId === selected?.id);
  const completedIds = useMemo(() => new Set(selectedProgress?.completedStepIds ?? []), [selectedProgress]);
  const percent = selected?.steps.length ? Math.round((completedIds.size / selected.steps.length) * 100) : 0;

  if (!selected) return null;

  return <div className="guided-workflows">
    <aside className="workflow-list" aria-label="Rotinas guiadas">
      <div><ListChecks size={22}/><span><strong>Rotinas guiadas</strong><small>Fluxos curtos para não esquecer nenhuma etapa.</small></span></div>
      {GUIDED_WORKFLOWS.map((workflow) => {
        const itemProgress = progress.find((item) => item.workflowId === workflow.id);
        const done = itemProgress?.completedStepIds.length ?? 0;
        return <button type="button" key={workflow.id} className={workflow.id === selected.id ? 'active' : ''} onClick={() => setSelectedId(workflow.id)}><span><b>{workflow.title}</b><small>{workflow.estimatedMinutes} min • {done}/{workflow.steps.length}</small></span><ChevronRight size={17}/></button>;
      })}
    </aside>

    <section className="workflow-detail">
      <header><div><Target size={24}/><span><strong>{selected.title}</strong><small>{selected.description}</small></span></div><b>{percent}%</b></header>
      <div className="workflow-progress"><i><b style={{ width: `${percent}%` }}/></i><span>{completedIds.size} de {selected.steps.length} etapas concluídas</span></div>
      <div className="workflow-steps">{selected.steps.map((step, index) => {
        const completed = completedIds.has(step.id);
        return <article key={step.id} className={completed ? 'completed' : ''}><button type="button" className="workflow-check" aria-label={`${completed ? 'Reabrir' : 'Concluir'} etapa ${step.title}`} onClick={() => setProgress(toggleWorkflowStep(selected.id, step.id))}>{completed ? <CheckCircle2 size={21}/> : <b>{index + 1}</b>}</button><button type="button" className="workflow-step-content" onClick={() => onOpenTarget(step.target)}><strong>{step.title}</strong><span>{step.detail}</span></button><button type="button" className="workflow-open" onClick={() => onOpenTarget(step.target)}>Abrir</button></article>;
      })}</div>
      <button type="button" className="workflow-reset" disabled={!completedIds.size} onClick={() => setProgress(resetWorkflowProgress(selected.id))}><RotateCcw size={16}/> Reiniciar esta rotina</button>
    </section>
  </div>;
}
