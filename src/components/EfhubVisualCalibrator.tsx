'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Lock, Maximize2, RotateCcw, Save, ScanText, Unlock, ZoomIn } from 'lucide-react';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';
import {
  createDefaultEfhubCalibrationZones,
  isEfhubCalibrationComplete,
  normalizeEfhubCalibrationZones,
  type EfhubCalibrationZone,
  type EfhubCalibrationZoneId
} from '@/modules/card-reader/efhubManualCalibration';


function ZoomOutIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
      <path d="M8 11h6" />
    </svg>
  );
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';
type OverlayMode = 'all' | 'active' | 'hidden';
type LensPosition = { x: number; y: number; canvasWidth: number; canvasHeight: number; visible: boolean };
type TouchPoint = { x: number; y: number };
type PinchState = { distance: number; zoom: number };

const ZOOM_STORAGE_KEY = 'buildmaster:efhub-calibrator:last-zoom-v2';
const QUICK_ZOOMS = [100, 200, 300, 400, 500] as const;
const MAGNIFIER_SIZE = 156;
const MAGNIFIER_SCALE = 3;

type DragState = {
  pointerId: number;
  mode: DragMode;
  id: EfhubCalibrationZoneId;
  startClientX: number;
  startClientY: number;
  start: EfhubCalibrationZone;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function updateOne(
  zones: EfhubCalibrationZone[],
  id: EfhubCalibrationZoneId,
  updater: (zone: EfhubCalibrationZone) => EfhubCalibrationZone
) {
  return normalizeEfhubCalibrationZones(zones.map((zone) => zone.id === id ? updater(zone) : zone));
}

export function EfhubVisualCalibrator({
  imageSrc,
  zones,
  saved,
  onChange,
  onSave,
  onReset,
  onRead
}: {
  imageSrc: string;
  zones: EfhubCalibrationZone[];
  saved: boolean;
  onChange: (zones: EfhubCalibrationZone[]) => void;
  onSave: () => boolean;
  onReset: () => void;
  onRead: () => void;
}) {
  const safeZones = useMemo(() => normalizeEfhubCalibrationZones(zones), [zones]);
  const [activeId, setActiveId] = useState<EfhubCalibrationZoneId>('identity');
  const dragRef = useRef<DragState | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const autoZoomAppliedRef = useRef(false);
  const touchPointsRef = useRef(new Map<number, TouchPoint>());
  const pinchRef = useRef<PinchState | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('all');
  const [magnifierEnabled, setMagnifierEnabled] = useState(false);
  const [lens, setLens] = useState<LensPosition>({ x: 0, y: 0, canvasWidth: 0, canvasHeight: 0, visible: false });
  const active = safeZones.find((zone) => zone.id === activeId) ?? safeZones[0];
  const complete = isEfhubCalibrationComplete(safeZones);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setDevicePixelRatio(Math.max(1, window.devicePixelRatio || 1));
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('efhub-calibrator-body-lock', fullscreen);
    return () => document.body.classList.remove('efhub-calibrator-body-lock');
  }, [fullscreen]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => setViewportWidth(Math.max(1, Math.round(viewport.getBoundingClientRect().width)));
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(viewport);
    if (typeof window !== 'undefined') window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); if (typeof window !== 'undefined') window.removeEventListener('resize', measure); };
  }, [fullscreen, imageSrc]);

  useEffect(() => {
    autoZoomAppliedRef.current = false;
    setSourceSize({ width: 0, height: 0 });
    setLens((current) => ({ ...current, visible: false }));
  }, [imageSrc]);

  function readStoredZoom() {
    if (typeof window === 'undefined') return null;
    try {
      const stored = Number(safeStorageGet(ZOOM_STORAGE_KEY));
      return Number.isFinite(stored) && stored >= 100 && stored <= 500 ? stored : null;
    } catch {
      return null;
    }
  }

  function nativeResolutionZoom(naturalWidth = sourceSize.width) {
    const measuredWidth = viewportWidth || viewportRef.current?.getBoundingClientRect().width || 0;
    const fallbackWidth = typeof window !== 'undefined' ? Math.max(280, window.innerWidth - (fullscreen ? 0 : 32)) : 0;
    const availableWidth = measuredWidth > 0 ? measuredWidth : fallbackWidth;
    const dpr = Math.max(1, typeof window !== 'undefined' ? window.devicePixelRatio || devicePixelRatio : devicePixelRatio);
    if (!naturalWidth || !availableWidth) return 100;
    const oneSourcePixelPerScreenPixel = (naturalWidth / dpr / availableWidth) * 100;
    return clamp(Math.round(oneSourcePixelPerScreenPixel / 25) * 25, 100, 500);
  }

  function applyZoom(nextZoom: number, preserveCenter = true) {
    const viewport = viewportRef.current;
    const centerRatioX = viewport && viewport.scrollWidth > 0
      ? (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth
      : 0;
    const centerRatioY = viewport && viewport.scrollHeight > 0
      ? (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight
      : 0;
    const normalized = clamp(Math.round(nextZoom / 25) * 25, 100, 500);
    setZoom(normalized);
    if (typeof window !== 'undefined') {
      safeStorageSet(ZOOM_STORAGE_KEY, String(normalized));
      if (preserveCenter && viewport) {
        window.requestAnimationFrame(() => {
          viewport.scrollLeft = Math.max(0, centerRatioX * viewport.scrollWidth - viewport.clientWidth / 2);
          viewport.scrollTop = Math.max(0, centerRatioY * viewport.scrollHeight - viewport.clientHeight / 2);
        });
      }
    }
  }

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    setSourceSize({ width: naturalWidth, height: naturalHeight });
    if (autoZoomAppliedRef.current) return;
    autoZoomAppliedRef.current = true;
    const applyInitialZoom = () => {
      const stored = readStoredZoom();
      const mobile = typeof window !== 'undefined' && window.innerWidth <= 760;
      const nativeZoom = nativeResolutionZoom(naturalWidth);
      const minimumReadableZoom = mobile ? nativeZoom : Math.min(nativeZoom, 250);
      const storedIsReadable = stored !== null && stored >= Math.min(nativeZoom, 200);
      const recommended = storedIsReadable ? stored : minimumReadableZoom;
      applyZoom(recommended, false);
      const viewport = viewportRef.current;
      if (viewport) { viewport.scrollLeft = 0; viewport.scrollTop = 0; }
    };
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => window.requestAnimationFrame(applyInitialZoom));
    } else {
      applyInitialZoom();
    }
  }

  function changeZoom(delta: number) {
    applyZoom(zoom + delta);
  }

  function toggleFullscreen() {
    setFullscreen((current) => !current);
    setToolsOpen(false);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        const nativeZoom = nativeResolutionZoom();
        if (nativeZoom > zoom) applyZoom(nativeZoom, false);
        focusActiveZone();
      }));
    }
  }

  function pointerDistance(points: TouchPoint[]) {
    if (points.length < 2) return 0;
    return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  }

  function handleViewportPointerDownCapture(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch') return;
    touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...touchPointsRef.current.values()];
    if (points.length === 2) {
      dragRef.current = null;
      pinchRef.current = { distance: Math.max(1, pointerDistance(points)), zoom };
    }
  }

  function handleViewportPointerMoveCapture(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch' || !touchPointsRef.current.has(event.pointerId)) return;
    touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pinch = pinchRef.current;
    const points = [...touchPointsRef.current.values()];
    if (!pinch || points.length < 2) return;
    event.preventDefault();
    const ratio = pointerDistance(points) / Math.max(1, pinch.distance);
    setZoom(clamp(Math.round(pinch.zoom * ratio), 100, 500));
  }

  function handleViewportPointerEndCapture(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch') return;
    const wasPinching = pinchRef.current !== null;
    touchPointsRef.current.delete(event.pointerId);
    if (wasPinching && touchPointsRef.current.size < 2) {
      pinchRef.current = null;
      safeStorageSet(ZOOM_STORAGE_KEY, String(clamp(Math.round(zoom / 25) * 25, 100, 500)));
      return;
    }
    if (touchPointsRef.current.size > 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('.efhub-draggable-zone')) return;
    const now = Date.now();
    const previous = lastTapRef.current;
    if (previous && now - previous.time < 320 && Math.hypot(previous.x - event.clientX, previous.y - event.clientY) < 34) {
      const nativeZoom = nativeResolutionZoom();
      applyZoom(zoom < nativeZoom ? nativeZoom : Math.min(500, nativeZoom + 100));
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, x: event.clientX, y: event.clientY };
    }
  }

  function updateLens(event: PointerEvent<HTMLDivElement>) {
    if (!magnifierEnabled) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    setLens({
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
      canvasWidth: rect.width,
      canvasHeight: rect.height,
      visible: true
    });
  }

  function hideLens() {
    setLens((current) => ({ ...current, visible: false }));
  }

  function startDrag(event: PointerEvent<HTMLElement>, zone: EfhubCalibrationZone, mode: DragMode) {
    if (zone.locked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    event.preventDefault();
    event.stopPropagation();
    setActiveId(zone.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      mode,
      id: zone.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start: zone,
      width: rect.width,
      height: rect.height
    };
  }

  function continueDrag(event: PointerEvent<HTMLElement>) {
    if (pinchRef.current) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const dx = (event.clientX - drag.startClientX) / Math.max(1, drag.width);
    const dy = (event.clientY - drag.startClientY) / Math.max(1, drag.height);
    const minimum = 0.018;
    let { x, y, w, h } = drag.start;

    if (drag.mode === 'move') {
      x = clamp(drag.start.x + dx, 0, 1 - drag.start.w);
      y = clamp(drag.start.y + dy, 0, 1 - drag.start.h);
    } else {
      const right = drag.start.x + drag.start.w;
      const bottom = drag.start.y + drag.start.h;
      if (drag.mode === 'nw' || drag.mode === 'sw') {
        x = clamp(drag.start.x + dx, 0, right - minimum);
        w = right - x;
      }
      if (drag.mode === 'ne' || drag.mode === 'se') {
        w = clamp(drag.start.w + dx, minimum, 1 - drag.start.x);
      }
      if (drag.mode === 'nw' || drag.mode === 'ne') {
        y = clamp(drag.start.y + dy, 0, bottom - minimum);
        h = bottom - y;
      }
      if (drag.mode === 'sw' || drag.mode === 'se') {
        h = clamp(drag.start.h + dy, minimum, 1 - drag.start.y);
      }
    }

    onChange(updateOne(safeZones, drag.id, (zone) => ({ ...zone, x, y, w, h })));
  }

  function finishDrag(event: PointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* no-op */ }
  }

  function nudge(dx: number, dy: number) {
    if (!active || active.locked) return;
    onChange(updateOne(safeZones, active.id, (zone) => ({
      ...zone,
      x: clamp(zone.x + dx, 0, 1 - zone.w),
      y: clamp(zone.y + dy, 0, 1 - zone.h)
    })));
  }

  function resize(dw: number, dh: number) {
    if (!active || active.locked) return;
    onChange(updateOne(safeZones, active.id, (zone) => ({
      ...zone,
      w: clamp(zone.w + dw, 0.018, 1 - zone.x),
      h: clamp(zone.h + dh, 0.018, 1 - zone.y)
    })));
  }

  function focusActiveZone() {
    if (!active) return;
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;
    const targetX = (active.x + active.w / 2) * canvas.scrollWidth;
    const targetY = (active.y + active.h / 2) * canvas.scrollHeight;
    viewport.scrollTo({
      left: Math.max(0, targetX - viewport.clientWidth / 2),
      top: Math.max(0, targetY - viewport.clientHeight / 2),
      behavior: 'smooth'
    });
  }

  function toggleLock() {
    if (!active) return;
    onChange(updateOne(safeZones, active.id, (zone) => ({ ...zone, locked: !zone.locked })));
  }

  function resetSelected() {
    if (!active) return;
    const fallback = createDefaultEfhubCalibrationZones().find((zone) => zone.id === active.id);
    if (!fallback) return;
    onChange(updateOne(safeZones, active.id, () => fallback));
  }

  function closeFullscreen() {
    setFullscreen(false);
    setToolsOpen(false);
    setOverlayMode('all');
    hideLens();
  }

  function saveAndExitFullscreen() {
    if (!complete) return;
    const savedSuccessfully = onSave();
    if (!savedSuccessfully) return;
    closeFullscreen();
  }

  function exitFullscreenWithoutSaving() {
    if (!saved && typeof window !== 'undefined') {
      const confirmed = window.confirm('Existem ajustes ainda não salvos. Sair da tela cheia sem salvar?');
      if (!confirmed) return;
    }
    closeFullscreen();
  }

  const lensLeft = clamp(lens.x - MAGNIFIER_SIZE / 2, 0, Math.max(0, lens.canvasWidth - MAGNIFIER_SIZE));
  const lensTop = clamp(lens.y - MAGNIFIER_SIZE - 24, 0, Math.max(0, lens.canvasHeight - MAGNIFIER_SIZE));
  const nativeZoom = nativeResolutionZoom();
  const displayQuality = zoom <= nativeZoom + 12 ? 'Nitidez nativa' : 'Ampliação digital';
  const renderedCanvasWidth = viewportWidth > 0 ? Math.max(viewportWidth, Math.round(viewportWidth * zoom / 100)) : null;

  const lensStyle = {
    left: lensLeft,
    top: lensTop,
    width: MAGNIFIER_SIZE,
    height: MAGNIFIER_SIZE,
    backgroundImage: `url(${imageSrc})`,
    backgroundSize: `${lens.canvasWidth * MAGNIFIER_SCALE}px ${lens.canvasHeight * MAGNIFIER_SCALE}px`,
    backgroundPosition: `${MAGNIFIER_SIZE / 2 - lens.x * MAGNIFIER_SCALE}px ${MAGNIFIER_SIZE / 2 - lens.y * MAGNIFIER_SCALE}px`
  } as CSSProperties;

  const calibratorContent = (
    <section className={`efhub-visual-calibrator ${fullscreen ? 'is-fullscreen' : ''}`} aria-label="Calibrador visual das áreas do perfil eFHUB">
      {fullscreen && (
        <div className="efhub-fullscreen-bar">
          <button type="button" onClick={exitFullscreenWithoutSaving} aria-label="Sair da tela cheia"><ArrowLeft size={19}/> {saved ? 'Sair' : 'Sair sem salvar'}</button>
          <div><strong>Print original — ajuste preciso</strong><small>{sourceSize.width ? `${sourceSize.width} × ${sourceSize.height}px` : 'Carregando...'} • {zoom}% • {displayQuality}</small></div>
          <button type="button" onClick={() => setOverlayMode((current) => current === 'hidden' ? 'all' : 'hidden')}>{overlayMode === 'hidden' ? 'Mostrar áreas' : 'Imagem limpa'}</button>
        </div>
      )}
      <header className="efhub-calibrator-head">
        <div>
          <p className="kicker"><Maximize2 size={15}/> Ajustar mapa do print</p>
          <h3>Arraste os 9 quadrados até cada informação</h3>
          <p>Toque em uma área, arraste pelo centro e use os pontos dos cantos para aumentar ou diminuir. Você não precisa digitar nada.</p>
        </div>
        <div className="efhub-calibrator-head-actions">
          <span className={saved ? 'saved' : ''}>{saved ? <CheckCircle2 size={15}/> : <ScanText size={15}/>} {saved ? 'Mapa salvo' : 'Ajuste pendente'}</span>
          {!fullscreen && <button type="button" onClick={toggleFullscreen}><Maximize2 size={16}/> Abrir em tela cheia</button>}
        </div>
      </header>

      <div className="efhub-zone-tabs" role="tablist" aria-label="Escolher área para ajustar">
        {safeZones.map((zone, index) => (
          <button
            key={zone.id}
            type="button"
            role="tab"
            aria-selected={zone.id === activeId}
            className={zone.id === activeId ? 'active' : ''}
            style={{ '--zone-color': zone.color } as CSSProperties}
            onClick={() => setActiveId(zone.id)}
          >
            <span>{index + 1}</span>{zone.shortLabel}{zone.locked ? <Lock size={12}/> : null}
          </button>
        ))}
      </div>

      <div className="efhub-image-clarity-toolbar" aria-label="Controles de nitidez e ampliação do print">
        <div>
          <strong><ScanText size={16}/> Arquivo original, sem miniatura e sem filtros</strong>
          <small>{sourceSize.width > 0 ? `${sourceSize.width} × ${sourceSize.height}px` : 'Carregando resolução original...'} • exibição direta do arquivo importado • {displayQuality}.</small>
        </div>
        <div className="efhub-zoom-controls" role="group" aria-label="Ampliar ou reduzir o print">
          <button type="button" onClick={() => changeZoom(-25)} disabled={zoom <= 100} aria-label="Reduzir ampliação"><ZoomOutIcon size={17}/></button>
          <output aria-live="polite">{zoom}%</output>
          <button type="button" onClick={() => changeZoom(25)} disabled={zoom >= 500} aria-label="Aumentar ampliação"><ZoomIn size={17}/></button>
          <button type="button" className="text-button" onClick={() => applyZoom(100)}>Ajustar à tela</button>
          <button type="button" className="text-button" onClick={() => applyZoom(nativeResolutionZoom())} disabled={!sourceSize.width}>Nitidez real</button>
        </div>
        <div className="efhub-quick-zoom-row" role="group" aria-label="Atalhos de zoom">
          <span>Zoom rápido</span>
          {QUICK_ZOOMS.map((value) => (
            <button key={value} type="button" className={zoom === value ? 'active' : ''} aria-pressed={zoom === value} onClick={() => applyZoom(value)}>{value}%</button>
          ))}
        </div>
        <div className="efhub-view-controls" role="group" aria-label="Modos de visualização do calibrador">
          <button type="button" className={magnifierEnabled ? 'active' : ''} aria-pressed={magnifierEnabled} onClick={() => { setMagnifierEnabled((current) => !current); hideLens(); }}><ZoomIn size={15}/> Lupa 3×</button>
          <button type="button" className={overlayMode === 'all' ? 'active' : ''} aria-pressed={overlayMode === 'all'} onClick={() => setOverlayMode('all')}>Todos os quadrados</button>
          <button type="button" className={overlayMode === 'active' ? 'active' : ''} aria-pressed={overlayMode === 'active'} onClick={() => setOverlayMode('active')}>Só o selecionado</button>
          <button type="button" className={overlayMode === 'hidden' ? 'active' : ''} aria-pressed={overlayMode === 'hidden'} onClick={() => setOverlayMode('hidden')}>Imagem limpa</button>
          <button type="button" onClick={focusActiveZone}>Centralizar área</button>
        </div>
      </div>

      <div
        className="efhub-calibration-viewport"
        ref={viewportRef}
        onPointerDownCapture={handleViewportPointerDownCapture}
        onPointerMoveCapture={handleViewportPointerMoveCapture}
        onPointerUpCapture={handleViewportPointerEndCapture}
        onPointerCancelCapture={handleViewportPointerEndCapture}
      >
        <div
          className={`efhub-calibration-canvas ${magnifierEnabled ? 'magnifier-on' : ''}`}
          ref={canvasRef}
          style={{ width: renderedCanvasWidth ? `${renderedCanvasWidth}px` : `${zoom}%` }}
          onPointerMove={updateLens}
          onPointerDown={updateLens}
          onPointerLeave={hideLens}
        >
        <img key={imageSrc} data-original-source="true" src={imageSrc} alt="Print original do perfil eFHUB, sem desfoque, para posicionar as áreas de leitura" draggable={false} loading="eager" decoding="sync" fetchPriority="high" onLoad={handleImageLoad}/>
        <div className={`efhub-calibration-zones-layer mode-${overlayMode}`} aria-label="Áreas móveis de leitura" aria-hidden={overlayMode === 'hidden'}>
          {(overlayMode === 'hidden' ? [] : overlayMode === 'active' ? safeZones.filter((zone) => zone.id === activeId) : safeZones).map((zone) => {
            const index = safeZones.findIndex((item) => item.id === zone.id);
            const selected = zone.id === activeId;
            return (
              <div
                key={zone.id}
                className={`efhub-draggable-zone ${selected ? 'active' : ''} ${zone.locked ? 'locked' : ''}`}
                style={{
                  left: `${zone.x * 100}%`,
                  top: `${zone.y * 100}%`,
                  width: `${zone.w * 100}%`,
                  height: `${zone.h * 100}%`,
                  '--zone-color': zone.color
                } as CSSProperties}
                onPointerDown={(event: PointerEvent<HTMLElement>) => startDrag(event, zone, 'move')}
                onPointerMove={continueDrag}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onClick={(event: MouseEvent<HTMLElement>) => { event.stopPropagation(); setActiveId(zone.id); }}
              >
                <b><span>{index + 1}</span>{zone.shortLabel}</b>
                {selected && !zone.locked && (
                  <>
                    {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                      <i
                        key={corner}
                        className={`resize-handle handle-${corner}`}
                        aria-hidden="true"
                        onPointerDown={(event: PointerEvent<HTMLElement>) => startDrag(event, zone, corner)}
                        onPointerMove={continueDrag}
                        onPointerUp={finishDrag}
                        onPointerCancel={finishDrag}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {magnifierEnabled && lens.visible && (
          <div className="efhub-magnifier-lens" style={lensStyle} aria-hidden="true"><span>3×</span></div>
        )}
        </div>
      </div>

      {fullscreen && (
        <div className="efhub-fullscreen-dock">
          <button type="button" onClick={() => setToolsOpen((current) => !current)}>{toolsOpen ? 'Fechar controles' : `Ajustar: ${active?.shortLabel ?? 'área'}`}</button>
          <button type="button" onClick={() => setOverlayMode((current) => current === 'active' ? 'all' : 'active')}>{overlayMode === 'active' ? 'Todas as áreas' : 'Só esta área'}</button>
          <button type="button" className="primary" onClick={saveAndExitFullscreen} disabled={!complete}><Save size={16}/> Salvar e sair</button>
          <button type="button" onClick={onRead} disabled={!complete}><ScanText size={17}/> Ler print</button>
        </div>
      )}

      <div className={`efhub-calibration-tools ${fullscreen && !toolsOpen ? 'fullscreen-collapsed' : ''}`}>
        <div className="efhub-active-zone-card" style={{ '--zone-color': active?.color } as CSSProperties}>
          <span>Área selecionada</span>
          <strong>{active?.shortLabel}</strong>
          <small>{active?.locked ? 'Travada para não sair do lugar.' : 'Arraste ou use os controles finos.'}</small>
        </div>
        <div className="efhub-nudge-pad" aria-label="Mover área selecionada com precisão">
          <button type="button" aria-label="Mover para cima" onClick={() => nudge(0, -0.0025)} disabled={active?.locked}><ArrowUp size={17}/></button>
          <button type="button" aria-label="Mover para a esquerda" onClick={() => nudge(-0.0025, 0)} disabled={active?.locked}><ArrowLeft size={17}/></button>
          <button type="button" aria-label="Mover para baixo" onClick={() => nudge(0, 0.0025)} disabled={active?.locked}><ArrowDown size={17}/></button>
          <button type="button" aria-label="Mover para a direita" onClick={() => nudge(0.0025, 0)} disabled={active?.locked}><ArrowRight size={17}/></button>
        </div>
        <div className="efhub-size-controls" aria-label="Alterar tamanho da área selecionada">
          <button type="button" onClick={() => resize(-0.004, 0)} disabled={active?.locked}>Mais estreita</button>
          <button type="button" onClick={() => resize(0.004, 0)} disabled={active?.locked}>Mais larga</button>
          <button type="button" onClick={() => resize(0, -0.004)} disabled={active?.locked}>Mais baixa</button>
          <button type="button" onClick={() => resize(0, 0.004)} disabled={active?.locked}>Mais alta</button>
        </div>
        <div className="efhub-zone-actions">
          <button type="button" onClick={toggleLock}>{active?.locked ? <Unlock size={16}/> : <Lock size={16}/>} {active?.locked ? 'Destravar área' : 'Travar área'}</button>
          <button type="button" onClick={resetSelected}><RotateCcw size={16}/> Restaurar esta área</button>
        </div>
      </div>

      <footer className="efhub-calibrator-actions">
        <button type="button" onClick={onReset}><RotateCcw size={17}/> Restaurar os 9 quadrados</button>
        <button type="button" onClick={onSave} disabled={!complete}><Save size={17}/> Salvar este mapa</button>
        <button type="button" className="primary" onClick={onRead} disabled={!complete}><ScanText size={18}/> Ler com os quadrados ajustados</button>
      </footer>
      <p className="efhub-calibrator-help">A imagem exibida vem diretamente do arquivo original, sem preview intermediária, blur, escurecimento ou filtro. O modo Nitidez real usa a proporção de pixels da tela; use a pinça, o duplo toque, a lupa e a tela cheia para ajustar com precisão. O mapa continua proporcional e compatível com outras resoluções.</p>
    </section>
  );

  return fullscreen && mounted && typeof document !== 'undefined'
    ? createPortal(calibratorContent, document.body)
    : calibratorContent;
}
