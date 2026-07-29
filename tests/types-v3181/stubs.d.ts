declare namespace JSX {
  interface Element {}
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export type CSSProperties = Record<string, string | number | undefined>;
  export type MouseEvent<T = HTMLElement> = { currentTarget: T; stopPropagation(): void };
  export type PointerEvent<T = HTMLElement> = {
    pointerId: number;
    clientX: number;
    clientY: number;
    currentTarget: T & { setPointerCapture(pointerId: number): void; releasePointerCapture(pointerId: number): void };
    preventDefault(): void;
    stopPropagation(): void;
  };
  export type RefObject<T> = { current: T | null };
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const ArrowDown: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const ArrowUp: Icon;
  export const CheckCircle2: Icon;
  export const Lock: Icon;
  export const Maximize2: Icon;
  export const RotateCcw: Icon;
  export const Save: Icon;
  export const ScanText: Icon;
  export const Unlock: Icon;
}
