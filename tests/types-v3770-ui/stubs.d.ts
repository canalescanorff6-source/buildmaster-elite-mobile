declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: unknown }
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const AlertTriangle: Icon;
  export const ArchiveRestore: Icon;
  export const BrainCircuit: Icon;
  export const CheckCircle2: Icon;
  export const Clock3: Icon;
  export const Download: Icon;
  export const History: Icon;
  export const RefreshCcw: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const UploadCloud: Icon;
}
