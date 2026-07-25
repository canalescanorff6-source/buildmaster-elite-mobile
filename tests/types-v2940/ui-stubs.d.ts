declare namespace JSX {
  type Element = unknown;
  interface IntrinsicElements { [elementName: string]: Record<string, unknown>; }
}
declare module 'react' {
  export type SetStateAction<S> = S | ((previous: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export type ChangeEvent<T> = { target: T; currentTarget: T };
  export type MutableRefObject<T> = { current: T };
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
  export function useRef<T>(initial: T): MutableRefObject<T>;
}
declare module 'react/jsx-runtime' {
  export const Fragment: unique symbol;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}
declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const CheckCircle2: Icon; export const Download: Icon; export const History: Icon;
  export const RotateCcw: Icon; export const Save: Icon; export const SlidersHorizontal: Icon;
  export const Sparkles: Icon; export const Star: Icon; export const Target: Icon; export const Trash2: Icon;
  export const RefreshCcw: Icon; export const ShieldAlert: Icon; export const ShieldCheck: Icon;
  export const UploadCloud: Icon; export const X: Icon;
}
