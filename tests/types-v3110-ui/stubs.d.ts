declare namespace JSX {
  interface Element {}
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
  export const AlertTriangle: Icon;
  export const ArrowLeftRight: Icon;
  export const BadgeCheck: Icon;
  export const BrainCircuit: Icon;
  export const CheckCircle2: Icon;
  export const ClipboardList: Icon;
  export const Copy: Icon;
  export const Layers: Icon;
  export const Plus: Icon;
  export const Route: Icon;
  export const Save: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const Swords: Icon;
  export const Target: Icon;
  export const Trash2: Icon;
  export const Trophy: Icon;
  export const UserRoundCog: Icon;
  export const Users: Icon;
}
