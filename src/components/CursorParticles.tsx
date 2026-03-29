"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  varying  float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_PointSize = aSize;
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3  uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float a = vAlpha * (1.0 - smoothstep(0.15, 0.5, d));
    gl_FragColor = vec4(uColor, a);
  }
`;

const RED_PALETTE: [number, number, number][] = [
  [0.24,  0.0,   0.0  ],
  [0.35,  0.0,   0.0  ],
  [0.478, 0.0,   0.0  ],
  [0.6,   0.0,   0.04 ],
  [0.35,  0.0,   0.02 ],
];

const MAX = 200;

interface Props { isOnRed?: boolean; }

export default function CursorParticles({ isOnRed }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const isOnRedRef = useRef(isOnRed);
  useEffect(() => { isOnRedRef.current = isOnRed; }, [isOnRed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const camera = new THREE.OrthographicCamera(0, W, H, 0, -1, 1);
    const scene  = new THREE.Scene();

    const pos   = new Float32Array(MAX * 3);
    const sizes = new Float32Array(MAX);
    const alpha = new Float32Array(MAX);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,   3));
    geo.setAttribute("aSize",    new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha",   new THREE.BufferAttribute(alpha, 1));
    geo.setDrawRange(0, MAX);

    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: { uColor: { value: new THREE.Vector3(...RED_PALETTE[1]) } },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.NormalBlending,
    });

    scene.add(new THREE.Points(geo, mat));

    type Pt = {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      size: number;
      r: number; g: number; b: number;
    };
    const pool: Pt[] = [];

    let mouseX = W / 2;
    let mouseY = H / 2;

    let isMoving = false;
    let moveTimer: ReturnType<typeof setTimeout> | null = null;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMoving = true;
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(() => { isMoving = false; }, 280);
    };
    window.addEventListener("mousemove", onMove);

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const spawn = (count: number) => {
      if (pool.length >= MAX) return;
      for (let i = 0; i < count && pool.length < MAX; i++) {
        const [r, g, b] = RED_PALETTE[Math.floor(Math.random() * RED_PALETTE.length)];
        if (isMoving) {
          const angle   = Math.random() * Math.PI * 2;
          const speed   = rnd(0.12, 0.9);
          const maxLife = rnd(55, 110) | 0;
          pool.push({ x: mouseX + rnd(-8, 8), y: mouseY + rnd(-8, 8), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: maxLife, maxLife, size: rnd(38, 88), r, g, b });
        } else {
          const maxLife = rnd(70, 130) | 0;
          pool.push({ x: mouseX + rnd(-18, 18), y: mouseY + rnd(-4, 4), vx: rnd(-0.08, 0.08), vy: rnd(0.2, 0.7), life: maxLife, maxLife, size: rnd(50, 110), r, g, b });
        }
      }
    };

    let animId: number;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      spawn(isMoving ? 3 : 1);

      for (let i = pool.length - 1; i >= 0; i--) {
        const p = pool[i];
        if (isMoving) {
          const dx = mouseX - p.x, dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          p.vx += (dx / dist) * 0.06; p.vy += (dy / dist) * 0.06;
          p.vx *= 0.93; p.vy *= 0.93;
        } else {
          p.vy += 0.025; p.vx *= 0.97; p.vy *= 0.995;
        }
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) { pool.splice(i, 1); continue; }
        pos[i * 3] = p.x; pos[i * 3 + 1] = H - p.y; pos[i * 3 + 2] = 0;
        const t = p.life / p.maxLife;
        alpha[i] = t * t * 0.85;
        sizes[i] = p.size * (0.4 + t * 0.6);
      }
      for (let i = pool.length; i < MAX; i++) {
        pos[i * 3] = -9999; pos[i * 3 + 1] = -9999; pos[i * 3 + 2] = 0;
        alpha[i] = 0; sizes[i] = 0;
      }
      if (pool.length > 1) {
        const p = pool[Math.floor(Math.random() * pool.length)];
        (mat.uniforms.uColor.value as THREE.Vector3).set(p.r, p.g, p.b);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate   = true;
      geo.attributes.aSize.needsUpdate    = true;
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(tick);

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H); camera.right = W; camera.top = H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      if (moveTimer) clearTimeout(moveTimer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose(); geo.dispose(); mat.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }} />;
}
