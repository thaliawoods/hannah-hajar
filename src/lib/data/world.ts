import {
  ABSTRACT_LINES,
  BIO_LINES,
  CONCERTS,
  LINKS_LINES,
  TECH_RIDER_LINES
} from "@/lib/data/concerts";

export type MapItem = {
  id: string;
  type: "logo" | "image" | "video" | "text" | "dates" | "audio";
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotate?: number;
  src?: string;
  title?: string;
  lines?: string[];
  previewLines?: number;
  label?: string;
};

const grid = {
  cellW: 380,
  cellH: 340,
  gapX: 80,
  gapY: 90
};

const place = (col: number, row: number) => {
  const x = col * (grid.cellW + grid.gapX);
  const y = row * (grid.cellH + grid.gapY);
  return { x, y };
};

const images = [
  "/images/hannah-01.jpg",
  "/images/hannah-02.jpg",
  "/images/hannah-03.jpg",
  "/images/hannah-04.png",
  "/images/hannah-05.png",
  "/images/hannah-06.png",
  "/images/hannah-07.png",
  "/images/hannah-08.png",
  "/images/hannah-09.png",
  "/images/hannah-10.png",
  "/images/hannah-11.png",
  "/images/hannah-12.png",
  "/images/hannah-13.png",
  "/images/hannah-14.png",
  "/images/hannah-15.png",
  "/images/hannah-16.png",
  "/images/hannah-17.png",
  "/images/hannah-18.png"
];

const mainSlots = [
  { id: "img-1", src: images[0], size: [420, 320], ...place(-2, -2) },
  { id: "img-2", src: images[1], size: [360, 360], ...place(0, -2) },
  { id: "img-3", src: images[2], size: [360, 360], ...place(2, -2) },
  { id: "img-4", src: images[3], size: [300, 360], ...place(4, -2) },
  { id: "img-5", src: images[4], size: [360, 320], ...place(-2, 0) },
  { id: "img-6", src: images[5], size: [360, 360], ...place(4, 0) },
  { id: "img-7", src: images[6], size: [360, 280], ...place(-2, 2) }
];

const farSlots = images.slice(7).map((src, index) => {
  const col = (index % 5) * 2 + 8;
  const row = Math.floor(index / 5) * 2 - 2;
  const { x, y } = place(col, row);
  return {
    id: `img-far-${index + 1}`,
    src,
    x,
    y,
    width: 320,
    height: 240
  };
});

/** Positions enregistrées depuis l'EDIT MODE */
const POS_PATCH: Record<string, { x: number; y: number }> = {
  bio: { x: -337, y: -443 },
  abstract: { x: 652, y: -387 },
  tech: { x: -896, y: -35 },
  links: { x: 915, y: 454 },
  dates: { x: 1361, y: 302 },

  "concert-1": { x: -531, y: -986 },
  "concert-2": { x: 1449, y: -222 },
  "concert-3": { x: -141, y: -1498 },
  "concert-4": { x: -1753, y: -724 },
  "concert-5": { x: -361, y: 901 },

  "image-1": { x: -1898, y: 725 },
  "image-2": { x: 165, y: -826 },
  "image-3": { x: 757, y: -860 },
  "image-4": { x: 1362, y: -698 },
  "image-5": { x: -701, y: 437 },
  "image-6": { x: -1959, y: 154 },
  "image-7": { x: -1056, y: 835 },

  "img-far-1": { x: 1180, y: -1306 },
  "img-far-2": { x: -1424, y: 306 },
  "img-far-3": { x: -739, y: -1413 },
  "img-far-4": { x: -9, y: 508 },
  "img-far-5": { x: -1580, y: -223 },
  "img-far-6": { x: 1433, y: 692 },
  "img-far-7": { x: -1045, y: -564 },
  "img-far-8": { x: -1226, y: -1032 },
  "img-far-9": { x: 518, y: -1436 },
  "img-far-10": { x: -1638, y: -1362 },
  "img-far-11": { x: 1897, y: 162 }
};

const withPatchedXY = <T extends { id: string; x: number; y: number }>(
  item: T
): T => {
  const p = POS_PATCH[item.id];
  return p ? ({ ...item, x: p.x, y: p.y } as T) : item;
};

export const MAP_ITEMS: MapItem[] = [
  withPatchedXY({
    id: "logo",
    type: "logo",
    src: "/images/logo-hh.svg",
    x: 0,
    y: 0,
    width: 300
  }),
  withPatchedXY({
    id: "bio",
    type: "text",
    title: "Bio",
    lines: BIO_LINES,
    previewLines: 6,
    ...place(-1, 0),
    width: 420,
    height: 220
  }),
  withPatchedXY({
    id: "abstract",
    type: "text",
    title: "Abstract",
    lines: ABSTRACT_LINES,
    previewLines: 6,
    ...place(1, 0),
    width: 520,
    height: 220
  }),
  withPatchedXY({
    id: "tech",
    type: "text",
    title: "Tech Rider",
    lines: TECH_RIDER_LINES,
    previewLines: 6,
    ...place(3, 0),
    width: 420,
    height: 220
  }),
  withPatchedXY({
    id: "links",
    type: "text",
    title: "Links",
    lines: LINKS_LINES,
    previewLines: 4,
    ...place(3, 1),
    width: 360,
    height: 200
  }),
  withPatchedXY({
    id: "dates",
    type: "dates",
    title: "Dates",
    ...place(4, 2),
    width: 360,
    height: 140
  }),
  withPatchedXY({
    id: "live",
    type: "video",
    src: "/video/live-select.mp4",
    title: "Live Select",
    ...place(1, 2),
    width: 520,
    height: 280
  }),
  withPatchedXY({
    id: "concert-1",
    type: "video",
    src: "/video/concert_1.MOV",
    title: "Concert 1",
    ...place(8, -2),
    width: 420,
    height: 320
  }),
  withPatchedXY({
    id: "concert-2",
    type: "video",
    src: "/video/concert_2.MOV",
    title: "Concert 2",
    ...place(10, -2),
    width: 320,
    height: 360
  }),
  withPatchedXY({
    id: "concert-3",
    type: "video",
    src: "/video/concert_3.MOV",
    title: "Concert 3",
    ...place(12, -2),
    width: 360,
    height: 320
  }),
  withPatchedXY({
    id: "concert-4",
    type: "video",
    src: "/video/concert_4.MOV",
    title: "Concert 4",
    ...place(14, -2),
    width: 300,
    height: 360
  }),
  withPatchedXY({
    id: "concert-5",
    type: "video",
    src: "/video/concert_5.MOV",
    title: "Concert 5",
    ...place(16, -2),
    width: 360,
    height: 320
  }),

  ...mainSlots.map((slot, index) =>
    withPatchedXY({
      id: `image-${index + 1}`,
      type: "image" as const,
      src: slot.src,
      x: slot.x,
      y: slot.y,
      width: slot.size[0],
      height: slot.size[1],
      rotate: 0
    })
  ),

  ...farSlots.map((slot) =>
    withPatchedXY({
      id: slot.id,
      type: "image" as const,
      src: slot.src,
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      rotate: 0
    })
  )
];

export const DATE_LINES = CONCERTS.map((concert) =>
  [concert.date, concert.city, concert.venue].filter(Boolean).join(" — ")
);
