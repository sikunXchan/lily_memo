'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Pencil, Eraser, Undo2, Trash2, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Grid3x3, Layers, X, Save,
} from 'lucide-react';
import { db, type ScribbleDoc, type ScribbleStroke, type Note } from '@/lib/db';

const PEN_COLORS = ['#1a1a1a', '#e94e77', '#3273dc', '#23a55a', '#f5a623', '#9b59b6'];
const PEN_WIDTHS = [1.5, 3, 6];
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const ERASER_RADIUS_WORLD = 14;

interface Pointer { x: number; y: number; id: number; }

export default function ScribbleBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const docIdRef = useRef<number | null>(null);
  const strokesRef = useRef<ScribbleStroke[]>([]);
  const currentStrokeRef = useRef<ScribbleStroke | null>(null);
  const pointersRef = useRef<Map<number, Pointer>>(new Map());
  const lastPinchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const drawingPointerIdRef = useRef<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoStackRef = useRef<ScribbleStroke[][]>([]);
  const loadedRef = useRef(false);

  // Viewport transform: screen = (world - pan) * zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  panRef.current = pan;
  zoomRef.current = zoom;

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [penWidth, setPenWidth] = useState(PEN_WIDTHS[1]);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [splitMode, setSplitMode] = useState<'none' | 'memo'>('none');
  const [splitMemoId, setSplitMemoId] = useState<number | undefined>();
  const [showMemoPicker, setShowMemoPicker] = useState(false);
  const [size, setSize] = useState({ width: 320, height: 480 });
  const [isSaving, setIsSaving] = useState(false);

  const notes = useLiveQuery(() =>
    db.notes.filter(n => !n.deletedAt && (n.type ?? 'text') === 'text').toArray()
  );
  const splitNote = useLiveQuery(
    async () => (splitMemoId ? await db.notes.get(splitMemoId) : undefined),
    [splitMemoId]
  );

  // Load doc on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await db.scribbles.toArray();
      if (cancelled) return;
      if (all.length === 0) {
        const id = await db.scribbles.add({ strokes: [], updatedAt: Date.now() });
        docIdRef.current = id as number;
        strokesRef.current = [];
      } else {
        docIdRef.current = all[0].id ?? null;
        strokesRef.current = all[0].strokes ?? [];
      }
      loadedRef.current = true;
      requestAnimationFrame(redraw);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(() => {
    if (!loadedRef.current || docIdRef.current == null) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setIsSaving(true);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await db.scribbles.update(docIdRef.current!, {
          strokes: strokesRef.current,
          updatedAt: Date.now(),
        });
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, []);

  // Track container size
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: Math.max(80, Math.floor(rect.width)), height: Math.max(80, Math.floor(rect.height)) });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [splitMode, isFullscreen]);

  // Redraw on size / zoom / pan change
  useEffect(() => {
    redraw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, zoom, pan, showGrid]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== size.width * dpr || canvas.height !== size.height * dpr) {
      canvas.width = size.width * dpr;
      canvas.height = size.height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fbfbf6';
    ctx.fillRect(0, 0, size.width, size.height);

    // Compose viewport: scale, then translate(-pan)
    const z = zoomRef.current;
    const p = panRef.current;
    ctx.save();
    ctx.translate(-p.x * z, -p.y * z);
    ctx.scale(z, z);

    if (showGrid) drawGrid(ctx, p, z, size.width, size.height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokesRef.current) drawStroke(ctx, s);
    if (currentStrokeRef.current) drawStroke(ctx, currentStrokeRef.current);

    ctx.restore();
  }, [size.width, size.height, showGrid]);

  function drawStroke(ctx: CanvasRenderingContext2D, s: ScribbleStroke) {
    if (s.points.length === 0) return;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    if (s.points.length === 1) {
      ctx.lineTo(s.points[0].x + 0.01, s.points[0].y + 0.01);
    } else {
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  }

  function drawGrid(ctx: CanvasRenderingContext2D, p: { x: number; y: number }, z: number, viewW: number, viewH: number) {
    // World units between minor lines
    const minor = 25;
    const major = 100;
    // Determine the world-coordinate window visible on screen.
    const worldX0 = p.x;
    const worldY0 = p.y;
    const worldX1 = p.x + viewW / z;
    const worldY1 = p.y + viewH / z;
    const startX = Math.floor(worldX0 / minor) * minor;
    const startY = Math.floor(worldY0 / minor) * minor;
    ctx.lineWidth = 1 / z;
    for (let x = startX; x < worldX1; x += minor) {
      ctx.strokeStyle = (Math.round(x) % major === 0) ? 'rgba(120,130,160,0.30)' : 'rgba(150,160,190,0.13)';
      ctx.beginPath();
      ctx.moveTo(x, worldY0);
      ctx.lineTo(x, worldY1);
      ctx.stroke();
    }
    for (let y = startY; y < worldY1; y += minor) {
      ctx.strokeStyle = (Math.round(y) % major === 0) ? 'rgba(120,130,160,0.30)' : 'rgba(150,160,190,0.13)';
      ctx.beginPath();
      ctx.moveTo(worldX0, y);
      ctx.lineTo(worldX1, y);
      ctx.stroke();
    }
    // Ruler marks along the top and left edges (drawn after restore via overlay div, but simpler: add small ticks here)
  }

  // Convert screen → world coords
  const toWorld = useCallback((sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (sx - rect.left) / zoomRef.current + panRef.current.x;
    const y = (sy - rect.top) / zoomRef.current + panRef.current.y;
    return { x, y };
  }, []);

  const eraseAt = (wx: number, wy: number) => {
    const r = ERASER_RADIUS_WORLD;
    const before = strokesRef.current.length;
    const next = strokesRef.current.filter(s => {
      const w = r + s.width / 2;
      for (const pt of s.points) {
        if (Math.hypot(pt.x - wx, pt.y - wy) <= w) return false;
      }
      return true;
    });
    if (next.length !== before) {
      undoStackRef.current.push(strokesRef.current);
      strokesRef.current = next;
      persist();
      redraw();
    }
  };

  // Pointer event handlers
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2) {
      // Switch to pinch-zoom mode — cancel any in-progress stroke
      if (currentStrokeRef.current) {
        currentStrokeRef.current = null;
        redraw();
      }
      drawingPointerIdRef.current = null;
      initPinch();
      return;
    }

    // Single pointer
    if (tool === 'eraser') {
      const w = toWorld(e.clientX, e.clientY);
      undoStackRef.current.push([...strokesRef.current]);
      eraseAt(w.x, w.y);
      drawingPointerIdRef.current = e.pointerId;
      return;
    }
    // pen
    const w = toWorld(e.clientX, e.clientY);
    currentStrokeRef.current = { points: [w], color, width: penWidth };
    drawingPointerIdRef.current = e.pointerId;
    redraw();
  };

  const initPinch = () => {
    const ps = Array.from(pointersRef.current.values());
    if (ps.length < 2) return;
    const [a, b] = ps;
    lastPinchRef.current = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2) {
      // Pinch
      const ps = Array.from(pointersRef.current.values());
      const [a, b] = ps;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      if (lastPinchRef.current) {
        const ratio = dist / Math.max(1, lastPinchRef.current.dist);
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current * ratio));
        // Zoom around the midpoint: keep world point under (cx,cy) fixed.
        const w = toWorld(cx, cy);
        const dxPan = lastPinchRef.current.cx - cx;
        const dyPan = lastPinchRef.current.cy - cy;
        const newPan = {
          x: w.x - (cx - (canvasRef.current?.getBoundingClientRect().left ?? 0)) / newZoom + dxPan / newZoom,
          y: w.y - (cy - (canvasRef.current?.getBoundingClientRect().top ?? 0)) / newZoom + dyPan / newZoom,
        };
        setZoom(newZoom);
        setPan(newPan);
      }
      lastPinchRef.current = { dist, cx, cy };
      return;
    }

    if (drawingPointerIdRef.current !== e.pointerId) return;

    if (tool === 'eraser') {
      const w = toWorld(e.clientX, e.clientY);
      eraseAt(w.x, w.y);
      return;
    }

    const cs = currentStrokeRef.current;
    if (!cs) return;
    const w = toWorld(e.clientX, e.clientY);
    const last = cs.points[cs.points.length - 1];
    if (last && Math.hypot(last.x - w.x, last.y - w.y) < 0.5 / zoomRef.current) return;
    cs.points.push(w);
    redraw();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) lastPinchRef.current = null;

    if (drawingPointerIdRef.current === e.pointerId) {
      const cs = currentStrokeRef.current;
      if (cs && cs.points.length > 0) {
        undoStackRef.current.push([...strokesRef.current]);
        if (undoStackRef.current.length > 50) undoStackRef.current.shift();
        strokesRef.current = [...strokesRef.current, cs];
        currentStrokeRef.current = null;
        persist();
        redraw();
      } else {
        currentStrokeRef.current = null;
      }
      drawingPointerIdRef.current = null;
    }
  };

  const undo = () => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    strokesRef.current = prev;
    persist();
    redraw();
  };

  const clearAll = () => {
    if (strokesRef.current.length === 0) return;
    if (!confirm('落書きをすべて消去しますか？')) return;
    undoStackRef.current.push([...strokesRef.current]);
    strokesRef.current = [];
    persist();
    redraw();
  };

  const zoomIn = () => {
    const next = Math.min(MAX_ZOOM, zoomRef.current * 1.25);
    setZoom(next);
  };
  const zoomOut = () => {
    const next = Math.max(MIN_ZOOM, zoomRef.current / 1.25);
    setZoom(next);
  };
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={`scribble-root ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <div className="scribble-toolbar">
        <button
          className={`tb-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => setTool('pen')}
          title="ペン"
        >
          <Pencil size={16} />
        </button>
        <button
          className={`tb-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="消しゴム"
        >
          <Eraser size={16} />
        </button>
        <div className="tb-divider" />
        <div className="tb-colors">
          {PEN_COLORS.map(c => (
            <button
              key={c}
              className={`tb-color ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => { setColor(c); setTool('pen'); }}
              aria-label={`色 ${c}`}
            />
          ))}
        </div>
        <div className="tb-divider" />
        <div className="tb-widths">
          {PEN_WIDTHS.map(w => (
            <button
              key={w}
              className={`tb-width ${penWidth === w ? 'active' : ''}`}
              onClick={() => { setPenWidth(w); setTool('pen'); }}
              aria-label={`太さ ${w}`}
            >
              <span style={{ width: w * 2.5, height: w * 2.5, background: color }} />
            </button>
          ))}
        </div>
        <div className="tb-divider" />
        <button className="tb-btn" onClick={undo} title="一手戻す"><Undo2 size={16} /></button>
        <button className="tb-btn" onClick={clearAll} title="全消去"><Trash2 size={16} /></button>
        <div className="tb-divider" />
        <button className="tb-btn" onClick={zoomOut} title="縮小"><ZoomOut size={16} /></button>
        <button className="tb-btn tb-zoom-label" onClick={resetView} title="表示を中央に戻す">
          {Math.round(zoom * 100)}%
        </button>
        <button className="tb-btn" onClick={zoomIn} title="拡大"><ZoomIn size={16} /></button>
        <div className="tb-divider" />
        <button
          className={`tb-btn ${showGrid ? 'active' : ''}`}
          onClick={() => setShowGrid(v => !v)}
          title="メモリ（方眼）表示"
        >
          <Grid3x3 size={16} />
        </button>
        <button
          className={`tb-btn ${splitMode === 'memo' ? 'active' : ''}`}
          onClick={() => {
            if (splitMode === 'memo') setSplitMode('none');
            else { setSplitMode('memo'); setShowMemoPicker(!splitMemoId); }
          }}
          title="メモを上に表示"
        >
          <Layers size={16} />
        </button>
        <button
          className="tb-btn"
          onClick={() => setIsFullscreen(v => !v)}
          title={isFullscreen ? '全画面解除' : '全画面で編集'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <div className="tb-spacer" />
        <div className="tb-saved">
          {isSaving ? '…保存中' : <><Save size={12} /> 保存済</>}
        </div>
      </div>

      {splitMode === 'memo' && (
        <div className="split-panel">
          <div className="split-header">
            <button
              className="split-pick-btn"
              onClick={() => setShowMemoPicker(v => !v)}
            >
              {splitNote ? (splitNote.title || '無題のメモ') : 'メモを選択…'}
            </button>
            <button className="split-close" onClick={() => setSplitMode('none')} title="閉じる">
              <X size={16} />
            </button>
          </div>
          {showMemoPicker ? (
            <div className="split-picker">
              {(notes ?? []).map(n => (
                <button
                  key={n.id}
                  className={`split-pick-item ${splitMemoId === n.id ? 'active' : ''}`}
                  onClick={() => { setSplitMemoId(n.id); setShowMemoPicker(false); }}
                >
                  {n.title || '無題のメモ'}
                </button>
              ))}
              {(notes ?? []).length === 0 && <div className="split-empty">メモがありません</div>}
            </div>
          ) : (
            <div
              className="split-content"
              // Renders the memo's stored HTML — strokes are limited to user-authored content
              // already trusted in the app, and there's no untrusted source here.
              dangerouslySetInnerHTML={{ __html: splitNote?.content ?? '' }}
            />
          )}
        </div>
      )}

      <div className="scribble-stage" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="scribble-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: 'none' }}
        />
      </div>

      <style jsx>{`
        .scribble-root {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          background: var(--background);
        }
        .scribble-root.is-fullscreen {
          position: fixed;
          inset: 0;
          z-index: 5000;
          padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
        }
        .scribble-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 10px;
          background: var(--accent);
          border-bottom: 1px solid var(--border);
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          flex-shrink: 0;
        }
        .scribble-toolbar::-webkit-scrollbar { display: none; }
        .tb-btn {
          background: var(--background);
          color: var(--foreground);
          padding: 6px;
          border-radius: 8px;
          border: 1px solid transparent;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tb-btn.active {
          border-color: var(--primary);
          color: var(--primary);
        }
        .tb-zoom-label {
          padding: 6px 8px;
          font-size: 0.72rem;
          font-weight: 600;
          min-width: 50px;
        }
        .tb-divider {
          width: 1px;
          align-self: stretch;
          background: var(--border);
          flex-shrink: 0;
        }
        .tb-colors, .tb-widths {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-shrink: 0;
        }
        .tb-color {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid transparent;
          padding: 0;
          flex-shrink: 0;
        }
        .tb-color.active {
          border-color: var(--foreground);
        }
        .tb-width {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background);
          border-radius: 8px;
          border: 1px solid transparent;
          flex-shrink: 0;
        }
        .tb-width.active {
          border-color: var(--primary);
        }
        .tb-width > span {
          display: block;
          border-radius: 50%;
        }
        .tb-spacer { flex: 1; }
        .tb-saved {
          font-size: 0.7rem;
          color: #888;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 6px;
          flex-shrink: 0;
        }

        .split-panel {
          height: 40%;
          min-height: 140px;
          max-height: 60%;
          border-bottom: 1px solid var(--border);
          background: var(--background);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .split-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--accent);
          border-bottom: 1px solid var(--border);
        }
        .split-pick-btn {
          flex: 1;
          text-align: left;
          background: var(--background);
          color: var(--foreground);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid var(--border);
        }
        .split-close {
          background: transparent;
          color: var(--foreground);
          opacity: 0.6;
          padding: 4px;
          border-radius: 6px;
        }
        .split-picker {
          flex: 1;
          overflow-y: auto;
          padding: 6px;
        }
        .split-pick-item {
          display: block;
          width: 100%;
          text-align: left;
          background: transparent;
          color: var(--foreground);
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .split-pick-item.active {
          background: var(--accent);
          color: var(--primary);
          font-weight: 600;
        }
        .split-empty {
          padding: 16px;
          color: #888;
          font-size: 0.85rem;
          text-align: center;
        }
        .split-content {
          flex: 1;
          overflow-y: auto;
          padding: 14px 18px;
          font-size: 0.92rem;
          line-height: 1.6;
          color: var(--foreground);
        }
        .split-content :global(img) { max-width: 100%; height: auto; }
        .split-content :global(p) { margin: 0 0 0.5em; }

        .scribble-stage {
          flex: 1;
          position: relative;
          min-height: 0;
          overflow: hidden;
          background: #fbfbf6;
        }
        .scribble-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          touch-action: none;
        }
        :global([data-theme='dark']) .scribble-stage { background: #f5f5f0; }
      `}</style>
    </div>
  );
}
