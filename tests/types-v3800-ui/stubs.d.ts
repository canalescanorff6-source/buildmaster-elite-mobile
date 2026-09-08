declare module 'react' {
  export type ChangeEvent<T> = { target: T };
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
}

declare namespace JSX {
  interface Element {}
  interface IntrinsicAttributes { key?: unknown }
  interface IntrinsicElements { [name: string]: any }
}

declare module 'react/jsx-runtime' {
  export const Fragment: unknown;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}

declare module 'lucide-react' {
  type Icon = (props: Record<string, unknown>) => JSX.Element;
  export const Archive: Icon;
  export const ArchiveRestore: Icon;
  export const CheckCircle2: Icon;
  export const ChevronDown: Icon;
  export const Clock3: Icon;
  export const Copy: Icon;
  export const FileText: Icon;
  export const Folder: Icon;
  export const MoreHorizontal: Icon;
  export const RotateCcw: Icon;
  export const Search: Icon;
  export const ShieldAlert: Icon;
  export const SlidersHorizontal: Icon;
  export const Star: Icon;
  export const Trash2: Icon;
}
