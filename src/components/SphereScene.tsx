"use client";

import { useRef, useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { IMAGE_ITEMS, VIDEO_ITEMS } from "@/lib/data/media";
import { ABSTRACT_LINES, BIO_LINES, TECH_RIDER_LINES, LINKS_LINES, CONCERTS } from "@/lib/data/concerts";

type ContentItem = {
  id: string;
  type: "image" | "video" | "text";
  src?: string;
  title?: string;
  lines?: string[];
  label?: string;
};

const TEXT_ITEMS: ContentItem[] = [
  { id: "bio", type: "text", title: "Bio", lines: BIO_LINES },
  { id: "abstract", type: "text", title: "Abstract", lines: ABSTRACT_LINES },
  { id: "tech", type: "text", title: "Tech Rider", lines: TECH_RIDER_LINES },
  { id: "links", type: "text", title: "Links", lines: LINKS_LINES },
  { id: "dates", type: "text", title: "Dates", lines: CONCERTS.map(c => [c.date, c.city, c.venue].filter(Boolean).join(" \u2014 ")) },
];

const MEDIA_ITEMS: ContentItem[] = [
  ...IMAGE_ITEMS.map((item, i) => ({ id: "img-" + i, type: "image" as const, src: item.src, label: item.label })),
  ...VIDEO_ITEMS.slice(0, 6).map((item, i) => ({ id: "vid-" + i, type: "video" as const, src: item.src, label: item.label })),
];

const ALL_ITEMS: ContentItem[] = [...TEXT_ITEMS, ...MEDIA_ITEMS];

const SPHERE_R = 5;
const CONTENT_R = SPHERE_R + 0.2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function sunflowerSphere(index: number, total: number, radius: number): THREE.Vector3 {
  const y = 1 - (index / (total - 1)) * 2;
  const radiusAtY = Math.sqrt(1 - y * y);
  const theta = GOLDEN_ANGLE * index;
  return new THREE.Vector3(
    Math.cos(theta) * radiusAtY * radius,
    y * radius,
    Math.sin(theta) * radiusAtY * radius,
  );
}

// ─── Particles (instanced, cheap) ───────────────────────────────────────────
function Particles() {
  const count = 500;
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = SPHERE_R + 1 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#ff1e49" transparent opacity={0.15}
        blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ─── Sphere ─────────────────────────────────────────────────────────────────
const SPHERE_VERT = "varying vec3 vNormal; varying vec3 vPosition; void main() { vNormal = normalize(normalMatrix * normal); vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const SPHERE_FRAG = "uniform float uTime; varying vec3 vNormal; varying vec3 vPosition; void main() { float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), 2.0); float pulse = 0.75 + 0.25 * sin(uTime * 0.6); vec3 color = mix(vec3(0.12, 0.0, 0.03), vec3(0.7, 0.0, 0.1), fresnel * pulse); gl_FragColor = vec4(color, 0.08 + fresnel * 0.45 * pulse); }";

function CentralSphere() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    if (wireRef.current) wireRef.current.rotation.y = clock.getElapsedTime() * 0.02;
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[SPHERE_R, 64, 64]} />
        <shaderMaterial ref={matRef} vertexShader={SPHERE_VERT} fragmentShader={SPHERE_FRAG}
          uniforms={{ uTime: { value: 0 } }} transparent depthWrite={false} />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[SPHERE_R + 0.05, 2]} />
        <meshBasicMaterial wireframe color="#2a0006" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

// ─── Logo (stays centered, faces camera) ────────────────────────────────────
function Logo() {
  const ref = useRef<THREE.Group>(null!);
  const { camera } = useThree();
  useFrame(() => {
    if (ref.current) ref.current.lookAt(camera.position);
  });
  return (
    <group ref={ref} position={[0, 0, SPHERE_R + 0.3]}>
      <Html center distanceFactor={4} style={{ pointerEvents: "none", userSelect: "none" }}>
        <img src="/images/logo-hh.svg" alt="Hannah Hajar" draggable={false}
          style={{ width: "300px", filter: "drop-shadow(0 0 20px rgba(255,30,73,0.4))" }} />
      </Html>
    </group>
  );
}

// ─── Image panel (GPU texture, no Html!) ────────────────────────────────────
function ImagePanel({ item, position, onSelect }: {
  item: ContentItem; position: THREE.Vector3; onSelect: (item: ContentItem) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const rotation = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize());
    return new THREE.Euler().setFromQuaternion(q);
  }, [position]);

  // Load texture
  const texture = useTexture(item.src || "/images/logo-hh.svg");
  texture.colorSpace = THREE.SRGBColorSpace;

  const aspect = texture.image ? texture.image.width / texture.image.height : 1;
  const h = 1.4;
  const w = h * Math.min(aspect, 1.6);

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 1.12 : 1;
    const s = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(s + (target - s) * 0.08);
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}
      onPointerEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerLeave={() => { setHovered(false); document.body.style.cursor = "grab"; }}
      onClick={() => onSelect(item)}
    >
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent
        opacity={hovered ? 0.95 : 0.6}
        side={THREE.DoubleSide} />
    </mesh>
  );
}

// Wrapper with error boundary for texture loading
function SafeImagePanel(props: { item: ContentItem; position: THREE.Vector3; onSelect: (item: ContentItem) => void }) {
  return (
    <Suspense fallback={null}>
      <ImagePanel {...props} />
    </Suspense>
  );
}

// ─── Video panel (just a label, click to open) ─────────────────────────────
function VideoPanel({ item, position, onSelect }: {
  item: ContentItem; position: THREE.Vector3; onSelect: (item: ContentItem) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const rotation = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize());
    return new THREE.Euler().setFromQuaternion(q);
  }, [position]);

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 1.12 : 1;
    const s = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(s + (target - s) * 0.08);
  });

  return (
    <group position={position} rotation={rotation} ref={meshRef as any}
      onPointerEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerLeave={() => { setHovered(false); document.body.style.cursor = "grab"; }}
      onClick={() => onSelect(item)}
    >
      <mesh>
        <planeGeometry args={[1.4, 0.9]} />
        <meshBasicMaterial color="#0a0002" transparent opacity={hovered ? 0.6 : 0.25} side={THREE.DoubleSide} />
      </mesh>
      <Html center distanceFactor={6} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{
          color: "#ff1e49", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase",
          letterSpacing: "0.15em", textAlign: "center", fontSize: "11px", opacity: hovered ? 1 : 0.6,
          transition: "opacity 0.4s",
        }}>
          {"\u25B6"} {item.label || "Video"}
        </div>
      </Html>
    </group>
  );
}

// ─── Text panel (Html, only 5 of these) ─────────────────────────────────────
function TextPanel({ item, position, onSelect }: {
  item: ContentItem; position: THREE.Vector3; onSelect: (item: ContentItem) => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const rotation = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize());
    return new THREE.Euler().setFromQuaternion(q);
  }, [position]);

  useFrame(() => {
    if (!ref.current) return;
    const target = hovered ? 1.1 : 1;
    const s = ref.current.scale.x;
    ref.current.scale.setScalar(s + (target - s) * 0.08);
  });

  return (
    <group position={position} rotation={rotation} ref={ref as any}
      onPointerEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerLeave={() => { setHovered(false); document.body.style.cursor = "grab"; }}
      onClick={() => onSelect(item)}
    >
      <mesh>
        <planeGeometry args={[1.4, 0.7]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <Html center distanceFactor={5} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{
          color: "#ff1e49", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase",
          letterSpacing: "0.25em", textAlign: "center", fontSize: "15px", fontWeight: 600,
          opacity: hovered ? 1 : 0.75, transition: "opacity 0.4s",
          textShadow: "0 0 20px rgba(255,30,73,0.3)",
        }}>
          {item.title}
        </div>
      </Html>
    </group>
  );
}

// ─── Slow rotation wrapper ──────────────────────────────────────────────────
function RotatingGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.025;
  });
  return <group ref={ref}>{children}</group>;
}

// ─── Scene ──────────────────────────────────────────────────────────────────
function SceneContent({ onSelect }: { onSelect: (item: ContentItem) => void }) {
  const positions = useMemo(() => {
    return ALL_ITEMS.map((_, i) => sunflowerSphere(i, ALL_ITEMS.length, CONTENT_R));
  }, []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} color="#ff1e49" intensity={3} distance={20} />
      <fog attach="fog" args={["#040102", 14, 32]} />

      <RotatingGroup>
        <CentralSphere />
        {ALL_ITEMS.map((item, i) => {
          if (item.type === "text") {
            return <TextPanel key={item.id} item={item} position={positions[i]} onSelect={onSelect} />;
          }
          if (item.type === "image" && item.src) {
            return <SafeImagePanel key={item.id} item={item} position={positions[i]} onSelect={onSelect} />;
          }
          if (item.type === "video") {
            return <VideoPanel key={item.id} item={item} position={positions[i]} onSelect={onSelect} />;
          }
          return null;
        })}
      </RotatingGroup>

      {/* Logo stays in center, NOT inside RotatingGroup */}
      <Logo />
      <Particles />
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.04}
        rotateSpeed={0.35} minDistance={SPHERE_R + 2} maxDistance={SPHERE_R + 14} />
    </>
  );
}

// ─── Modal (outside canvas) ─────────────────────────────────────────────────
function Modal({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (item.type === "image" || item.type === "video") {
    return (
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#000",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}>
        <button onClick={onClose} style={{
          position: "fixed", top: "1.2rem", right: "1.5rem", background: "transparent",
          border: "none", color: "#ff1e49", padding: "0.5rem 1.1rem", letterSpacing: "0.22em",
          textTransform: "uppercase", cursor: "pointer", fontSize: "0.6rem",
          fontFamily: "Space Grotesk, sans-serif", zIndex: 10000,
        }}>FERMER \u00B7 ESC</button>
        {item.type === "image" && item.src && (
          <img src={item.src} alt={item.label || "Hannah Hajar"} onClick={e => e.stopPropagation()}
            style={{ maxWidth: "100vw", maxHeight: "100vh", objectFit: "contain", cursor: "default" }} />
        )}
        {item.type === "video" && item.src && (
          <video src={item.src} controls autoPlay onClick={e => e.stopPropagation()}
            style={{ maxWidth: "100vw", maxHeight: "100vh", objectFit: "contain", cursor: "default" }} />
        )}
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1.5rem", background: "rgba(2,0,1,0.9)", backdropFilter: "blur(6px)", zIndex: 9999,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(1200px, 94vw)", maxHeight: "86vh", overflow: "auto",
        background: "#090004", boxShadow: "0 30px 80px rgba(0,0,0,0.55)", padding: "2rem", color: "#ff1e49",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          {item.title && <div style={{ textTransform: "uppercase", letterSpacing: "0.24em", fontSize: "0.95rem" }}>{item.title}</div>}
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: "#ff1e49", letterSpacing: "0.2em",
            textTransform: "uppercase", cursor: "pointer", fontSize: "0.55rem", fontFamily: "Space Grotesk, sans-serif",
          }}>FERMER \u00B7 ESC</button>
        </div>
        {item.lines && (
          <div style={{ lineHeight: 1.5, textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: "0.08em", fontFamily: "Space Grotesk, sans-serif" }}>
            {item.lines.map((line, i) => <p key={i} style={{ margin: i > 0 ? "0.45rem 0 0 0" : "0" }}>{line}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function SphereScene() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [openItem, setOpenItem] = useState<ContentItem | null>(null);

  const handleSelect = useCallback((item: ContentItem) => setOpenItem(item), []);
  const handleClose = useCallback(() => setOpenItem(null), []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    const play = () => { audio.play().catch(() => {}); document.removeEventListener("click", play); };
    document.addEventListener("click", play);
    return () => document.removeEventListener("click", play);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#040102" }}>
      <audio ref={audioRef} src="/audio/drone.mp3" loop preload="auto" />
      <Canvas
        camera={{ position: [0, 1, 14], fov: 55, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ cursor: "grab", position: "relative", zIndex: 1 }}
        onCreated={({ gl }) => { gl.setClearColor("#040102"); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.8; }}
      >
        <SceneContent onSelect={handleSelect} />
      </Canvas>
      {openItem && <Modal item={openItem} onClose={handleClose} />}
      <div style={{
        position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
        color: "rgba(255, 30, 73, 0.55)", fontSize: "0.55rem", letterSpacing: "0.3em",
        textTransform: "uppercase", pointerEvents: "none", whiteSpace: "nowrap",
        fontFamily: "Space Grotesk, sans-serif", zIndex: 10,
      }}>
        Orbit to explore \u00B7 Hover to reveal \u00B7 Click to open
      </div>
    </div>
  );
}
