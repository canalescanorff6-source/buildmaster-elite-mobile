'use client';

import { CheckCircle2, Clock3, Download, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApkDownloadProgress } from '@/lib/secureStorage';

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

export function formatProgressBytes(value?: number) {
  const bytes = Math.max(0, Number(value || 0));
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes >= 100 * 1024 ? 0 : 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 1 : 2)} MB`;
}

export function formatRemainingTime(seconds?: number | null) {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 10) return 'menos de 10 s';
  if (seconds < 60) return `cerca de ${Math.ceil(seconds / 5) * 5} s`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `cerca de ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `cerca de ${hours} h ${rest} min` : `cerca de ${hours} h`;
}

function formatActivityDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  if (safe < 60) return `${safe}s`;
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return rest ? `${minutes}min ${rest}s` : `${minutes}min`;
}

export function updateOverallPercent(progress: ApkDownloadProgress | null) {
  if (!progress) return 0;
  const transfer = clamp(progress.percent);
  switch (progress.phase) {
    case 'refreshing-manifest': return 1;
    case 'preparing-backup': return 3;
    case 'awaiting-permission': return 4;
    case 'connecting': return 5;
    case 'downloading':
    case 'downloading-system':
    case 'downloading-http': return Math.round(5 + transfer * 0.75);
    case 'copying': return Math.round(80 + transfer * 0.08);
    case 'verifying': return 92;
    case 'opening-installer': return 97;
    case 'ready': return 98;
    default: return transfer;
  }
}

export function updateStageLabel(progress: ApkDownloadProgress | null) {
  if (!progress) return 'Preparando atualização';
  switch (progress.phase) {
    case 'refreshing-manifest': return 'Conferindo versão publicada';
    case 'preparing-backup': return 'Protegendo seus dados';
    case 'awaiting-permission': return 'Aguardando permissão do Android';
    case 'connecting': return 'Conectando ao servidor';
    case 'downloading-system': return 'Baixando pelo Android';
    case 'downloading-http': return 'Baixando pela rota reserva';
    case 'downloading': return 'Baixando atualização';
    case 'copying': return 'Preparando arquivo baixado';
    case 'verifying': return 'Conferindo APK e assinatura';
    case 'opening-installer': return 'Abrindo instalador Android';
    case 'ready': return 'Instalador aberto';
    default: return 'Atualizando aplicativo';
  }
}

function updateStageIndex(progress: ApkDownloadProgress | null) {
  if (!progress) return 1;
  switch (progress.phase) {
    case 'refreshing-manifest': return 1;
    case 'preparing-backup': return 2;
    case 'awaiting-permission': return 3;
    case 'connecting': return 4;
    case 'downloading':
    case 'downloading-system':
    case 'downloading-http': return 5;
    case 'copying': return 6;
    case 'verifying': return 7;
    case 'opening-installer':
    case 'ready': return 8;
    default: return 1;
  }
}

function useTransferEstimate(progress: ApkDownloadProgress | null) {
  const previousRef = useRef<{ at: number; bytes: number } | null>(null);
  const speedRef = useRef(0);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    if (!progress || !['downloading', 'downloading-system', 'downloading-http', 'copying'].includes(progress.phase)) {
      if (progress?.phase === 'connecting' || progress?.phase === 'refreshing-manifest') {
        previousRef.current = null;
        speedRef.current = 0;
        setSpeed(0);
      }
      return;
    }
    const now = Date.now();
    const bytes = Math.max(0, Number(progress.downloadedBytes || 0));
    const previous = previousRef.current;
    if (previous && bytes >= previous.bytes) {
      const elapsed = (now - previous.at) / 1000;
      if (elapsed >= 0.25) {
        const instant = (bytes - previous.bytes) / elapsed;
        if (instant > 0) {
          speedRef.current = speedRef.current > 0 ? speedRef.current * 0.68 + instant * 0.32 : instant;
          setSpeed(speedRef.current);
        }
      }
    }
    previousRef.current = { at: now, bytes };
  }, [progress]);

  const etaSeconds = useMemo(() => {
    if (!progress || speed <= 0 || progress.totalBytes <= progress.downloadedBytes) return null;
    if (!['downloading', 'downloading-system', 'downloading-http', 'copying'].includes(progress.phase)) return null;
    return (progress.totalBytes - progress.downloadedBytes) / speed;
  }, [progress, speed]);

  return { speed, etaSeconds };
}

function useUpdatePhaseActivity(progress: ApkDownloadProgress | null) {
  const phaseStartedAtRef = useRef(Date.now());
  const lastByteActivityRef = useRef({ at: Date.now(), bytes: Math.max(0, Number(progress?.downloadedBytes || 0)) });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const at = Date.now();
    phaseStartedAtRef.current = at;
    lastByteActivityRef.current = { at, bytes: Math.max(0, Number(progress?.downloadedBytes || 0)) };
    setNow(at);
  }, [progress?.phase]);

  useEffect(() => {
    if (!progress) return;
    const bytes = Math.max(0, Number(progress.downloadedBytes || 0));
    if (bytes !== lastByteActivityRef.current.bytes) {
      lastByteActivityRef.current = { at: Date.now(), bytes };
    }
  }, [progress?.downloadedBytes, progress]);

  useEffect(() => {
    if (!progress || progress.phase === 'ready') return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [progress?.phase, progress]);

  return {
    phaseElapsedSeconds: Math.max(0, Math.floor((now - phaseStartedAtRef.current) / 1000)),
    stalledSeconds: Math.max(0, Math.floor((now - lastByteActivityRef.current.at) / 1000)),
  };
}

export function UpdateTransferProgressV4010({ progress, targetVersion, compact = false, completed = false }: {
  progress: ApkDownloadProgress | null;
  targetVersion?: string | null;
  compact?: boolean;
  completed?: boolean;
}) {
  const { speed, etaSeconds } = useTransferEstimate(progress);
  const { phaseElapsedSeconds, stalledSeconds } = useUpdatePhaseActivity(progress);
  const overall = completed ? 100 : updateOverallPercent(progress);
  const stage = completed ? 'Atualização concluída' : updateStageLabel(progress);
  const downloadActive = Boolean(progress && ['downloading', 'downloading-system', 'downloading-http'].includes(progress.phase));
  const stageIndex = completed ? 8 : updateStageIndex(progress);
  const stageTotal = 8;
  const detail = completed
    ? `BuildMaster v${targetVersion || 'nova'} instalado com sucesso.`
    : progress?.phase === 'ready'
      ? 'O APK foi validado. Confirme “Atualizar” no instalador do Android; essa etapa final é controlada pelo sistema.'
      : progress?.phase === 'opening-installer'
        ? 'Download e validação concluídos. Entregando o APK ao instalador do Android.'
        : progress?.phase === 'verifying'
          ? `Conferindo SHA-256, tamanho, pacote e versão • ${formatActivityDuration(phaseElapsedSeconds)} nesta etapa.`
          : progress?.phase === 'copying'
            ? `Copiando o APK baixado para a área segura do instalador • ${formatActivityDuration(phaseElapsedSeconds)} nesta etapa.`
            : progress?.phase === 'awaiting-permission'
              ? 'Ative “Permitir desta fonte” e volte ao BuildMaster para continuar.'
              : progress?.phase === 'preparing-backup'
                ? `Criando a cópia de recuperação antes da troca de versão • ${formatActivityDuration(phaseElapsedSeconds)} nesta etapa.`
                : progress?.phase === 'refreshing-manifest'
                  ? `Consultando versão, tamanho e assinatura do pacote oficial • ${formatActivityDuration(phaseElapsedSeconds)} nesta etapa.`
                  : progress?.phase === 'connecting'
                    ? `Abrindo a rota oficial e aguardando o servidor responder • ${formatActivityDuration(phaseElapsedSeconds)} nesta etapa.`
                    : downloadActive && progress
                      ? progress.downloadedBytes <= 0
                        ? `Aguardando os primeiros dados há ${formatActivityDuration(phaseElapsedSeconds)}. O download continua ativo.`
                        : `${formatProgressBytes(progress.downloadedBytes)}${progress.totalBytes > 0 ? ` de ${formatProgressBytes(progress.totalBytes)}` : ''}${stalledSeconds >= 5 ? ` • sem novos bytes há ${formatActivityDuration(stalledSeconds)}` : ''}`
                      : 'O BuildMaster acompanha cada etapa até entregar o APK ao instalador.';

  const activityMeta = completed
    ? `Etapa ${stageTotal} de ${stageTotal}`
    : downloadActive && speed > 0
      ? `Etapa ${stageIndex} de ${stageTotal} • ${formatProgressBytes(speed)}/s${etaSeconds ? ` • faltam ${formatRemainingTime(etaSeconds)}` : ''}`
      : `Etapa ${stageIndex} de ${stageTotal} • ${formatActivityDuration(phaseElapsedSeconds)} nesta etapa`;

  return <section className={`v4020-operation-progress v4020-update-progress ${compact ? 'is-compact' : ''} ${completed ? 'is-complete' : ''}`} role="status" aria-live="polite" aria-label={`Atualização do aplicativo: ${overall}%`}>
    <div className="v4020-progress-icon">{completed ? <CheckCircle2 size={20} /> : progress?.phase === 'ready' || progress?.phase === 'opening-installer' ? <Smartphone size={20} /> : progress?.phase === 'verifying' ? <ShieldCheck size={20} /> : downloadActive || progress?.phase === 'copying' ? <Download size={20} /> : <Loader2 className="spin" size={20} />}</div>
    <div className="v4020-progress-main">
      <div className="v4020-progress-heading"><div><strong>{stage}</strong>{targetVersion && <span>v{targetVersion}</span>}</div><b>{overall}%</b></div>
      <div className="v4020-progress-track"><i style={{ width: `${overall}%` }} /></div>
      <div className="v4020-progress-meta"><span>{detail}</span><span><Clock3 size={12} /> {activityMeta}</span></div>
    </div>
  </section>;
}

export type ReaderProgressSnapshotV4010 = {
  percent: number;
  phase: string;
  detail: string;
  startedAt: number;
  completed?: number;
  total?: number;
  deadlineMs?: number;
};

export function ReaderProgressBarV4010({ progress }: { progress: ReaderProgressSnapshotV4010 | null }) {
  const [now, setNow] = useState(() => Date.now());
  const percent = clamp(progress?.percent ?? 0);

  useEffect(() => {
    setNow(Date.now());
    if (!progress || percent >= 100) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [progress?.startedAt, percent]);

  const elapsedSeconds = progress ? Math.max(0, (now - progress.startedAt) / 1000) : 0;
  const deadlineSeconds = Math.max(30, Number(progress?.deadlineMs || 90_000) / 1000);
  const completed = Math.max(0, Number(progress?.completed || 0));
  const total = Math.max(0, Number(progress?.total || 0));
  const byFields = completed > 0 && total > completed ? (elapsedSeconds / completed) * (total - completed) : null;
  const safeRemaining = Math.max(0, deadlineSeconds - elapsedSeconds);
  const eta = progress && percent >= 5 && percent < 100
    ? Math.min(safeRemaining, byFields && Number.isFinite(byFields) ? Math.max(5, byFields) : safeRemaining)
    : null;
  return <div className="v4020-reader-progress" aria-label={`Progresso da leitura: ${Math.round(percent)}%`}>
    <div className="v4020-progress-heading"><div><strong>{progress?.phase || 'Preparando leitura'}</strong>{progress?.total ? <span>{Math.min(progress.completed ?? 0, progress.total)}/{progress.total} campos</span> : null}</div><b>{Math.round(percent)}%</b></div>
    <div className="v4020-progress-track"><i style={{ width: `${percent}%` }} /></div>
    <div className="v4020-progress-meta"><span>{progress?.detail || 'Preparando o print.'}</span>{eta ? <span><Clock3 size={12} /> estimativa: {formatRemainingTime(eta)}</span> : null}</div>
  </div>;
}
