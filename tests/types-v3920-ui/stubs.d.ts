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
  export const BrainCircuit: Icon;
  export const CheckCircle2: Icon;
  export const Copy: Icon;
  export const Download: Icon;
  export const LockKeyhole: Icon;
  export const Save: Icon;
  export const Share2: Icon;
  export const ShieldAlert: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const Target: Icon;
  export const Trophy: Icon;
}
