declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: unknown }
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export type ChangeEvent<T> = { target: T; currentTarget: T };
  export type RefObject<T> = { current: T | null };
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(initialValue: T | null): RefObject<T>;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const CheckCircle2: Icon;
  export const Copy: Icon;
  export const Database: Icon;
  export const ExternalLink: Icon;
  export const Globe2: Icon;
  export const RefreshCw: Icon;
  export const ShieldCheck: Icon;
  export const TriangleAlert: Icon;
  export const Trophy: Icon;
  export const BarChart3: Icon;
  export const ClipboardCopy: Icon;
  export const ImagePlus: Icon;
  export const Loader2: Icon;
  export const Plus: Icon;
  export const ScanText: Icon;
  export const Search: Icon;
  export const Trash2: Icon;
}
