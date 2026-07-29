'use client';

import { useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Lock, Maximize2, RotateCcw, Save, ScanText, Unlock } from 'lucide-react';
import {
  createDefaultEfhubCalibrationZones,
  isEfhubCalibrationComplete,
  normalizeEfhubCalibrationZones,
  type EfhubCalibrationZone,
  type EfhubCalibrationZoneId
} from '@/modules/card-reader/efhubManualCalibration';

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

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
  onSave: () => void;
  onReset: () => void;
  onRead: () => void;
}) {
  const safeZones = useMemo(() => normalizeEfhubCalibrationZones(zones), [zones]);
  const [activeId, setActiveId] = useState<EfhubCalibrationZoneId>('identity');
  const dragRef = useRef<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const active = safeZones.find((zone) => zone.id === activeId) ?? safeZones[0];
  const complete = isEfhubCalibrationComplete(safeZones);

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

  return (
    <section className="efhub-visual-calibrator" aria-label="Calibrador visual das áreas do perfil eFHUB">
      <header className="efhub-calibrator-head">
        <div>
          <p className="kicker"><Maximize2 size={15}/> Ajustar mapa do print</p>
          <h3>Arraste os 8 quadrados até cada informação</h3>
          <p>Toque em uma área, arraste pelo centro e use os pontos dos cantos para aumentar ou diminuir. Você não precisa digitar nada.</p>
        </div>
        <span className={saved ? 'saved' : ''}>{saved ? <CheckCircle2 size={15}/> : <ScanText size={15}/>} {saved ? 'Mapa salvo' : 'Ajuste pendente'}</span>
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

      <div className="efhub-calibration-canvas" ref={canvasRef}>
        <img src={imageSrc} alt="Print do perfil eFHUB para posicionar as áreas de leitura" draggable={false}/>
        <div className="efhub-calibration-overlay" aria-label="Áreas móveis de leitura">
          {safeZones.map((zone, index) => {
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
      </div>

      <div className="efhub-calibration-tools">
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
        <button type="button" onClick={onReset}><RotateCcw size={17}/> Restaurar os 8 quadrados</button>
        <button type="button" onClick={onSave} disabled={!complete}><Save size={17}/> Salvar este mapa</button>
        <button type="button" className="primary" onClick={onRead} disabled={!complete}><ScanText size={18}/> Ler com os quadrados ajustados</button>
      </footer>
      <p className="efhub-calibrator-help">O mapa é salvo em proporção. Quando outro print tiver a mesma organização, o app reaplica os quadrados mesmo que a resolução seja diferente.</p>
    </section>
  );
}
