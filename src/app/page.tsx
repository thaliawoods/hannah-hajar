"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { DATE_LINES, MAP_ITEMS, type MapItem } from "@/lib/data/world";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type DragMode =
  | { kind: "pan" }
  | { kind: "item"; id: string; offsetX: number; offsetY: number };

export default function Home() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef(view);

  // items en state pour pouvoir bouger en EDIT MODE
  const [items, setItems] = useState<MapItem[]>(MAP_ITEMS);

  const [openItem, setOpenItem] = useState<MapItem | null>(null);

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
  const targetRef = useRef({ x: 0, y: 0, scale: 1 });
  const rafRef = useRef<number | null>(null);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    mode: DragMode;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    mode: { kind: "pan" }
  });

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    // init target = current
    targetRef.current = viewRef.current;
  }, []);

  useEffect(() => {
    // boucle rAF: rapproche view vers target (smooth)
    const tick = () => {
      const t = targetRef.current;
      const v = viewRef.current;

      const ease = 0.18; // + petit = + smooth (0.12 à 0.22)

      const nx = v.x + (t.x - v.x) * ease;
      const ny = v.y + (t.y - v.y) * ease;
      const ns = v.scale + (t.scale - v.scale) * ease;

      const done =
        Math.abs(t.x - nx) < 0.05 &&
        Math.abs(t.y - ny) < 0.05 &&
        Math.abs(t.scale - ns) < 0.0005;

      if (!done) {
        setView({ x: nx, y: ny, scale: ns });
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

    const initial = { x: rect.width / 2, y: rect.height / 2, scale: 1 };
    setView(initial);
    targetRef.current = initial;
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

  const screenToWorld = (sx: number, sy: number) => {
    const v = targetRef.current; // on se base sur la "target" pour cohérence
    const wx = (sx - v.x) / v.scale;
    const wy = (sy - v.y) / v.scale;
    return { wx, wy };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // retry autoplay
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => undefined);
    }

    // si on clique un node: en edit, c'est géré côté node. sinon ça ouvre la modale
    if ((event.target as HTMLElement).closest("[data-node]")) return;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: targetRef.current.x,
      originY: targetRef.current.y,
      mode: { kind: "pan" }
    };
    viewportRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;

    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;

    if (dragRef.current.mode.kind === "pan") {
      const nextX = dragRef.current.originX + dx;
      const nextY = dragRef.current.originY + dy;
      targetRef.current = { ...targetRef.current, x: nextX, y: nextY };
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

    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const isPinchZoom = event.ctrlKey;

    const t = targetRef.current;
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

      targetRef.current = { x: nextX, y: nextY, scale: nextScale };
      return;
    }

    // Pan 2 doigts (sans cliquer)
    targetRef.current = {
      ...t,
      x: t.x - event.deltaX,
      y: t.y - event.deltaY
    };
  };

  const startItemDrag = (event: React.PointerEvent, item: MapItem) => {
    // empêcher le click d’ouvrir la modale en edit
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
      originX: targetRef.current.x,
      originY: targetRef.current.y,
      mode: { kind: "item", id: item.id, offsetX, offsetY }
    };

    viewportRef.current?.setPointerCapture(event.pointerId);
  };

  const renderNode = (item: MapItem) => {
    const style: CSSProperties = {
      left: item.x,
      top: item.y,
      width: item.width ? `${item.width}px` : undefined,
      height: item.height ? `${item.height}px` : undefined,
      transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`
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
          onClick: () => setOpenItem(item)
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
          aria-label="Ouvrir la vidéo"
          {...commonProps}
        >
          <video src={item.src} muted loop playsInline autoPlay preload="metadata" />
          {editMode ? <div className="node-label">{label}</div> : null}
        </button>
      );
    }

    if (item.type === "text" && item.lines) {
      const preview = item.lines.slice(0, item.previewLines ?? 2);
      return (
        <button
          key={item.id}
          className="node node-text"
          style={style}
          data-node
          aria-label={`Ouvrir ${item.title || "texte"}`}
          {...commonProps}
        >
          {preview.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {editMode ? <div className="node-label">{label}</div> : null}
        </button>
      );
    }

    if (item.type === "dates") {
      return (
        <button
          key={item.id}
          className="node node-text"
          style={style}
          data-node
          aria-label="Ouvrir les dates"
          {...commonProps}
        >
          {DATE_LINES.slice(0, 2).map((line) => (
            <p key={line}>{line}</p>
          ))}
          {editMode ? <div className="node-label">{label}</div> : null}
        </button>
      );
    }

    return null;
  };

  const renderModalContent = (item: MapItem) => {
    if (item.type === "image" && item.src)
      return <img src={item.src} alt="Hannah Hajar" />;
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
      <audio ref={audioRef} src="/audio/drone.mp3" loop autoPlay preload="auto" />

      <div
        className="viewport"
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          className="world"
          style={
            {
              "--tx": `${view.x}px`,
              "--ty": `${view.y}px`,
              "--scale": view.scale
            } as CSSProperties
          }
        >
          {items.map((item) => renderNode(item))}
        </div>
      </div>

      {/* HUD EDIT */}
      {editMode ? (
        <div className="edit-hud">
          <div>
            <strong>EDIT MODE</strong> — ajoute <code>?edit=1</code> à l’URL
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

      {/* Modale normale (désactivée en edit) */}
      {!editMode && openItem ? (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setOpenItem(null)}>
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
    </main>
  );
}
