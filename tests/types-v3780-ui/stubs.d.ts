declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: unknown }
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const ArrowRight: Icon;
  export const BarChart3: Icon;
  export const BrainCircuit: Icon;
  export const Camera: Icon;
  export const CheckCircle2: Icon;
  export const Clock3: Icon;
  export const Gamepad2: Icon;
  export const Gauge: Icon;
  export const Keyboard: Icon;
  export const LayoutDashboard: Icon;
  export const Settings2: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const Target: Icon;
  export const Trophy: Icon;
  export const Users: Icon;
  export const Wand2: Icon;
}

declare module '@/modules/core/centralIntelligence' {
  export type CentralRecommendation = {
    id: string;
    title: string;
    detail: string;
    action: 'reader' | 'manual' | 'players' | 'result' | 'team' | 'matches' | 'settings';
    playerId?: string;
    priority: 'info';
  };
  export type CentralDashboard = {
    recommendations: CentralRecommendation[];
    latestPlayer: { id: string; name: string; targetPosition: string } | null;
    squadReadiness: number;
    players: number;
    confirmed: number;
    matchRecords: number;
  };
  export type TeamDiagnosis = {
    formation: string;
    styleNote: string;
    globalScore: number;
    filledSlots: number;
    totalSlots: number;
    lineup: Array<{
      slot: { id: string; x: number; y: number; label: string };
      player: null | { parsed: { playerName: string } };
    }>;
  };
}
