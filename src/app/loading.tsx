import { PanelLoadingFallback } from '@/components/PanelLoadingFallback';

export default function Loading() {
  return (
    <main className="app-route-loading" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <PanelLoadingFallback label="Abrindo o BuildMaster" />
    </main>
  );
}
