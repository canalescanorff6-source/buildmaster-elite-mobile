
declare namespace React {
  type ReactNode = any;
  type Key = string | number;
  type SetStateAction<S> = S | ((prevState: S) => S);
  type Dispatch<A> = (value: A) => void;
  interface MutableRefObject<T> { current: T; }
  interface RefObject<T> { readonly current: T | null; }
  interface CSSProperties { [key: string]: string | number | undefined; }
  interface SyntheticEvent<T = Element, E = Event> { currentTarget: T; target: EventTarget & T; nativeEvent: E; preventDefault(): void; stopPropagation(): void; }
  interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  interface ChangeEvent<T = Element> extends SyntheticEvent<T> { target: EventTarget & T; }
  interface MouseEvent<T = Element, E = globalThis.MouseEvent> extends SyntheticEvent<T, E> { clientX: number; clientY: number; button: number; }
  interface PointerEvent<T = Element> extends MouseEvent<T, globalThis.PointerEvent> { pointerId: number; }
  interface ErrorInfo { componentStack?: string | null; }
  type ComponentType<P = {}> = (props: P) => any;
  interface Context<T> { Provider: any; Consumer: any; _default?: T; }
  class Component<P = {}, S = {}> {
    constructor(props: P);
    props: Readonly<P>;
    state: Readonly<S>;
    setState<K extends keyof S>(state: Pick<S, K> | S | null | ((prevState: Readonly<S>, props: Readonly<P>) => Pick<S, K> | S | null), callback?: () => void): void;
    render(): ReactNode;
  }
}

declare module 'react' {
  export = React;
  export as namespace React;
  export type ReactNode = React.ReactNode;
  export type CSSProperties = React.CSSProperties;
  export type ChangeEvent<T = Element> = React.ChangeEvent<T>;
  export type FormEvent<T = Element> = React.FormEvent<T>;
  export type MouseEvent<T = Element> = React.MouseEvent<T>;
  export type PointerEvent<T = Element> = React.PointerEvent<T>;
  export type SyntheticEvent<T = Element> = React.SyntheticEvent<T>;
  export type ErrorInfo = React.ErrorInfo;
  export type ComponentType<P = {}> = React.ComponentType<P>;
  export type PluginListenerHandle = { remove(): Promise<void> };
  export const Component: typeof React.Component;
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly unknown[]): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): React.MutableRefObject<T | null>;
  export function useContext<T>(context: React.Context<T>): T;
  export function createContext<T>(defaultValue: T): React.Context<T>;
  export function memo<T>(component: T): T;
  export function forwardRef<T, P = {}>(render: (props: P, ref: any) => any): any;
}

declare namespace JSX {
  type Element = any;
  interface ElementClass { render: any; }
  interface ElementAttributesProperty { props: {}; }
  interface IntrinsicAttributes { key?: React.Key; }
  interface IntrinsicElements { [elemName: string]: any; }
}

declare module 'react-dom' { export function createPortal(children: any, container: Element | DocumentFragment): any; }
declare module 'next' { export type Metadata = any; export type Viewport = any; }
declare module 'next/dynamic' { const dynamic: <P = any>(loader: any, options?: any) => React.ComponentType<P>; export default dynamic; }
declare module 'next/link' { const Link: React.ComponentType<any>; export default Link; }
declare module 'next/server' {
  export class NextRequest { nextUrl: URL; headers: Headers; }
  export class NextResponse {
    static next(init?: any): NextResponse;
    static redirect(url: string | URL, init?: any): NextResponse;
    static rewrite(url: string | URL, init?: any): NextResponse;
    headers: Headers;
  }
}
declare module '@capacitor/cli' { export type CapacitorConfig = any; }
declare module '@capacitor/core' {
  export type PluginListenerHandle = { remove(): Promise<void> };
  export const Capacitor: { isNativePlatform(): boolean; getPlatform(): string; convertFileSrc(path: string): string; };
  export const CapacitorHttp: { get(options: any): Promise<any>; post(options: any): Promise<any>; request(options: any): Promise<any>; };
  export function registerPlugin<T>(name: string): T;
}
declare module 'tesseract.js' {
  const Tesseract: any;
  export default Tesseract;
  export = Tesseract;
}

declare module 'lucide-react' {
  export const Activity: React.ComponentType<any>;
  export const AlertTriangle: React.ComponentType<any>;
  export const ArchiveRestore: React.ComponentType<any>;
  export const ArrowDown: React.ComponentType<any>;
  export const ArrowLeft: React.ComponentType<any>;
  export const ArrowLeftRight: React.ComponentType<any>;
  export const ArrowRight: React.ComponentType<any>;
  export const ArrowUp: React.ComponentType<any>;
  export const ArrowUpRight: React.ComponentType<any>;
  export const Award: React.ComponentType<any>;
  export const BadgeCheck: React.ComponentType<any>;
  export const Ban: React.ComponentType<any>;
  export const BarChart3: React.ComponentType<any>;
  export const Battery: React.ComponentType<any>;
  export const Beaker: React.ComponentType<any>;
  export const Bell: React.ComponentType<any>;
  export const BookOpen: React.ComponentType<any>;
  export const Bot: React.ComponentType<any>;
  export const Brain: React.ComponentType<any>;
  export const BrainCircuit: React.ComponentType<any>;
  export const CSSProperties: React.ComponentType<any>;
  export const CalendarDays: React.ComponentType<any>;
  export const Camera: React.ComponentType<any>;
  export const Check: React.ComponentType<any>;
  export const CheckCircle2: React.ComponentType<any>;
  export const ChevronDown: React.ComponentType<any>;
  export const ChevronRight: React.ComponentType<any>;
  export const CircleStop: React.ComponentType<any>;
  export const Clipboard: React.ComponentType<any>;
  export const ClipboardCheck: React.ComponentType<any>;
  export const ClipboardCopy: React.ComponentType<any>;
  export const ClipboardList: React.ComponentType<any>;
  export const Clock3: React.ComponentType<any>;
  export const Cloud: React.ComponentType<any>;
  export const CloudDownload: React.ComponentType<any>;
  export const CloudUpload: React.ComponentType<any>;
  export const Compass: React.ComponentType<any>;
  export const Component: React.ComponentType<any>;
  export const Copy: React.ComponentType<any>;
  export const Cpu: React.ComponentType<any>;
  export const Crop: React.ComponentType<any>;
  export const Crosshair: React.ComponentType<any>;
  export const Crown: React.ComponentType<any>;
  export const Database: React.ComponentType<any>;
  export const Download: React.ComponentType<any>;
  export const Dumbbell: React.ComponentType<any>;
  export const ErrorInfo: React.ComponentType<any>;
  export const ExternalLink: React.ComponentType<any>;
  export const Eye: React.ComponentType<any>;
  export const EyeOff: React.ComponentType<any>;
  export const FileClock: React.ComponentType<any>;
  export const FileImage: React.ComponentType<any>;
  export const FileJson: React.ComponentType<any>;
  export const FilePlus2: React.ComponentType<any>;
  export const FileText: React.ComponentType<any>;
  export const FileUp: React.ComponentType<any>;
  export const Film: React.ComponentType<any>;
  export const Filter: React.ComponentType<any>;
  export const Fingerprint: React.ComponentType<any>;
  export const Flag: React.ComponentType<any>;
  export const Flame: React.ComponentType<any>;
  export const FlaskConical: React.ComponentType<any>;
  export const Folder: React.ComponentType<any>;
  export const FolderOpen: React.ComponentType<any>;
  export const FormEvent: React.ComponentType<any>;
  export const Gamepad2: React.ComponentType<any>;
  export const Gauge: React.ComponentType<any>;
  export const Gift: React.ComponentType<any>;
  export const GitBranch: React.ComponentType<any>;
  export const GitMerge: React.ComponentType<any>;
  export const Globe2: React.ComponentType<any>;
  export const Goal: React.ComponentType<any>;
  export const HardDrive: React.ComponentType<any>;
  export const Heart: React.ComponentType<any>;
  export const History: React.ComponentType<any>;
  export const Home: React.ComponentType<any>;
  export const Image: React.ComponentType<any>;
  export const ImagePlus: React.ComponentType<any>;
  export const Images: React.ComponentType<any>;
  export const Import: React.ComponentType<any>;
  export const Info: React.ComponentType<any>;
  export const KeyRound: React.ComponentType<any>;
  export const Keyboard: React.ComponentType<any>;
  export const Laptop: React.ComponentType<any>;
  export const Layers: React.ComponentType<any>;
  export const Layers3: React.ComponentType<any>;
  export const LayoutDashboard: React.ComponentType<any>;
  export const LayoutTemplate: React.ComponentType<any>;
  export const Library: React.ComponentType<any>;
  export const LifeBuoy: React.ComponentType<any>;
  export const ListChecks: React.ComponentType<any>;
  export const Loader2: React.ComponentType<any>;
  export const LoaderCircle: React.ComponentType<any>;
  export const Lock: React.ComponentType<any>;
  export const LockKeyhole: React.ComponentType<any>;
  export const LogOut: React.ComponentType<any>;
  export const Maximize2: React.ComponentType<any>;
  export const Menu: React.ComponentType<any>;
  export const MessageSquare: React.ComponentType<any>;
  export const MonitorCog: React.ComponentType<any>;
  export const MonitorSmartphone: React.ComponentType<any>;
  export const MoreHorizontal: React.ComponentType<any>;
  export const MoreVertical: React.ComponentType<any>;
  export const MouseEvent: React.ComponentType<any>;
  export const Network: React.ComponentType<any>;
  export const PackagePlus: React.ComponentType<any>;
  export const Palette: React.ComponentType<any>;
  export const Pause: React.ComponentType<any>;
  export const PauseCircle: React.ComponentType<any>;
  export const Pencil: React.ComponentType<any>;
  export const Play: React.ComponentType<any>;
  export const PlayCircle: React.ComponentType<any>;
  export const Plus: React.ComponentType<any>;
  export const PointerEvent: React.ComponentType<any>;
  export const Printer: React.ComponentType<any>;
  export const ReactNode: React.ComponentType<any>;
  export const RefreshCcw: React.ComponentType<any>;
  export const RefreshCw: React.ComponentType<any>;
  export const Rocket: React.ComponentType<any>;
  export const RotateCcw: React.ComponentType<any>;
  export const Route: React.ComponentType<any>;
  export const Save: React.ComponentType<any>;
  export const Scale: React.ComponentType<any>;
  export const ScanLine: React.ComponentType<any>;
  export const ScanText: React.ComponentType<any>;
  export const Search: React.ComponentType<any>;
  export const Send: React.ComponentType<any>;
  export const Server: React.ComponentType<any>;
  export const Settings: React.ComponentType<any>;
  export const Settings2: React.ComponentType<any>;
  export const Share2: React.ComponentType<any>;
  export const Shield: React.ComponentType<any>;
  export const ShieldAlert: React.ComponentType<any>;
  export const ShieldCheck: React.ComponentType<any>;
  export const ShieldOff: React.ComponentType<any>;
  export const Signal: React.ComponentType<any>;
  export const SlidersHorizontal: React.ComponentType<any>;
  export const Smartphone: React.ComponentType<any>;
  export const Sparkles: React.ComponentType<any>;
  export const Star: React.ComponentType<any>;
  export const Swords: React.ComponentType<any>;
  export const Target: React.ComponentType<any>;
  export const TestTube2: React.ComponentType<any>;
  export const Thermometer: React.ComponentType<any>;
  export const ThumbsUp: React.ComponentType<any>;
  export const Trash2: React.ComponentType<any>;
  export const TrendingUp: React.ComponentType<any>;
  export const TriangleAlert: React.ComponentType<any>;
  export const Trophy: React.ComponentType<any>;
  export const Unlock: React.ComponentType<any>;
  export const Upload: React.ComponentType<any>;
  export const UploadCloud: React.ComponentType<any>;
  export const UserCheck: React.ComponentType<any>;
  export const UserPlus: React.ComponentType<any>;
  export const UserRound: React.ComponentType<any>;
  export const UserRoundCheck: React.ComponentType<any>;
  export const UserRoundCog: React.ComponentType<any>;
  export const Users: React.ComponentType<any>;
  export const UsersRound: React.ComponentType<any>;
  export const Video: React.ComponentType<any>;
  export const Wand2: React.ComponentType<any>;
  export const WandSparkles: React.ComponentType<any>;
  export const Waypoints: React.ComponentType<any>;
  export const Wifi: React.ComponentType<any>;
  export const WifiOff: React.ComponentType<any>;
  export const X: React.ComponentType<any>;
  export const XCircle: React.ComponentType<any>;
  export const Zap: React.ComponentType<any>;
  export const ZoomIn: React.ComponentType<any>;
  export const createContext: React.ComponentType<any>;
  export const useCallback: React.ComponentType<any>;
  export const useContext: React.ComponentType<any>;
  export const useEffect: React.ComponentType<any>;
  export const useMemo: React.ComponentType<any>;
  export const useRef: React.ComponentType<any>;
  export const useState: React.ComponentType<any>;
}
