'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cpu, Gauge, Image as ImageIcon, Layers3, ScanLine, ShieldCheck } from 'lucide-react';
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
          <p className="kicker"><Layers3 size={15} /> Arquitetura v28.50</p>
          <h3 id="architecture-health-title">Carregamento modular e resposta adaptativa</h3>
          <span>As áreas pesadas são abertas sob demanda e o processamento respeita a capacidade deste aparelho.</span>
        </div>
        <strong className={`architecture-tier architecture-tier-${snapshot?.tier ?? 'balanced'}`}>{status}</strong>
      </div>

      <div className="architecture-health-grid">
        <article><Cpu size={19} /><strong>{snapshot?.cores ?? '—'}</strong><span>Núcleos detectados</span></article>
        <article><Gauge size={19} /><strong>{snapshot?.memoryGb ? `${snapshot.memoryGb} GB` : 'Automático'}</strong><span>Memória informada</span></article>
        <article><ScanLine size={19} /><strong>{snapshot?.ocrConcurrency ?? '—'}</strong><span>OCR simultâneo</span></article>
        <article><ImageIcon size={19} /><strong>{snapshot ? `${snapshot.imageMegapixels} MP` : '—'}</strong><span>Limite recomendado</span></article>
      </div>

      <div className="architecture-health-notes">
        <span><ShieldCheck size={16} /> Cofre, Resultado e Meu Time foram separados do núcleo principal.</span>
        <span><ShieldCheck size={16} /> Painéis avançados são pré-carregados apenas quando o aparelho está ocioso.</span>
        <span><ShieldCheck size={16} /> O motor de pontos possui módulo próprio e testes independentes.</span>
      </div>
    </section>
  );
}
