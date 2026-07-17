'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, History, ScanText, ShieldCheck, Sparkles, Target, Users, X } from 'lucide-react';
import type { TacticalFormation, TacticalStyle } from '@/lib/analyzer';
import type { ExperienceMode, OnboardingProfile } from '@/lib/appEvolution';

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: (profile: OnboardingProfile) => void;
  onCreatePrint: () => void;
  onCreateManual: () => void;
};

const FORMATIONS: TacticalFormation[] = ['4-2-2-2', '4-3-3', '4-1-2-3', '4-2-3-1', '4-3-1-2'];
const STYLES: Array<{ value: TacticalStyle; label: string }> = [
  { value: 'POSSE_DE_BOLA', label: 'Posse' },
  { value: 'CONTRA_ATAQUE', label: 'Contra-ataque' },
  { value: 'CONTRA_ATAQUE_RAPIDO', label: 'Contra-ataque rápido' },
  { value: 'POR_FORA', label: 'Por fora' },
  { value: 'PASSE_LONGO', label: 'Passe longo' }
];

export function FirstUseOnboarding({ open, onClose, onComplete, onCreatePrint, onCreateManual }: Props) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<ExperienceMode>('simple');
  const [formation, setFormation] = useState<TacticalFormation>('4-2-2-2');
  const [teamStyle, setTeamStyle] = useState<TacticalStyle>('CONTRA_ATAQUE_RAPIDO');
  const [goal, setGoal] = useState<OnboardingProfile['goal']>('fichas');
  const progress = useMemo(() => Math.round(((step + 1) / 5) * 100), [step]);

  if (!open) return null;

  const finish = () => {
    onComplete({ version: 1, completedAt: new Date().toISOString(), experienceMode: mode, favoriteFormation: formation, teamStyle, goal });
  };

  return (
    <div className="first-use-overlay" role="dialog" aria-modal="true" aria-label="Configuração inicial do BuildMaster">
      <section className="first-use-card luxury-panel">
        <header>
          <div><p className="kicker"><Sparkles size={15}/> Primeiro uso</p><h2>Prepare o BuildMaster do seu jeito</h2><span>São cinco passos curtos. Nada será alterado sem sua confirmação.</span></div>
          <button type="button" onClick={onClose} aria-label="Fechar configuração inicial"><X size={19}/></button>
        </header>
        <div className="first-use-progress"><div><span>Etapa {step + 1} de 5</span><strong>{progress}%</strong></div><i><b style={{ width: `${progress}%` }}/></i></div>

        {step === 0 && <div className="first-use-step">
          <div className="first-use-step-copy"><span><ShieldCheck size={24}/></span><div><h3>Escolha a quantidade de detalhes</h3><p>O motor é o mesmo nos dois modos. O modo simples esconde ferramentas técnicas até você precisar delas.</p></div></div>
          <div className="first-use-choice-grid two">
            <button type="button" className={mode === 'simple' ? 'selected' : ''} onClick={() => setMode('simple')}><Sparkles size={21}/><strong>Modo simples</strong><span>Print, posição, ficha e explicação principal.</span>{mode === 'simple' && <CheckCircle2 size={18}/>}</button>
            <button type="button" className={mode === 'advanced' ? 'selected' : ''} onClick={() => setMode('advanced')}><Target size={21}/><strong>Modo avançado</strong><span>Auditoria, calibração, comparações e contexto completo.</span>{mode === 'advanced' && <CheckCircle2 size={18}/>}</button>
          </div>
        </div>}

        {step === 1 && <div className="first-use-step">
          <div className="first-use-step-copy"><span><Target size={24}/></span><div><h3>Qual é sua formação principal?</h3><p>Ela será usada como contexto inicial. A posição escolhida na ficha continuará soberana.</p></div></div>
          <div className="first-use-chip-grid">{FORMATIONS.map((item) => <button type="button" key={item} className={formation === item ? 'selected' : ''} onClick={() => setFormation(item)}>{item}</button>)}</div>
        </div>}

        {step === 2 && <div className="first-use-step">
          <div className="first-use-step-copy"><span><Users size={24}/></span><div><h3>Como seu time costuma jogar?</h3><p>O estilo coletivo será um ajuste fino, sem substituir o estilo oficial da carta.</p></div></div>
          <div className="first-use-chip-grid">{STYLES.map((item) => <button type="button" key={item.value} className={teamStyle === item.value ? 'selected' : ''} onClick={() => setTeamStyle(item.value)}>{item.label}</button>)}</div>
        </div>}

        {step === 3 && <div className="first-use-step">
          <div className="first-use-step-copy"><span><History size={24}/></span><div><h3>Qual é sua prioridade agora?</h3><p>A tela inicial destacará o caminho mais útil. Você poderá mudar isso depois.</p></div></div>
          <div className="first-use-choice-grid">
            {([
              ['fichas', 'Fichas precisas', 'Criar a melhor progressão para cada carta.'],
              ['elenco', 'Organizar o elenco', 'Encontrar lacunas, titulares e banco.'],
              ['formacoes', 'Formações', 'Combinar posições, funções e estilos.'],
              ['treino', 'Treinos e pós-jogo', 'Registrar erros e validar as fichas em partidas.']
            ] as const).map(([value, title, text]) => <button type="button" key={value} className={goal === value ? 'selected' : ''} onClick={() => setGoal(value)}><strong>{title}</strong><span>{text}</span>{goal === value && <CheckCircle2 size={18}/>}</button>)}
          </div>
        </div>}

        {step === 4 && <div className="first-use-step first-use-finish">
          <div className="first-use-step-copy"><span><CheckCircle2 size={24}/></span><div><h3>Configuração pronta</h3><p>Modo {mode === 'simple' ? 'simples' : 'avançado'}, formação {formation} e estilo {STYLES.find((item) => item.value === teamStyle)?.label}.</p></div></div>
          <div className="first-use-start-grid">
            <button type="button" onClick={() => { finish(); onCreatePrint(); }}><ScanText size={23}/><strong>Criar pelo print</strong><span>Importe a carta e confirme a leitura.</span></button>
            <button type="button" onClick={() => { finish(); onCreateManual(); }}><ShieldCheck size={23}/><strong>Usar Manual Pro</strong><span>Preencha os dados com controle total.</span></button>
          </div>
        </div>}

        <footer>
          <button type="button" onClick={() => step === 0 ? onClose() : setStep((value) => value - 1)}>{step === 0 ? 'Agora não' : 'Voltar'}</button>
          {step < 4 ? <button type="button" className="elite-button" onClick={() => setStep((value) => value + 1)}>Continuar <ChevronRight size={17}/></button> : <button type="button" className="elite-button" onClick={finish}>Concluir sem criar agora</button>}
        </footer>
      </section>
    </div>
  );
}
