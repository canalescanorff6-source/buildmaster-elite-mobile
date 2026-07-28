declare namespace JSX {
  interface Element {}
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
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
  export const AlertTriangle: Icon;
  export const ArrowDown: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const ArrowUp: Icon;
  export const CheckCircle2: Icon;
  export const Crop: Icon;
  export const Eye: Icon;
  export const History: Icon;
  export const Loader2: Icon;
  export const ScanLine: Icon;
  export const ScanText: Icon;
  export const ShieldAlert: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const ZoomIn: Icon;
  export const ZoomOut: Icon;
}
