declare namespace JSX { type Element = unknown; interface IntrinsicElements { [elementName: string]: Record<string, unknown>; } }
declare module 'react' {
  export type SetStateAction<S> = S | ((previous: S) => S); export type Dispatch<A> = (value: A) => void;
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useRef<T>(initial: T): { current: T };
}
declare module 'react/jsx-runtime' { export const Fragment: unique symbol; export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element; export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element; }
declare module 'lucide-react' { type Icon = (props: Record<string, unknown>) => JSX.Element; export const Activity:Icon; export const AlertTriangle:Icon; export const CheckCircle2:Icon; export const Download:Icon; export const Gauge:Icon; export const History:Icon; export const LayoutDashboard:Icon; export const RefreshCw:Icon; export const RotateCcw:Icon; export const Save:Icon; export const Search:Icon; export const ShieldCheck:Icon; export const Sparkles:Icon; export const Star:Icon; export const Trash2:Icon; }
