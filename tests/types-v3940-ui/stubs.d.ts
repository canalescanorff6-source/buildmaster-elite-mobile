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

declare module 'react' {
  export type ReactNode = unknown;
  export type ErrorInfo = { componentStack?: string | null };
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export class Component<P = Record<string, never>, S = Record<string, never>> {
    props: Readonly<P>;
    state: Readonly<S>;
    constructor(props: P);
    setState(state: Partial<S> | ((previous: S) => Partial<S>)): void;
  }
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const AlertTriangle: Icon;
  export const ArrowLeft: Icon;
  export const BrainCircuit: Icon;
  export const CheckCircle2: Icon;
  export const Copy: Icon;
  export const Download: Icon;
  export const LockKeyhole: Icon;
  export const RotateCcw: Icon;
  export const Save: Icon;
  export const Share2: Icon;
  export const ShieldAlert: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const Target: Icon;
  export const Trophy: Icon;
}
