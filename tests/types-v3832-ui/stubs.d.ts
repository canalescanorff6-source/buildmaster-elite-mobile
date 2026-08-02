declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: unknown }
  interface IntrinsicElements { [name: string]: any }
}
declare module 'react' {
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
}
declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}
declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const AlertTriangle:Icon; export const CheckCircle2:Icon; export const ChevronRight:Icon; export const Copy:Icon;
  export const Download:Icon; export const FileText:Icon; export const Image:Icon; export const Layers3:Icon; export const RotateCcw:Icon;
  export const Save:Icon; export const Share2:Icon; export const ShieldCheck:Icon; export const Sparkles:Icon; export const Trash2:Icon;
  export const Users:Icon; export const WandSparkles:Icon;
}
