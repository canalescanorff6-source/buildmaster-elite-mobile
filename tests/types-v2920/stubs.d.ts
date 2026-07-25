declare namespace JSX {
  interface IntrinsicElements { [elementName: string]: Record<string, unknown>; }
}
declare module 'react' {
  export type SetStateAction<S> = S | ((previous: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
  export function useCallback<T extends (...args: never[]) => unknown>(callback: T, dependencies: readonly unknown[]): T;
}
declare module 'react/jsx-runtime' {
  export const Fragment: unique symbol;
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown;
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
}
declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => unknown;
  export const AlertTriangle: Icon; export const CheckCircle2: Icon; export const Download: Icon;
  export const Gauge: Icon; export const HardDrive: Icon; export const RefreshCw: Icon;
  export const ShieldCheck: Icon; export const Smartphone: Icon; export const XCircle: Icon;
}
declare module '@capacitor/core' {
  export const Capacitor: { isNativePlatform(): boolean };
}
