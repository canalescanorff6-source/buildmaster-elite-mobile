declare namespace JSX { type Element = unknown; interface IntrinsicElements { [elementName: string]: Record<string, unknown>; } }
declare module 'react' {
  export type SetStateAction<S> = S | ((previous: S) => S); export type Dispatch<A> = (value: A) => void;
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
}
declare module 'react/jsx-runtime' { export const Fragment: unique symbol; export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element; export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element; }
declare module 'lucide-react' { type Icon = (props: Record<string, unknown>) => JSX.Element; export const Activity:Icon; export const AlertTriangle:Icon; export const Award:Icon; export const BarChart3:Icon; export const Battery:Icon; export const Brain:Icon; export const CalendarDays:Icon; export const CheckCircle2:Icon; export const Cpu:Icon; export const Download:Icon; export const Gauge:Icon; export const Network:Icon; export const RefreshCw:Icon; export const Save:Icon; export const Signal:Icon; export const Target:Icon; export const Thermometer:Icon; export const Trash2:Icon; export const Trophy:Icon; export const Wifi:Icon; }
