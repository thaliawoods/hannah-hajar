// src/app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { DATE_LINES, MAP_ITEMS, type MapItem } from "@/lib/data/world";
import { cdnUrl } from "@/lib/bunny";
import ThreeBackground from "@/components/ThreeBackground";
import CursorParticles from "@/components/CursorParticles";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type DragMode =
  | { kind: "pan" }
  | { kind: "item"; id: string; offsetX: number; offsetY: number };

export default function Home() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const worldRef    = useRef<HTMLDivElement | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  const viewRef = useRef({ x: 0, y: 0, scale: 1 });

  const baseTargetRef = useRef({ x: 0, y: 0, scale: 1 });
  const hoverTargetRef = useRef<{ x: number; y: number; scale: number } | null>(null);
  const hoverIdRef = useRef<string | null>(null);
  const hoverLockRef = useRef<{ x: number; y: number } | null>(null);
  const hoverPendingIdRef = useRef<string | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const hoverDelayMs = 160;

  // items en state pour pouvoir bouger en EDIT MODE
  const [items, setItems] = useState<MapItem[]>(MAP_ITEMS);

  const [openItem, setOpenItem] = useState<MapItem | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const editMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("edit") === "1";
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = useMemo(
    () => items.find((it) => it.id === selectedId) ?? null,
    [items, selectedId]
  );

  // --- Smooth camera (target -> current via lerp)
  const rafRef = useRef<number | null>(null);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    mode: DragMode;
    lastX: number;
    lastY: number;
    lastT: number;
    velX: number;
    velY: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    mode: { kind: "pan" },
    lastX: 0,
    lastY: 0,
    lastT: 0,
    velX: 0,
    velY: 0,
  });

  const momentumRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // init target = current
    baseTargetRef.current = viewRef.current;
  }, []);

  useEffect(() => {
    // boucle rAF: rapproche view vers target (smooth)
    const tick = () => {
      // Apply momentum when not dragging and not in hover focus
      const isPanning = dragRef.current.active && dragRef.current.mode.kind === "pan";
      if (!isPanning && !hoverTargetRef.current && momentumRef.current) {
        const m = momentumRef.current;
        m.x *= 0.9;
        m.y *= 0.9;
        if (Math.abs(m.x) < 0.2 && Math.abs(m.y) < 0.2) {
          momentumRef.current = null;
        } else {
          baseTargetRef.current = {
            ...baseTargetRef.current,
            x: baseTargetRef.current.x + m.x,
            y: baseTargetRef.current.y + m.y,
          };
        }
      }

      const t = hoverTargetRef.current ?? baseTargetRef.current;
      const v = viewRef.current;

      // During pan drag: track 1:1 (no lerp lag). For hover focus: slow ease. Idle: snappy.
      const ease = isPanning ? 1.0 : hoverTargetRef.current ? 0.055 : 0.14;

      const nx = v.x + (t.x - v.x) * ease;
      const ny = v.y + (t.y - v.y) * ease;
      const ns = v.scale + (t.scale - v.scale) * ease;

      viewRef.current = { x: nx, y: ny, scale: ns };
      if (worldRef.current) {
        worldRef.current.style.transform = `translate(${nx}px,${ny}px) scale(${ns})`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Logo renders at 1200×456px (node width 300 × img 400%)
    // Target: logo fills ~95% of viewport width, images bleed off edges
    const logoW = 1200;
    const logoH = 456;
    const scale = Math.min(
      (rect.width  * 0.96) / logoW,
      (rect.height * 0.78) / logoH,
      1.6
    );
    const centered = { x: rect.width / 2, y: rect.height / 2, scale };
    // Start off-center (shifted left and slightly up, smaller scale)
    const offset = {
      x: rect.width / 2 - rect.width * 0.28,
      y: rect.height / 2 + rect.height * 0.12,
      scale: scale * 0.8,
    };
    viewRef.current = offset;
    if (worldRef.current) {
      worldRef.current.style.transform =
        `translate(${offset.x}px,${offset.y}px) scale(${offset.scale})`;
    }
    baseTargetRef.current = offset;
    // After a short pause, lerp to center via the existing RAF loop
    setTimeout(() => { baseTargetRef.current = centered; }, 150);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenItem(null);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!openItem) return;
    clearHover();
  }, [openItem]);


  const screenToWorld = (sx: number, sy: number) => {
    const v = hoverTargetRef.current ?? baseTargetRef.current;
    const wx = (sx - v.x) / v.scale;
    const wy = (sy - v.y) / v.scale;
    return { wx, wy };
  };

  const clearHover = () => {
    hoverIdRef.current = null;
    hoverTargetRef.current = null;
    hoverLockRef.current = null;
    hoverPendingIdRef.current = null;
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoveredId(null);
  };

  const getItemFocusTarget = (item: MapItem) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const fallbackW = item.width ?? 360;
    const fallbackH = item.height ?? Math.round(fallbackW * 0.62);

    const padding = 0.12;
    const availableW = rect.width * (1 - padding * 2);
    const availableH = rect.height * (1 - padding * 2);

    const nextScale = clamp(
      Math.min(availableW / fallbackW, availableH / fallbackH),
      0.35,
      4.8
    );

    const nextX = rect.width / 2 - item.x * nextScale;
    const nextY = rect.height / 2 - item.y * nextScale;

    return { x: nextX, y: nextY, scale: nextScale };
  };

  const startHoverDelay = (item: MapItem, event: React.PointerEvent) => {
    if (editMode || openItem) return;

    if (hoverIdRef.current === item.id || hoverPendingIdRef.current === item.id) {
      hoverLockRef.current = { x: event.clientX, y: event.clientY };
      return;
    }

    clearHover();
    hoverPendingIdRef.current = item.id;
    hoverLockRef.current = { x: event.clientX, y: event.clientY };

    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null;
      if (hoverPendingIdRef.current !== item.id) return;
      if (openItem || editMode) return;

      if (hoverLockRef.current) {
        const el = document.elementFromPoint(
          hoverLockRef.current.x,
          hoverLockRef.current.y
        ) as HTMLElement | null;
        const nodeEl = el?.closest("[data-node]") as HTMLElement | null;
        const nextId = nodeEl?.getAttribute("data-node-id");
        if (nextId !== item.id) {
          clearHover();
          return;
        }
      }

      const nextTarget = getItemFocusTarget(item);
      if (!nextTarget) {
        clearHover();
        return;
      }

      hoverPendingIdRef.current = null;
      hoverIdRef.current = item.id;
      setHoveredId(item.id);
      hoverTargetRef.current = nextTarget;
    }, hoverDelayMs);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => undefined);
    }

    // si on clique un node: géré côté node (open modale / edit)
    if ((event.target as HTMLElement).closest("[data-node]")) return;

    clearHover();

    momentumRef.current = null;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: baseTargetRef.current.x,
      originY: baseTargetRef.current.y,
      mode: { kind: "pan" },
      lastX: event.clientX,
      lastY: event.clientY,
      lastT: performance.now(),
      velX: 0,
      velY: 0,
    };
    viewportRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    // gestion hover caméra (quand on n'est pas en drag)
    if (!dragRef.current.active) {
      const lock = hoverLockRef.current;
      const moved = !lock || Math.hypot(event.clientX - lock.x, event.clientY - lock.y) > 8;

      if (moved) {
        const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        const nodeEl = el?.closest("[data-node]") as HTMLElement | null;
        const nextId = nodeEl?.getAttribute("data-node-id");

        if (hoverIdRef.current) {
          if (!nextId) {
            clearHover();
          } else if (nextId !== hoverIdRef.current) {
            const nextItem = items.find((it) => it.id === nextId);
            if (nextItem) startHoverDelay(nextItem, event);
            else clearHover();
          } else {
            hoverLockRef.current = { x: event.clientX, y: event.clientY };
          }
        } else if (hoverPendingIdRef.current) {
          if (!nextId) {
            clearHover();
          } else if (nextId !== hoverPendingIdRef.current) {
            const nextItem = items.find((it) => it.id === nextId);
            if (nextItem) startHoverDelay(nextItem, event);
            else clearHover();
          } else {
            hoverLockRef.current = { x: event.clientX, y: event.clientY };
          }
        } else if (nextId) {
          const nextItem = items.find((it) => it.id === nextId);
          if (nextItem) startHoverDelay(nextItem, event);
        }
      }
    }

    if (!dragRef.current.active) return;

    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;

    if (dragRef.current.mode.kind === "pan") {
      const nextX = dragRef.current.originX + dx;
      const nextY = dragRef.current.originY + dy;
      baseTargetRef.current = { ...baseTargetRef.current, x: nextX, y: nextY };
      // Track velocity for momentum
      const now = performance.now();
      const dt = now - dragRef.current.lastT;
      if (dt > 0) {
        dragRef.current.velX = (event.clientX - dragRef.current.lastX) / dt;
        dragRef.current.velY = (event.clientY - dragRef.current.lastY) / dt;
      }
      dragRef.current.lastX = event.clientX;
      dragRef.current.lastY = event.clientY;
      dragRef.current.lastT = now;
      return;
    }

    if (dragRef.current.mode.kind === "item") {
      const { id, offsetX, offsetY } = dragRef.current.mode;
      const { wx, wy } = screenToWorld(event.clientX, event.clientY);

      const nextX = Math.round(wx - offsetX);
      const nextY = Math.round(wy - offsetY);

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, x: nextX, y: nextY } : it))
      );
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    // Launch momentum if panning fast enough
    if (dragRef.current.mode.kind === "pan") {
      const { velX, velY } = dragRef.current;
      const speed = Math.hypot(velX, velY);
      if (speed > 0.3) {
        momentumRef.current = { x: velX * 120, y: velY * 120 };
      }
    }
    dragRef.current.active = false;
    viewportRef.current?.releasePointerCapture(event.pointerId);
  };

  // Trackpad smooth:
  // - 2 doigts => wheel deltaX/deltaY = pan (sans cliquer)
  // - pinch => wheel avec ctrlKey = zoom
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (hoverTargetRef.current) clearHover();
    momentumRef.current = null;

    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const isPinchZoom = event.ctrlKey;

    const t = baseTargetRef.current;
    const currentScale = t.scale;

    if (isPinchZoom) {
      const zoomIntensity = 0.0022;
      const nextScale = clamp(
        currentScale * (1 - event.deltaY * zoomIntensity),
        0.35,
        2.4
      );

      const worldX = (pointerX - t.x) / currentScale;
      const worldY = (pointerY - t.y) / currentScale;

      const nextX = pointerX - worldX * nextScale;
      const nextY = pointerY - worldY * nextScale;

      baseTargetRef.current = { x: nextX, y: nextY, scale: nextScale };
      return;
    }

    // Pan 2 doigts (sans cliquer)
    baseTargetRef.current = {
      ...t,
      x: t.x - event.deltaX,
      y: t.y - event.deltaY
    };
  };

  const startItemDrag = (event: React.PointerEvent, item: MapItem) => {
    event.preventDefault();
    event.stopPropagation();

    setSelectedId(item.id);

    const { wx, wy } = screenToWorld(event.clientX, event.clientY);
    const offsetX = wx - item.x;
    const offsetY = wy - item.y;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: baseTargetRef.current.x,
      originY: baseTargetRef.current.y,
      mode: { kind: "item", id: item.id, offsetX, offsetY },
      lastX: event.clientX,
      lastY: event.clientY,
      lastT: performance.now(),
      velX: 0,
      velY: 0,
    };

    viewportRef.current?.setPointerCapture(event.pointerId);
  };

  const renderNode = (item: MapItem) => {
    const style: CSSProperties = {
      left: item.x,
      top: item.y,
      width: item.width ? `${item.width}px` : undefined,
      height: item.height ? `${item.height}px` : undefined,
      transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
      ["--base-rot" as string]: `${item.rotate ?? 0}deg`,
    };

    const label = item.title || item.label || item.id;

    const commonProps = editMode
      ? {
          onPointerDown: (e: React.PointerEvent) => startItemDrag(e, item),
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedId(item.id);
          }
        }
      : {
          onClick: () => setOpenItem(item),
          onPointerEnter: (event: React.PointerEvent) => startHoverDelay(item, event)
        };

    if (item.type === "logo" && item.src) {
      return (
        <div key={item.id} className="node node-logo" style={style}>
          <img src={item.src} alt="Hannah Hajar logo" />
          {editMode ? <div className="node-label">{label}</div> : null}
        </div>
      );
    }

    if (item.type === "image" && item.src) {
      return (
        <button
          key={item.id}
          className="node node-media"
          style={style}
          data-node
          data-node-id={item.id}
          {...(hoveredId === item.id ? { "data-awakened": "" } : {})}
          aria-label="Ouvrir l'image"
          {...commonProps}
        >
          <img src={item.src} alt={label} loading="lazy" draggable={false} />
          {editMode ? <div className="node-label">{label}</div> : null}
        </button>
      );
    }

    if (item.type === "video" && item.src) {
      return (
        <button
          key={item.id}
          className="node node-media"
          style={style}
          data-node
          data-node-id={item.id}
          {...(hoveredId === item.id ? { "data-awakened": "" } : {})}
          aria-label="Ouvrir la vidéo"
          {...commonProps}
        >
          <video src={item.src} muted loop playsInline autoPlay preload="metadata" />
          {editMode ? <div className="node-label">{label}</div> : null}
        </button>
      );
    }

    // ✅ TEXT: sur la map = TITRE UNIQUEMENT, clic = ouvre modale
    if (item.type === "text" && item.lines) {
      return (
        <button
          key={item.id}
          className="node node-text"
          style={style}
          data-node
          data-node-id={item.id}
          aria-label={`Ouvrir ${item.title || "texte"}`}
          {...commonProps}
        >
          <div className="node-title">{item.title ?? item.id}</div>
          {editMode ? <div className="node-label">{label}</div> : null}
        </button>
      );
    }

    // ✅ DATES: sur la map = "Dates" uniquement, clic = ouvre modale
    if (item.type === "dates") {
      return (
        <button
          key={item.id}
          className="node node-text"
          style={style}
          data-node
          data-node-id={item.id}
          aria-label="Ouvrir les dates"
          {...commonProps}
        >
          <div className="node-title">{item.title ?? "Dates"}</div>
          {editMode ? <div className="node-label">{label}</div> : null}
        </button>
      );
    }

    return null;
  };

  const renderModalContent = (item: MapItem) => {
    if (item.type === "image" && item.src) return <img src={item.src} alt="Hannah Hajar" />;
    if (item.type === "video" && item.src) return <video src={item.src} controls autoPlay />;
    if (item.type === "audio" && item.src) return <audio src={item.src} controls autoPlay />;

    if (item.type === "text" && item.lines) {
      return (
        <div className="modal-text">
          {item.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      );
    }

    if (item.type === "dates") {
      return (
        <div className="modal-text">
          {DATE_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      );
    }

    return null;
  };

  const updateSelectedXY = (key: "x" | "y", value: number) => {
    if (!selectedItem) return;
    setItems((prev) =>
      prev.map((it) => (it.id === selectedItem.id ? { ...it, [key]: value } : it))
    );
  };

  const copySelectedPatch = async () => {
    if (!selectedItem) return;
    const patch = `{ id: "${selectedItem.id}", x: ${selectedItem.x}, y: ${selectedItem.y} }`;
    try {
      await navigator.clipboard.writeText(patch);
    } catch {}
  };

  return (
    <main className="page">
      <ThreeBackground />
      <audio ref={audioRef} src="/audio/drone.mp3" loop autoPlay preload="auto" />

      <div
        className="viewport"
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div className="world" ref={worldRef}>
          {items.map((item) => renderNode(item))}
        </div>
      </div>

      {/* HUD EDIT */}
      {editMode ? (
        <div className="edit-hud">
          <div>
            <strong>EDIT MODE</strong> — ajoute <code>?edit=1</code> à l'URL
          </div>
          <div style={{ marginTop: 6, opacity: 0.9 }}>
            Clique un contenu pour le sélectionner. Drag & drop pour le déplacer.
          </div>

          {selectedItem ? (
            <>
              <div style={{ marginTop: 10 }}>
                <strong>ID</strong> : {selectedItem.id}
              </div>
              <div className="edit-row">
                <label>X</label>
                <input
                  type="number"
                  value={selectedItem.x}
                  onChange={(e) => updateSelectedXY("x", Number(e.target.value))}
                />
                <label>Y</label>
                <input
                  type="number"
                  value={selectedItem.y}
                  onChange={(e) => updateSelectedXY("y", Number(e.target.value))}
                />
                <button onClick={copySelectedPatch}>COPY</button>
              </div>
              <div style={{ marginTop: 8, opacity: 0.85 }}>
                Patch:{" "}
                <code>{`{ id: "${selectedItem.id}", x: ${selectedItem.x}, y: ${selectedItem.y} }`}</code>
              </div>
            </>
          ) : (
            <div style={{ marginTop: 10, opacity: 0.85 }}>Aucun item sélectionné.</div>
          )}
        </div>
      ) : null}

      {/* Image / Video → red fullscreen modal */}
      {!editMode && openItem && (openItem.type === "image" || openItem.type === "video") ? (
        <div
          className="modal-red"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenItem(null)}
        >
          <button className="modal-red-close" onClick={() => setOpenItem(null)}>
            Fermer&nbsp;·&nbsp;Esc
          </button>
          {openItem.type === "image" && openItem.src && (
            <img src={openItem.src} alt="Hannah Hajar" onClick={e => e.stopPropagation()} />
          )}
          {openItem.type === "video" && openItem.src && (
            <video src={openItem.src} controls autoPlay onClick={e => e.stopPropagation()} />
          )}
        </div>
      ) : null}

      {/* Text / Dates / Audio → dark modal */}
      {!editMode && openItem && openItem.type !== "image" && openItem.type !== "video" ? (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenItem(null)}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              {openItem.title ? <div className="modal-title">{openItem.title}</div> : <div />}
              <button className="modal-close" onClick={() => setOpenItem(null)}>
                Fermer
              </button>
            </div>
            {renderModalContent(openItem)}
          </div>
        </div>
      ) : null}
      <div className="tutorial">
        {openItem
          ? <>Press&nbsp;Esc&nbsp;or&nbsp;click&nbsp;outside&nbsp;to&nbsp;close</>
          : <>Drag to explore&nbsp;&nbsp;·&nbsp;&nbsp;Scroll or pinch to zoom&nbsp;&nbsp;·&nbsp;&nbsp;Hover to reveal&nbsp;&nbsp;·&nbsp;&nbsp;Click to open</>
        }
      </div>

      <CursorParticles isOnRed={
        !!openItem && (openItem.type === "image" || openItem.type === "video")
      } />
    </main>
  );
}
