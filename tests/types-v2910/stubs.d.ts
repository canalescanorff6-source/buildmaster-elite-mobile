declare const process: { env: Record<string, string | undefined> };

declare namespace JSX {
  type ChangeEvent = { target: { value: string; checked: boolean } };
  interface IntrinsicElements {
    input: Record<string, unknown> & { onChange?: (event: ChangeEvent) => void };
    select: Record<string, unknown> & { onChange?: (event: ChangeEvent) => void };
    button: Record<string, unknown> & { onClick?: (event: unknown) => void };
    [elementName: string]: Record<string, unknown>;
  }
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
  export const Activity: Icon; export const AlertTriangle: Icon; export const Beaker: Icon;
  export const CheckCircle2: Icon; export const Clock3: Icon; export const Copy: Icon;
  export const FileClock: Icon; export const GitBranch: Icon; export const History: Icon;
  export const KeyRound: Icon; export const Laptop: Icon; export const Loader2: Icon;
  export const LockKeyhole: Icon; export const PauseCircle: Icon; export const RefreshCw: Icon;
  export const RotateCcw: Icon; export const Save: Icon; export const ShieldCheck: Icon;
  export const ShieldOff: Icon; export const Smartphone: Icon; export const TestTube2: Icon;
  export const UserRoundCheck: Icon; export const Users: Icon; export const WifiOff: Icon;
  export const XCircle: Icon;
}

declare module '@capacitor/core' {
  export const Capacitor: { isNativePlatform(): boolean };
  export const CapacitorHttp: {
    get(options: Record<string, unknown>): Promise<{ status: number; data: unknown }>;
  };
}
