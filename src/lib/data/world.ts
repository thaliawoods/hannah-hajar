import {
  ABSTRACT_LINES,
  BIO_LINES,
  CONCERTS,
  LINKS_LINES,
  TECH_RIDER_LINES,
} from "@/lib/data/concerts";
import { cdnUrl } from "@/lib/bunny";

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

// ── deterministic pseudo-random ───────────────────────────────────────────────
const S = (n: number) => {
  const x = Math.sin(n + 1) * 43758.5453;
  return x - Math.floor(x);
};

// ── media pools ───────────────────────────────────────────────────────────────
const MEDIA_PREFIX = "/hannah-hajar";

const IMAGE_SRCS = [
  `${MEDIA_PREFIX}/2025_03_22%20Ed%27E_Hannah%20Ajar_18.JPG`,
  `${MEDIA_PREFIX}/2025_03_22%20Ed%27E_Hannah%20Ajar_23.JPG`,
  `${MEDIA_PREFIX}/2025_03_22%20Ed%27E_Hannah%20Ajar_37.JPG`,
  `${MEDIA_PREFIX}/8.png`,
  `${MEDIA_PREFIX}/de661b02-e20f-442c-8760-84a4761eead9.JPG`,
  `${MEDIA_PREFIX}/DSC03563.jpeg`,
  `${MEDIA_PREFIX}/DSC03571.jpeg`,
  `${MEDIA_PREFIX}/DSC03583.jpeg`,
  `${MEDIA_PREFIX}/DSC03585.jpeg`,
  `${MEDIA_PREFIX}/DSC03592.jpeg`,
  `${MEDIA_PREFIX}/DSC03613.jpeg`,
  `${MEDIA_PREFIX}/DSC03614.jpeg`,
  `${MEDIA_PREFIX}/DSC03616.jpeg`,
  `${MEDIA_PREFIX}/DSC03617.jpeg`,
  `${MEDIA_PREFIX}/DSC03621.jpeg`,
  `${MEDIA_PREFIX}/DSC1.JPG`,
  `${MEDIA_PREFIX}/hh_pix_doc.JPEG`,
  `${MEDIA_PREFIX}/hh8.jpg`,
  `${MEDIA_PREFIX}/IMG_2858.JPG`,
  `${MEDIA_PREFIX}/IMG_2861.JPG`,
  `${MEDIA_PREFIX}/IMG_2862.JPG`,
  `${MEDIA_PREFIX}/IMG_2864.JPG`,
  `${MEDIA_PREFIX}/IMG_9177.JPG`,
  `${MEDIA_PREFIX}/relais.JPG`,
];

const VIDEO_SRCS = [
  `${MEDIA_PREFIX}/DSC2.MP4`,
  `${MEDIA_PREFIX}/DSC4.MP4`,
  `${MEDIA_PREFIX}/DSC6.MP4`,
  `${MEDIA_PREFIX}/DSC9.MP4`,
  `${MEDIA_PREFIX}/IMG_0393.MOV`,
  `${MEDIA_PREFIX}/IMG_0394.MOV`,
  `${MEDIA_PREFIX}/IMG_6586.MOV`,
  `${MEDIA_PREFIX}/IMG_6588.MOV`,
  `${MEDIA_PREFIX}/IMG_6590.MOV`,
  `${MEDIA_PREFIX}/IMG_8714.MOV`,
];

// ── scatter generators ────────────────────────────────────────────────────────
const XS = 2200;
const YS = 1400;

// Keep media outside the central logo+text zone
function safePos(seed: number): { x: number; y: number } {
  for (let a = 0; a < 30; a++) {
    const x = Math.round((S(seed + a * 0.31 + 3.1) - 0.5) * XS * 2);
    const y = Math.round((S(seed + a * 0.47 + 4.7) - 0.5) * YS * 2);
    if (Math.sqrt(x * x + y * y) > 450) return { x, y };
  }
  return { x: XS * 1.2, y: YS * 1.2 };
}

// Some items get ~180° rotation (upside-down)
function pickRotation(seed: number, maxAngle: number): number {
  if (S(seed + 13) > 0.78) {
    // upside-down: 160–200°
    return Math.round(180 + (S(seed + 14) - 0.5) * 40);
  }
  return Math.round((S(seed + 7.3) - 0.5) * maxAngle * 2);
}

function makeImageNodes(): MapItem[] {
  const nodes: MapItem[] = [];
  IMAGE_SRCS.forEach((path, i) => {
    const appearances = S(i * 17 + 5) > 0.6 ? 2 : 1;
    for (let j = 0; j < appearances; j++) {
      const seed = i * 200 + j * 77;
      const w = Math.round(100 + S(seed + 1.1) * 600);
      const h = Math.min(Math.round(w * (0.5 + S(seed + 2.3) * 1.4)), 900);
      nodes.push({
        id: `img-${i}-${j}`,
        type: "image",
        src: cdnUrl(path),
        ...safePos(seed),
        width: w,
        height: h,
        rotate: pickRotation(seed, 30),
      });
    }
  });
  return nodes;
}

function makeVideoNodes(): MapItem[] {
  return VIDEO_SRCS.map((path, i) => {
    const seed = i * 300 + 99;
    const w = Math.round(280 + S(seed + 1) * 280);
    return {
      id: `vid-${i}`,
      type: "video" as const,
      src: cdnUrl(path),
      ...safePos(seed),
      width: w,
      height: Math.round(w * (9 / 16)),
      rotate: pickRotation(seed, 20),
    };
  });
}

// ── final map ─────────────────────────────────────────────────────────────────
export const MAP_ITEMS: MapItem[] = [
  {
    id: "logo",
    type: "logo",
    src: "/images/logo-hh.svg",
    x: 0,
    y: 0,
    width: 300,
  },
  {
    id: "bio",
    type: "text",
    title: "Bio",
    lines: BIO_LINES,
    previewLines: 6,
    x: -1050,
    y: -480,
    width: 420,
  },
  {
    id: "abstract",
    type: "text",
    title: "Abstract",
    lines: ABSTRACT_LINES,
    previewLines: 6,
    x: 980,
    y: -420,
    width: 520,
  },
  {
    id: "tech",
    type: "text",
    title: "Tech Rider",
    lines: TECH_RIDER_LINES,
    previewLines: 6,
    x: -1300,
    y: 120,
    width: 420,
  },
  {
    id: "links",
    type: "text",
    title: "Links",
    lines: LINKS_LINES,
    previewLines: 4,
    x: 1200,
    y: 420,
    width: 360,
  },
  {
    id: "dates",
    type: "dates",
    title: "Dates",
    x: 1520,
    y: -180,
    width: 360,
    height: 140,
  },
  ...makeImageNodes(),
  ...makeVideoNodes(),
];

export const DATE_LINES = CONCERTS.map((c) =>
  [c.date, c.city, c.venue].filter(Boolean).join(" — ")
);