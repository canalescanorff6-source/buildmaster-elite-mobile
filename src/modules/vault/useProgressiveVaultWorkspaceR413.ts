import { useEffect, useMemo, useRef, useState } from 'react';
import type { CardVisionVaultView } from '@/lib/appNavigationR127';
import { folderForEntry } from '@/lib/vaultUsability';
import type { SavedAnalysis } from './cardHistoryStore';

export const CARDVISION_COMPARE_RENDER_BATCH_R413 = 80 as const;

export function useProgressiveVaultWorkspaceR413(vaultView: CardVisionVaultView, renderHistory: SavedAnalysis[]) {
  const [compareVisibleCountR413, setCompareVisibleCountR413] = useState<number>(CARDVISION_COMPARE_RENDER_BATCH_R413);
  const compareLoadMoreRefR413 = useRef<HTMLDivElement | null>(null);
  const compareViewRefR413 = useRef(vaultView);
  const enteringCompareR413 = vaultView === 'comparar' && compareViewRefR413.current !== 'comparar';
  const effectiveCompareVisibleCountR413 = enteringCompareR413 ? CARDVISION_COMPARE_RENDER_BATCH_R413 : compareVisibleCountR413;
  const compareHistoryR413 = useMemo(() => renderHistory.slice(0, effectiveCompareVisibleCountR413), [renderHistory, effectiveCompareVisibleCountR413]);
  const compareHasMoreR413 = effectiveCompareVisibleCountR413 < renderHistory.length;
  const folderCountsR413 = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of renderHistory) {
      const folderId = folderForEntry(item);
      counts.set(folderId, (counts.get(folderId) ?? 0) + 1);
    }
    return counts;
  }, [renderHistory]);
  const loadMoreCompareR413 = () => setCompareVisibleCountR413(Math.min(renderHistory.length, effectiveCompareVisibleCountR413 + CARDVISION_COMPARE_RENDER_BATCH_R413));

  useEffect(() => {
    const previousView = compareViewRefR413.current;
    compareViewRefR413.current = vaultView;
    if (vaultView === 'comparar' && previousView !== 'comparar') setCompareVisibleCountR413(CARDVISION_COMPARE_RENDER_BATCH_R413);
  }, [vaultView]);

  useEffect(() => {
    const node = compareLoadMoreRefR413.current;
    if (vaultView !== 'comparar' || !node || !compareHasMoreR413 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreCompareR413();
    }, { rootMargin: '720px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [vaultView, renderHistory.length, compareHasMoreR413, effectiveCompareVisibleCountR413]);

  return { compareHistoryR413, compareHasMoreR413, compareLoadMoreRefR413, folderCountsR413, loadMoreCompareR413 };
}
