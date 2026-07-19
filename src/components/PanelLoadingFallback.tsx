import { Loader2 } from 'lucide-react';

export function PanelLoadingFallback({ label = 'Carregando módulo' }: { label?: string }) {
  return (
    <section className="panel-loading-fallback luxury-panel" role="status" aria-live="polite">
      <Loader2 className="spin" size={22} />
      <div><strong>{label}</strong><span>Preparando somente os recursos necessários para esta área.</span></div>
    </section>
  );
}
