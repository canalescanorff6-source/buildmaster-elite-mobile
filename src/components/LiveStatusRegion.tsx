'use client';

export function LiveStatusRegion({ message, urgent = false }: { message: string; urgent?: boolean }) {
  return <div className="sr-only" aria-live={urgent ? 'assertive' : 'polite'} aria-atomic="true">{message}</div>;
}
