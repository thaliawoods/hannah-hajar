"use client";

import React, { useRef, useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { IMAGE_ITEMS, VIDEO_ITEMS } from "@/lib/data/media";
import CursorParticles from "@/components/CursorParticles";
import { ABSTRACT_LINES, BIO_LINES, TECH_RIDER_LINES, LINKS_LINES, LINKS_DATA, CONCERTS } from "@/lib/data/concerts";

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

const IMAGE_LIST: ContentItem[] = IMAGE_ITEMS.map((item, i) => ({ id: "img-" + i, type: "image" as const, src: item.src, label: item.label }));
const VIDEO_LIST: ContentItem[] = VIDEO_ITEMS.slice(0, 6).map((item, i) => ({ id: "vid-" + i, type: "video" as const, src: item.src, label: item.label }));

const MEDIA_ITEMS: ContentItem[] = [];
const vidInterval = Math.floor(IMAGE_LIST.length / (VIDEO_LIST.length + 1));
let vidIdx = 0;
for (let i = 0; i < IMAGE_LIST.length; i++) {
  MEDIA_ITEMS.push(IMAGE_LIST[i]);
  if (vidIdx < VIDEO_LIST.length && (i + 1) % vidInterval === 0) {
    MEDIA_ITEMS.push(VIDEO_LIST[vidIdx++]);
  }
}
while (vidIdx < VIDEO_LIST.length) MEDIA_ITEMS.push(VIDEO_LIST[vidIdx++]);

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
function applyGeoid(v: THREE.Vector3): THREE.Vector3 {
  const r = v.length();
  if (r === 0) return v;
  const lat = Math.asin(v.y / r);
  const lon = Math.atan2(v.z, v.x);
  const flatFactor = 1.0 - 0.25 * Math.sin(lat) * Math.sin(lat);
  const bump = 1.0
    + 0.03 * Math.sin(3.0 * lat) * Math.cos(2.0 * lon)
    + 0.02 * Math.sin(5.0 * lat + 1.0) * Math.cos(4.0 * lon + 0.5)
    + 0.015 * Math.cos(7.0 * lon + 2.0) * Math.sin(2.0 * lat);
  const newR = r * flatFactor * bump;
  const scale = newR / r;
  return new THREE.Vector3(v.x * scale * 1.4, v.y * flatFactor, v.z * scale * 1.4);
}



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

const SPHERE_VERT = "varying vec3 vNormal; varying vec3 vPosition; void main() { vNormal = normalize(normalMatrix * normal); vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const SPHERE_FRAG = "uniform float uTime; varying vec3 vNormal; varying vec3 vPosition; void main() { float edge = abs(dot(vNormal, normalize(-vPosition))); float alpha = pow(edge, 3.0) * 0.6; gl_FragColor = vec4(0.01, 0.002, 0.005, alpha); }";

function CentralSphere() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(2.2, 64, 48);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const r = Math.sqrt(x * x + y * y + z * z);
      const lat = Math.asin(y / r);
      const lon = Math.atan2(z, x);
      const flatFactor = 1.0 - 0.25 * Math.sin(lat) * Math.sin(lat);
      const bump = 1.0
        + 0.03 * Math.sin(3.0 * lat) * Math.cos(2.0 * lon)
        + 0.02 * Math.sin(5.0 * lat + 1.0) * Math.cos(4.0 * lon + 0.5)
        + 0.015 * Math.cos(7.0 * lon + 2.0) * Math.sin(2.0 * lat);
      const newR = r * flatFactor * bump;
      const scale = newR / r;
      pos.setXYZ(i, x * scale * 1.4, y * flatFactor, z * scale * 1.4);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <group>
      <mesh geometry={geo}>
        <shaderMaterial ref={matRef} vertexShader={SPHERE_VERT} fragmentShader={SPHERE_FRAG}
          uniforms={{ uTime: { value: 0 } }} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

function Logo() {
  const ref = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();
  const texture = useTexture("/images/logo-hh.svg");
  texture.colorSpace = THREE.SRGBColorSpace;

  const aspect = texture.image ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height : 3;
  const logoH = 0.9;
  const logoW = logoH * aspect;

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.lookAt(camera.position);
      const breathe = 1 + Math.sin(clock.getElapsedTime() * 0.8) * 0.04;
      ref.current.scale.setScalar(breathe);
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, 0]} renderOrder={999}>
      <planeGeometry args={[logoW, logoH]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

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

  const texture = useTexture(item.src || "/images/logo-hh.svg");
  texture.colorSpace = THREE.SRGBColorSpace;

  const aspect = texture.image ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height : 1;
  const h = 1.9;
  const w = h * Math.min(aspect, 1.6);

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 1.12 : 1;
    const s = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(s + (target - s) * 0.08);
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}
      onPointerEnter={() => { setHovered(true);  }}
      onPointerLeave={() => { setHovered(false);  }}
      onClick={() => onSelect(item)}
    >
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent
        opacity={hovered ? 0.95 : 0.6}
        side={THREE.DoubleSide} />
    </mesh>
  );
}

class ImageErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

function SafeImagePanel(props: { item: ContentItem; position: THREE.Vector3; onSelect: (item: ContentItem) => void }) {
  return (
    <ImageErrorBoundary>
      <Suspense fallback={null}>
        <ImagePanel {...props} />
      </Suspense>
    </ImageErrorBoundary>
  );
}

function VideoPanel({ item, position, onSelect }: {
  item: ContentItem; position: THREE.Vector3; onSelect: (item: ContentItem) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  const rotation = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize());
    return new THREE.Euler().setFromQuaternion(q);
  }, [position]);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = hovered ? 1.12 : 1;
    const s = groupRef.current.scale.x;
    groupRef.current.scale.setScalar(s + (target - s) * 0.08);
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}
      onPointerEnter={() => { setHovered(true);  }}
      onPointerLeave={() => { setHovered(false);  }}
      onClick={() => onSelect(item)}
    >
      <mesh>
        <planeGeometry args={[2.1, 1.5]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <Html center distanceFactor={5} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{ position: "relative", width: "180px" }}>
          <video src={item.src} muted loop playsInline autoPlay preload="metadata"
            style={{
              width: "100%", height: "auto", objectFit: "cover", borderRadius: "2px",
              opacity: hovered ? 0.9 : 0.55,
              filter: hovered ? "brightness(0.9)" : "brightness(0.45) saturate(0.4)",
              transition: "opacity 0.5s, filter 0.5s",
            }} />

        </div>
      </Html>
    </group>
  );
}

function TextPanel({ item, position, onSelect }: {
  item: ContentItem; position: THREE.Vector3; onSelect: (item: ContentItem) => void;
}) {
  const ref = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  useFrame(() => {
    if (!ref.current) return;
    ref.current.lookAt(camera.position);
    const target = hovered ? 1.1 : 1;
    const s = ref.current.scale.x;
    ref.current.scale.setScalar(s + (target - s) * 0.08);
  });

  return (
    <group position={position} ref={ref}
      onPointerEnter={() => { setHovered(true);  }}
      onPointerLeave={() => { setHovered(false);  }}
      onClick={() => onSelect(item)}
    >
      <mesh renderOrder={998}>
        <planeGeometry args={[1.4, 0.7]} />
        <meshBasicMaterial transparent opacity={0} depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Html center distanceFactor={5} zIndexRange={[9999, 9999]} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div style={{
          color: "rgba(255, 30, 73, 0.55)", fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif", textTransform: "uppercase",
          letterSpacing: "0.25em", textAlign: "center", fontSize: "18px", fontWeight: 900,
          opacity: hovered ? 1 : 0.85, transition: "opacity 0.4s, color 0.4s",
          ...(hovered ? { color: "rgba(255, 30, 73, 0.85)" } : {}),
        }}>
          {item.title}
        </div>
      </Html>
    </group>
  );
}


function LogoMenuGroup({ onSelect }: { onSelect: (item: ContentItem) => void }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

  const menuLayout = isMobile ? [
    { id: "bio",      y: -1.2,  x: 0 },
    { id: "abstract", y: 1.2,   x: -1.6 },
    { id: "tech",     y: 1.2,   x: 1.6 },
    { id: "links",    y: -1.6,  x: -1.6 },
    { id: "dates",    y: -1.6,  x: 1.6 },
  ] : [
    { id: "bio",      y: -1.5,  x: 0 },
    { id: "abstract", y: 1.6,   x: -2.5 },
    { id: "tech",     y: 1.6,   x: 2.5 },
    { id: "links",    y: -2.1,  x: -2.6 },
    { id: "dates",    y: -2.1,  x: 2.6 },
  ];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.lookAt(camera.position);
    const logo = groupRef.current.children[0] as THREE.Mesh;
    if (logo) {
      const breathe = 1 + Math.sin(clock.getElapsedTime() * 0.8) * 0.04;
      logo.scale.setScalar(breathe);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} renderOrder={999}>
      <Suspense fallback={null}>
        <LogoMesh />
      </Suspense>

      {TEXT_ITEMS.map((item) => {
        const layout = menuLayout.find(l => l.id === item.id);
        if (!layout) return null;
        return (
          <group key={item.id} position={[layout.x, layout.y, 0]}>
            <mesh renderOrder={998}>
              <planeGeometry args={[1.4, 0.7]} />
              <meshBasicMaterial transparent opacity={0} depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <Html center distanceFactor={5} zIndexRange={[9999, 9999]}
              style={{ pointerEvents: "auto", userSelect: "none", cursor: "pointer" }}>
              <div
                onClick={() => onSelect(item)}
                style={{
                  color: "rgba(255, 30, 73, 0.55)",
                  fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.25em",
                  textAlign: "center",
                  fontSize: isMobile ? "18px" : "30px",
                  fontWeight: 900,
                  cursor: "pointer",
                  transition: "opacity 0.4s, color 0.4s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255, 30, 73, 0.85)"; e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255, 30, 73, 0.55)"; e.currentTarget.style.opacity = "0.85"; }}
              >
                {item.title}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function LogoMesh() {
  const texture = useTexture("/images/logo-hh.svg");
  texture.colorSpace = THREE.SRGBColorSpace;
  const aspect = texture.image ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height : 3;
  const logoH = 1.7;
  const logoW = logoH * aspect;

  return (
    <mesh renderOrder={999}>
      <planeGeometry args={[logoW, logoH]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function TrackpadOrbitControls() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const spherical = new THREE.Spherical();
    const minDist = SPHERE_R - 0.5;
    const maxDist = SPHERE_R + 5;

    // Velocity-based smoothing
    let velocityTheta = 0;
    let velocityPhi = 0;
    let rafId: number;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        spherical.setFromVector3(camera.position);
        spherical.radius = Math.max(minDist, Math.min(maxDist, spherical.radius + e.deltaY * 0.05));
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
      } else {
        velocityTheta -= e.deltaX * 0.0003;
        velocityPhi -= e.deltaY * 0.0003;
      }
    };

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      if (Math.abs(velocityTheta) < 0.00001 && Math.abs(velocityPhi) < 0.00001) return;

      spherical.setFromVector3(camera.position);
      spherical.theta += velocityTheta;
      spherical.phi += velocityPhi;
      spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      velocityTheta *= 0.92;
      velocityPhi *= 0.92;
    };
    rafId = requestAnimationFrame(animate);

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      cancelAnimationFrame(rafId);
    };
  }, [camera, gl]);

  return (
    <OrbitControls
      enablePan={false}
      enableDamping
      dampingFactor={0.04}
      rotateSpeed={0.35}
      enableZoom={false}
      minDistance={SPHERE_R - 0.5}
      maxDistance={SPHERE_R + 5}
      minPolarAngle={0.01}
      maxPolarAngle={Math.PI - 0.01}
      mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.ROTATE }}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
    />
  );
}

const INNER_SMOKE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const INNER_SMOKE_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  vec2 hash2(vec2 p) { p = vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
  float vnoise(vec2 p) { vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f); float a=dot(hash2(i),f); float b=dot(hash2(i+vec2(1,0)),f-vec2(1,0)); float c=dot(hash2(i+vec2(0,1)),f-vec2(0,1)); float d=dot(hash2(i+vec2(1,1)),f-vec2(1,1)); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
  float fbm(vec2 p) { float v=0.0; float a=0.5; vec2 shift=vec2(100.0); mat2 rot=mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.5)); for(int i=0;i<4;i++){v+=a*vnoise(p);p=rot*p*2.0+shift;a*=0.5;} return v; }

  void main() {
    vec2 p = vUv * 2.0;
    float t = uTime * 0.04;
    vec2 q = vec2(fbm(p+t), fbm(p+vec2(5.2,1.3)+t*0.8));
    vec2 r = vec2(fbm(p+3.8*q+vec2(1.7,9.2)+t*0.6), fbm(p+3.8*q+vec2(8.3,2.8)+t*0.5));
    float f = fbm(p+5.0*r+t*0.2);
    f = f*0.5+0.5;

    vec3 cBlack = vec3(0.004,0.0005,0.002);
    vec3 cCrimson = vec3(0.06,0.0,0.015);
    vec3 cRed = vec3(0.14,0.0,0.03);
    vec3 col = cBlack;
    col = mix(col, cCrimson, smoothstep(0.22,0.48,f));
    col = mix(col, cRed, smoothstep(0.42,0.60,f)*0.45);

    float fresnel = 1.0 - abs(dot(vNormal, normalize(-vPosition)));
    float alpha = smoothstep(0.2, 0.8, fresnel) * 0.9;

    gl_FragColor = vec4(col, alpha);
  }
`;

function InnerSmoke() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <mesh renderOrder={997}>
      <sphereGeometry args={[3, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={INNER_SMOKE_VERT}
        fragmentShader={INNER_SMOKE_FRAG}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthTest={false}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

const SMOKE_VERT = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const SMOKE_FRAG = [
  "precision mediump float;",
  "uniform float uTime;",
  "varying vec2 vUv;",
  "vec2 hash2(vec2 p) { p = vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }",
  "float vnoise(vec2 p) { vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f); float a=dot(hash2(i),f); float b=dot(hash2(i+vec2(1,0)),f-vec2(1,0)); float c=dot(hash2(i+vec2(0,1)),f-vec2(0,1)); float d=dot(hash2(i+vec2(1,1)),f-vec2(1,1)); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }",
  "float fbm(vec2 p) { float v=0.0; float a=0.5; vec2 shift=vec2(100.0); mat2 rot=mat2(cos(0.5),sin(0.5),-sin(0.5),cos(0.5)); for(int i=0;i<4;i++){v+=a*vnoise(p);p=rot*p*2.0+shift;a*=0.5;} return v; }",
  "void main() {",
  "  vec2 p = vUv * 2.0;",
  "  float t = uTime * 0.04;",
  "  vec2 q = vec2(fbm(p+t), fbm(p+vec2(5.2,1.3)+t*0.8));",
  "  vec2 r = vec2(fbm(p+3.8*q+vec2(1.7,9.2)+t*0.6), fbm(p+3.8*q+vec2(8.3,2.8)+t*0.5));",
  "  float f = fbm(p+5.0*r+t*0.2);",
  "  f = f*0.5+0.5;",
  "  vec3 cBlack = vec3(0.004,0.0005,0.002);",
  "  vec3 cCrimson = vec3(0.06,0.0,0.015);",
  "  vec3 cRed = vec3(0.14,0.0,0.03);",
  "  vec3 cBright = vec3(0.22,0.0,0.04);",
  "  vec3 col = cBlack;",
  "  col = mix(col, cCrimson, smoothstep(0.22,0.48,f));",
  "  col = mix(col, cRed, smoothstep(0.42,0.60,f)*0.45);",
  "  col = mix(col, cBright, smoothstep(0.58,0.74,f)*0.18);",
  "  gl_FragColor = vec4(col, 1.0);",
  "}",
].join("\n");

function SmokeBackground() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <mesh>
      <sphereGeometry args={[50, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={SMOKE_VERT}
        fragmentShader={SMOKE_FRAG}
        uniforms={{ uTime: { value: 0 } }}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
function RotatingGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.025;
  });
  return <group ref={ref}>{children}</group>;
}

function SceneContent({ onSelect }: { onSelect: (item: ContentItem) => void }) {
  const positions = useMemo(() => {
    const textLayout = [
      { y: -0.6, x: 0 },     // Bio - just below logo
      { y: 1.0, x: -1.5 },   // Abstract - above logo left
      { y: 1.0, x: 1.5 },    // Tech Rider - above logo right
      { y: -1.2, x: -1.8 },  // Links - below left
      { y: -1.2, x: 1.8 },   // Dates - below right
    ];
    const textPositions = TEXT_ITEMS.map((_, ti) => {
      const layout = textLayout[ti];
      const ny = layout.y / CONTENT_R;
      const z = Math.sqrt(Math.max(0.01, 1 - ny * ny)) * CONTENT_R;
      return applyGeoid(new THREE.Vector3(layout.x, layout.y, z));
    });

    const mediaPositions = MEDIA_ITEMS.map((_, i) => {
      const total = MEDIA_ITEMS.length;
      const y = 1 - (i / (total - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = GOLDEN_ANGLE * (i + 1);
      return applyGeoid(new THREE.Vector3(
        Math.cos(theta) * radiusAtY * CONTENT_R,
        y * CONTENT_R,
        Math.sin(theta) * radiusAtY * CONTENT_R,
      ));
    });

    return ALL_ITEMS.map((item) => {
      if (item.type === "text") {
        const ti = TEXT_ITEMS.findIndex(t => t.id === item.id);
        return textPositions[ti];
      }
      const mi = MEDIA_ITEMS.findIndex(m => m.id === item.id);
      return mediaPositions[mi];
    });
  }, []);

  return (
    <>
      <SmokeBackground />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} color="#ff1e49" intensity={3} distance={20} />

      <RotatingGroup>
        <CentralSphere />
        {ALL_ITEMS.map((item, i) => {
          if (item.type === "image" && item.src) {
            return <SafeImagePanel key={item.id} item={item} position={positions[i]} onSelect={onSelect} />;
          }
          if (item.type === "video") {
            return <VideoPanel key={item.id} item={item} position={positions[i]} onSelect={onSelect} />;
          }
          return null;
        })}
      </RotatingGroup>

      <LogoMenuGroup onSelect={onSelect} />
      <TrackpadOrbitControls />
    </>
  );
}

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
          border: "none", color: "rgba(255, 30, 73, 0.55)", padding: "0.5rem 1.1rem", letterSpacing: "0.22em",
          textTransform: "uppercase", cursor: "pointer", fontSize: "0.6rem",
          fontFamily: "Josafronde, Space Grotesk, sans-serif", zIndex: 10000,
        }}>FERMER · ESC</button>
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
    <div onClick={onClose} className="modal-overlay" style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1.5rem", background: "rgba(2,0,1,0.9)", backdropFilter: "blur(6px)", zIndex: 9999,
    }}>
      <div onClick={e => e.stopPropagation()} className="modal-card-inner" style={{
        width: "min(1200px, 94vw)", maxHeight: "86vh",
        background: "#090004", boxShadow: "0 30px 80px rgba(0,0,0,0.55)", color: "rgba(255, 30, 73, 0.55)",
        display: "flex", flexDirection: "column" as const,
      }}>
        <div style={{ padding: "clamp(1.2rem, 4vw, 2rem)", paddingBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            {item.title && <div style={{ textTransform: "uppercase", letterSpacing: "0.3em", fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontFamily: "'Enclav Acadam', sans-serif", fontWeight: 700 }}>{item.title}</div>}
            <button onClick={onClose} style={{
              background: "transparent", border: "none", color: "rgba(255, 30, 73, 0.55)", letterSpacing: "0.2em",
              textTransform: "uppercase", cursor: "pointer", fontSize: "0.55rem", fontFamily: "Josafronde, Space Grotesk, sans-serif", flexShrink: 0,
            }}>FERMER · ESC</button>
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 clamp(1.2rem, 4vw, 2rem) clamp(1.2rem, 4vw, 2rem)" }}>
          {item.id === "links" ? (
            <div style={{ lineHeight: 1.5, textTransform: "uppercase", fontSize: "clamp(0.7rem, 2.5vw, 0.9rem)", letterSpacing: "0.08em", fontFamily: "Josafronde, Space Grotesk, sans-serif" }}>
              {LINKS_DATA.map((link, i) => (
                <p key={i} style={{ margin: i > 0 ? "0.45rem 0 0 0" : "0" }}>
                  {link.url ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none", borderBottom: "1px solid rgba(255, 30, 73, 0.3)", paddingBottom: "1px", transition: "border-color 0.3s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderBottomColor = "rgba(255, 30, 73, 0.8)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderBottomColor = "rgba(255, 30, 73, 0.3)"; }}
                    >{link.label}</a>
                  ) : link.label}
                </p>
              ))}
            </div>
          ) : item.lines && (
            <div style={{ lineHeight: 1.5, textTransform: "uppercase", fontSize: "clamp(0.7rem, 2.5vw, 0.9rem)", letterSpacing: "0.08em", fontFamily: "Josafronde, Space Grotesk, sans-serif" }}>
              {item.lines.map((line, i) => <p key={i} style={{ margin: i > 0 ? "0.45rem 0 0 0" : "0" }}>{line}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SphereScene({ onReady }: { onReady?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [openItem, setOpenItem] = useState<ContentItem | null>(null);

  const [zoomingItem, setZoomingItem] = useState<ContentItem | null>(null);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = useCallback((item: ContentItem) => {
    setZoomingItem(item);
    zoomTimerRef.current = setTimeout(() => {
      setZoomingItem(null);
      setOpenItem(item);
    }, 800);
  }, []);
  const handleClose = useCallback(() => {
    setOpenItem(null);
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    audio.play().catch(() => {
      const play = () => { audio.play().catch(() => {}); document.removeEventListener("click", play); };
      document.addEventListener("click", play);
      return () => document.removeEventListener("click", play);
    });
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#040102" }}>
      <audio ref={audioRef} src="/audio/drone.mp3" loop preload="auto" />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 55, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ position: "relative", zIndex: 1 }}
        onCreated={({ gl }) => { gl.setClearColor("#040102"); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.8; onReady?.(); }}
      >
        <SceneContent onSelect={handleSelect} />
      </Canvas>
      <style dangerouslySetInnerHTML={{ __html: `
        @font-face {
          font-family: "Enclav Acadam";
          src: url("/fonts/EnclavAcadam-Regular.woff2") format("woff2"),
               url("/fonts/EnclavAcadam-Regular.woff") format("woff");
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: "Josafronde";
          src: url("/fonts/Josafronde-Regular.woff2") format("woff2"),
               url("/fonts/Josafronde-Regular.woff") format("woff");
          font-weight: 400;
          font-style: normal;
        }
      `}} />
      {zoomingItem && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "zoomIn 0.8s ease-in-out forwards",
          pointerEvents: "none",
        }}>
          <style>{"@keyframes zoomIn { 0% { background: rgba(0,0,0,0); } 100% { background: rgba(0,0,0,0.95); } }"}</style>
        </div>
      )}
      {openItem && <Modal item={openItem} onClose={handleClose} />}
      <div style={{
        position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
        color: "rgba(255, 30, 73, 0.55)", fontSize: "clamp(0.4rem, 1.5vw, 0.55rem)", letterSpacing: "0.3em",
        textTransform: "uppercase", pointerEvents: "none", whiteSpace: "nowrap", maxWidth: "90vw", textAlign: "center" as const,
        fontFamily: "Josafronde, Space Grotesk, sans-serif", zIndex: 10,
      }}>
        Scroll to turn the orbit · Pinch to zoom · Click to open
      </div>
      {!openItem && <CursorParticles />}
    </div>
  );
}
