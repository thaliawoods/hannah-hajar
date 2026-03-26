"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// ─── Vertex shader ─────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// ─── Fragment shader: domain-warped FBM smoke ─────────────────────────────────
const FRAG = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform vec2  uMouse;
  uniform vec2  uResolution;
  varying vec2  vUv;

  // ── value noise ──
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // ── fractional brownian motion ──
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2  shift = vec2(100.0);
    mat2  rot   = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p  = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p      = vUv * aspect;
    float t     = uTime * 0.045;

    // mouse pulls the smoke toward cursor
    vec2  mouse  = uMouse * aspect;
    float mDist  = length(p - mouse);
    float mPull  = 0.12 * exp(-mDist * 2.8);
    vec2  mWarp  = normalize(mouse - p + 0.001) * mPull;

    // domain warping layers
    vec2 q = vec2(
      fbm(p + t + mWarp),
      fbm(p + vec2(5.2, 1.3) + t * 0.8)
    );
    vec2 r = vec2(
      fbm(p + 3.8 * q + vec2(1.7, 9.2) + t * 0.6),
      fbm(p + 3.8 * q + vec2(8.3, 2.8) + t * 0.5)
    );
    float f = fbm(p + 4.2 * r + t * 0.25);
    f = f * 0.5 + 0.5; // remap to [0,1]

    // colour palette: near-black → deep crimson → blood red
    vec3 cBlack   = vec3(0.016, 0.004, 0.008);
    vec3 cCrimson = vec3(0.22,  0.0,   0.045);
    vec3 cRed     = vec3(0.48,  0.0,   0.10);
    vec3 cBright  = vec3(0.69,  0.0,   0.094); // #b00018

    vec3 col = cBlack;
    col = mix(col, cCrimson, smoothstep(0.28, 0.52, f));
    col = mix(col, cRed,     smoothstep(0.50, 0.68, f) * 0.55);
    col = mix(col, cBright,  smoothstep(0.64, 0.78, f) * 0.22);

    // edge vignette
    vec2 vigUv  = vUv * (1.0 - vUv.yx);
    float vig   = pow(vigUv.x * vigUv.y * 15.0, 0.38);
    col        *= 0.45 + 0.55 * vig;

    // subtle pulse from mouse proximity
    col += cBright * 0.06 * exp(-mDist * 5.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Particle system ───────────────────────────────────────────────────────────
const PARTICLE_COUNT = 420;

function createParticles() {
  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const phases     = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 2.2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
    positions[i * 3 + 2] = 0;
    velocities[i * 3]     = (Math.random() - 0.5) * 0.0006;
    velocities[i * 3 + 1] = Math.random() * 0.00055 + 0.00012;
    velocities[i * 3 + 2] = 0;
    phases[i]             = Math.random();
  }
  return { positions, velocities, phases };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── renderer ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // ── scene / camera ──
    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ── background plane with shader ──
    const uniforms = {
      uTime:       { value: 0 },
      uMouse:      { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };
    const bgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    );
    scene.add(bgMesh);

    // ── particles ──
    const { positions, velocities, phases } = createParticles();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", posAttr);

    const pMat = new THREE.PointsMaterial({
      size:        0.0055,
      color:       new THREE.Color(0.75, 0.06, 0.12),
      transparent: true,
      opacity:     0.28,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // ── mouse tracking ──
    const mouse = new THREE.Vector2(0.5, 0.5);
    const mouseTarget = new THREE.Vector2(0.5, 0.5);

    const onMove = (e: MouseEvent) => {
      mouseTarget.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMove);

    // ── resize ──
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── animation loop ──
    let rafId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // lerp mouse
      mouse.lerp(mouseTarget, 0.025);
      uniforms.uTime.value  = t;
      uniforms.uMouse.value.copy(mouse);

      // update particles
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // gentle horizontal drift following mouse
        arr[i * 3]     += velocities[i * 3] + (mouseTarget.x - 0.5) * 0.00025;
        arr[i * 3 + 1] += velocities[i * 3 + 1];
        phases[i]      += 0.0008;

        // slight lateral oscillation
        arr[i * 3] += Math.sin(phases[i] * Math.PI * 2) * 0.00018;

        // respawn at bottom when particle drifts out
        if (arr[i * 3 + 1] > 1.15 || arr[i * 3] > 1.2 || arr[i * 3] < -1.2) {
          arr[i * 3]     = (Math.random() - 0.5) * 2.0;
          arr[i * 3 + 1] = -1.1;
          velocities[i * 3]     = (Math.random() - 0.5) * 0.0006;
          velocities[i * 3 + 1] = Math.random() * 0.00055 + 0.00012;
          phases[i]      = Math.random();
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
