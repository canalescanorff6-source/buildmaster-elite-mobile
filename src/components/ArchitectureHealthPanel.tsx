'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cpu, Gauge, Image as ImageIcon, Layers3, ScanLine, ShieldCheck } from 'lucide-react';
import { buildArchitectureHealth } from '@/modules/architecture/moduleRegistry';
import {
  devicePerformanceTier,
  recommendedImageMegapixels,
  recommendedOcrConcurrency
} from '@/lib/performanceScheduler';

type RuntimeSnapshot = {
  memoryGb: number | null;
  cores: number | null;
  tier: ReturnType<typeof devicePerformanceTier>;
  ocrConcurrency: number;
  imageMegapixels: number;
};

function readRuntimeSnapshot(): RuntimeSnapshot {
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  return {
    memoryGb: Number.isFinite(navigatorWithMemory.deviceMemory) ? Number(navigatorWithMemory.deviceMemory) : null,
    cores: Number.isFinite(navigator.hardwareConcurrency) ? Number(navigator.hardwareConcurrency) : null,
    tier: devicePerformanceTier(),
    ocrConcurrency: recommendedOcrConcurrency(),
    imageMegapixels: recommendedImageMegapixels()
  };
}

const tierLabel: Record<RuntimeSnapshot['tier'], string> = {
  economy: 'Econômico',
  balanced: 'Equilibrado',
  high: 'Alto desempenho'
};

export function ArchitectureHealthPanel() {
  const architecture = useMemo(() => buildArchitectureHealth(), []);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(readRuntimeSnapshot());
  }, []);

  const status = useMemo(() => {
    if (!snapshot) return 'Analisando';
    return tierLabel[snapshot.tier];
  }, [snapshot]);

  return (
    <section className="architecture-health-panel luxury-panel" aria-labelledby="architecture-health-title">
      <div className="architecture-health-heading">
        <div>
          <p className="kicker"><Layers3 size={15} /> Arquitetura v29.30</p>
          <h3 id="architecture-health-title">Carregamento modular e resposta adaptativa</h3>
          <span>O shell, o OCR, a análise e as regras possuem contratos separados; áreas pesadas continuam sob demanda.</span>
        </div>
        <strong className={`architecture-tier architecture-tier-${snapshot?.tier ?? 'balanced'}`}>{status}</strong>
      </div>

      <div className="architecture-health-grid">
        <article><Layers3 size={19} /><strong>{architecture.isolatedDomains}</strong><span>Domínios isolados</span></article>
        <article><Cpu size={19} /><strong>{snapshot?.cores ?? '—'}</strong><span>Núcleos detectados</span></article>
        <article><Gauge size={19} /><strong>{snapshot?.memoryGb ? `${snapshot.memoryGb} GB` : 'Automático'}</strong><span>Memória informada</span></article>
        <article><ScanLine size={19} /><strong>{snapshot?.ocrConcurrency ?? '—'}</strong><span>OCR simultâneo</span></article>
        <article><ImageIcon size={19} /><strong>{snapshot ? `${snapshot.imageMegapixels} MP` : '—'}</strong><span>Limite recomendado</span></article>
      </div>

      <div className="architecture-health-notes">
        <span><ShieldCheck size={16} /> Novas telas usam a fachada de análise em vez de depender diretamente do arquivo legado.</span>
        <span><ShieldCheck size={16} /> OCR Vision e Base Oficial são módulos lazy com limites de falha próprios.</span>
        <span><ShieldCheck size={16} /> {architecture.lazyModules} de {architecture.totalModules} módulos são carregados somente quando necessários.</span>
      </div>
    </section>
  );
}
