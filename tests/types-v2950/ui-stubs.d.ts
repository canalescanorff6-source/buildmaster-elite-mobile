declare namespace JSX { type Element = unknown; interface IntrinsicElements { [elementName: string]: Record<string, unknown>; } }
declare module 'react' {
  export type SetStateAction<S> = S | ((previous: S) => S); export type Dispatch<A> = (value: A) => void;
  export type PointerEvent<T> = { currentTarget: T; pointerId: number; clientX: number; clientY: number };
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
  export function useRef<T>(initial: T): { current: T };
}
declare module 'react/jsx-runtime' { export const Fragment: unique symbol; export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element; export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element; }
declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const ChevronLeft: Icon; export const ChevronRight: Icon; export const Copy: Icon; export const Download: Icon; export const Pause: Icon; export const Play: Icon; export const RotateCcw: Icon; export const Save: Icon; export const Trash2: Icon; export const Waypoints: Icon; export const CheckCircle2: Icon; export const Clock3: Icon; export const Crosshair: Icon; export const ShieldCheck: Icon; export const Target: Icon; export const Trophy: Icon;
}
