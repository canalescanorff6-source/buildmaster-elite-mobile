declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: unknown }
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export type ChangeEvent<T> = { target: T; currentTarget: T };
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const Activity: Icon;
  export const BarChart3: Icon;
  export const FlaskConical: Icon;
  export const Swords: Icon;
  export const TimerReset: Icon;
  export const TrendingUp: Icon;
  export const Zap: Icon;
  export const BadgeCheck: Icon;
  export const BrainCircuit: Icon;
  export const CheckCircle2: Icon;
  export const ClipboardCopy: Icon;
  export const Database: Icon;
  export const Gauge: Icon;
  export const History: Icon;
  export const Layers3: Icon;
  export const Save: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const Target: Icon;
  export const Trash2: Icon;
  export const TriangleAlert: Icon;
}
