declare const process: { env: Record<string, string | undefined> };
declare namespace JSX {
  interface Element {}
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react' {
  export type ReactNode = unknown;
  export type FormEvent<T = Element> = { preventDefault(): void; currentTarget: T };
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export type MutableRefObject<T> = { current: T };
  export type Context<T> = { Provider: (props: { value: T; children?: ReactNode }) => JSX.Element };
  export function createContext<T>(value: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useRef<T>(value: T): MutableRefObject<T>;
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const AlertTriangle: Icon; export const BadgeCheck: Icon; export const CheckCircle2: Icon;
  export const Clock3: Icon; export const Crown: Icon; export const Eye: Icon; export const EyeOff: Icon;
  export const Fingerprint: Icon; export const KeyRound: Icon; export const Loader2: Icon; export const LockKeyhole: Icon;
  export const RefreshCw: Icon; export const Server: Icon; export const ShieldCheck: Icon; export const Smartphone: Icon;
  export const UserCheck: Icon; export const UserRound: Icon; export const WifiOff: Icon;
}

declare module '@capacitor/core' {
  export type PluginListenerHandle = { remove(): Promise<void> };
  export const Capacitor: { isNativePlatform(): boolean };
  export const CapacitorHttp: { request(options: Record<string, unknown>): Promise<{ data: unknown; status: number; headers: Record<string, string> }> };
  export function registerPlugin<T>(_name: string): T;
}
