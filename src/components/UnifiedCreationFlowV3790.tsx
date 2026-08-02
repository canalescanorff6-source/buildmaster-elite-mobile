'use client';

import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Keyboard,
  RotateCcw,
  Save,
  Sparkles,
  Trash2
} from 'lucide-react';
import {
  unifiedCreationDraftLabel,
  unifiedCreationStepLabel,
  type UnifiedCreationDraft,
  type UnifiedCreationMethod,
  type UnifiedCreationStep
} from '@/lib/unifiedCreationFlowV3790';

const STEPS: Array<{ id: UnifiedCreationStep; label: string }> = [
  { id: 'input', label: 'Entrada' },
  { id: 'review', label: 'Revisão' },
  { id: 'result', label: 'Resultado' }
];

function stepIndex(step: UnifiedCreationStep) {
  return STEPS.findIndex((item) => item.id === step);
}

export function UnifiedCreationFlowV3790({
  method,
  step,
  progress,
  saveState,
  playerName,
  onMethodChange,
  onReset
}: {
  method: UnifiedCreationMethod;
  step: UnifiedCreationStep;
  progress: number;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  playerName: string;
  onMethodChange: (method: UnifiedCreationMethod) => void;
  onReset: () => void;
}) {
  const currentIndex = stepIndex(step);
  const saveLabel = saveState === 'saving'
    ? 'Salvando rascunho'
    : saveState === 'error'
      ? 'Falha ao salvar'
      : saveState === 'saved'
        ? 'Rascunho salvo'
        : 'Salvamento automático';

  return (
    <section className="bm-v3790-flow" aria-label="Fluxo único de criação de ficha">
      <header className="bm-v3790-flow-heading">
        <div className="bm-v3790-flow-title">
          <span><Sparkles size={20} /></span>
          <div>
            <small>Nova ficha</small>
            <h1>{playerName.trim() || 'Criação em andamento'}</h1>
          </div>
        </div>
        <div className={`bm-v3790-save-state state-${saveState}`} role="status" aria-live="polite">
          {saveState === 'saving' ? <Clock3 size={15} /> : saveState === 'error' ? <RotateCcw size={15} /> : <Save size={15} />}
          <span>{saveLabel}</span>
        </div>
      </header>

      <div className="bm-v3790-flow-bar">
        <div className="bm-v3790-method-switch" role="tablist" aria-label="Forma de entrada">
          <button type="button" role="tab" aria-selected={method === 'reader'} className={method === 'reader' ? 'active' : ''} onClick={() => onMethodChange('reader')}>
            <Camera size={18} /><span><strong>Usar imagem</strong><small>Importar print</small></span>
          </button>
          <button type="button" role="tab" aria-selected={method === 'manual'} className={method === 'manual' ? 'active' : ''} onClick={() => onMethodChange('manual')}>
            <Keyboard size={18} /><span><strong>Digitar dados</strong><small>Modo manual</small></span>
          </button>
        </div>

        <ol className="bm-v3790-stepper" aria-label="Etapas da ficha">
          {STEPS.map((item, index) => {
            const done = index < currentIndex || step === 'result';
            const active = index === currentIndex;
            return (
              <li key={item.id} className={`${done ? 'done' : ''} ${active ? 'active' : ''}`} aria-current={active ? 'step' : undefined}>
                <span>{done ? <CheckCircle2 size={15} /> : index + 1}</span>
                <strong>{item.label}</strong>
              </li>
            );
          })}
        </ol>

        <button type="button" className="bm-v3790-reset" onClick={onReset} aria-label="Começar uma nova ficha e descartar o rascunho atual">
          <Trash2 size={16} /><span>Nova</span>
        </button>
      </div>

      <div className="bm-v3790-progress" aria-label={`${progress}% concluído`}>
        <i><b style={{ width: `${Math.max(2, Math.min(100, progress))}%` }} /></i>
        <span>{unifiedCreationStepLabel(step)} · {progress}%</span>
      </div>
    </section>
  );
}

export function UnifiedCreationResumeCardV3790({
  draft,
  onResume,
  onDiscard
}: {
  draft: UnifiedCreationDraft;
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <section className="bm-v3790-resume-card" aria-label="Rascunho de ficha disponível">
      <div className="bm-v3790-resume-icon"><Clock3 size={20} /></div>
      <div className="bm-v3790-resume-copy">
        <small>Rascunho salvo automaticamente</small>
        <strong>{unifiedCreationDraftLabel(draft)}</strong>
        <span>{unifiedCreationStepLabel(draft.step)} · {draft.progress}% concluído</span>
      </div>
      <div className="bm-v3790-resume-actions">
        <button type="button" className="primary" onClick={onResume}>Continuar <ChevronRight size={16} /></button>
        <button type="button" onClick={onDiscard}>Descartar</button>
      </div>
    </section>
  );
}
