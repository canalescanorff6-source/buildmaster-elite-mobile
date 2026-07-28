declare namespace JSX {
  interface Element {}
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export type FormEvent<T = Element> = { preventDefault(): void; currentTarget: T };
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly unknown[]): T;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const Activity: Icon; export const AlertTriangle: Icon; export const CheckCircle2: Icon;
  export const Clock3: Icon; export const Copy: Icon; export const Eye: Icon; export const EyeOff: Icon;
  export const FileClock: Icon; export const Filter: Icon; export const KeyRound: Icon; export const Laptop: Icon;
  export const Loader2: Icon; export const LockKeyhole: Icon; export const RefreshCw: Icon; export const Save: Icon;
  export const Search: Icon; export const Share2: Icon; export const ShieldCheck: Icon; export const ShieldOff: Icon;
  export const Smartphone: Icon; export const Trash2: Icon; export const UserPlus: Icon; export const UserRoundCheck: Icon;
  export const Users: Icon; export const WifiOff: Icon; export const X: Icon; export const XCircle: Icon; export const Zap: Icon;
}
