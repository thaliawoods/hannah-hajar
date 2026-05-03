"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";

const SphereScene = dynamic(() => import("@/components/SphereScene"), {
  ssr: false,
});

type Phase = "enter" | "loading" | "ready";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("enter");
  const [fadeOut, setFadeOut] = useState(false);

  const logoRef = useRef<HTMLImageElement>(null);
  const enterTextRef = useRef<HTMLDivElement>(null);
  const loadingTextRef = useRef<HTMLDivElement>(null);
  const loadingBarRef = useRef<HTMLDivElement>(null);
  const fadeOverlayRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (phase === "enter") setPhase("loading");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleSceneReady = useCallback(() => {
    setPhase("ready");
    setTimeout(() => setFadeOut(true), 150);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (logoRef.current) {
        gsap.fromTo(
          logoRef.current,
          { scale: 1, opacity: 0.85 },
          {
            scale: 1.03,
            opacity: 1,
            duration: 2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
        );
      }
      if (enterTextRef.current) {
        gsap.fromTo(
          enterTextRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 1.2, ease: "power2.out" },
        );
      }
    });
    return () => ctx.revert();
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      if (loadingTextRef.current) {
        tl.fromTo(
          loadingTextRef.current,
          { opacity: 0.35 },
          {
            opacity: 0.7,
            duration: 0.75,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          0,
        );
      }
      if (loadingBarRef.current) {
        tl.fromTo(
          loadingBarRef.current,
          { x: -100 },
          {
            x: 290,
            duration: 1.2,
            ease: "power1.inOut",
            repeat: -1,
          },
          0,
        );
      }
    });
    return () => ctx.revert();
  }, [phase]);

  useEffect(() => {
    if (!fadeOut || !fadeOverlayRef.current) return;
    gsap.fromTo(
      fadeOverlayRef.current,
      { opacity: 1 },
      { opacity: 0, duration: 0.8, ease: "power2.inOut" },
    );
  }, [fadeOut]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#040102" }}>
      {phase !== "enter" && (
        <SphereScene onReady={handleSceneReady} />
      )}

      {!fadeOut ? (
        <div
          onClick={phase === "enter" ? handleEnter : undefined}
          style={{
            position: "fixed",
            inset: 0,
            background: "#040102",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: phase === "enter" ? "pointer" : "default",
          }}
        >
          <img
            ref={logoRef}
            src="/images/logo-hh.svg"
            alt="Hannah Hajar"
            style={{
              width: "min(500px, 70vw)",
              marginBottom: "3rem",
              filter: "drop-shadow(0 0 30px rgba(255,30,73,0.25))",
            }}
          />

          {phase === "enter" && (
            <div
              ref={enterTextRef}
              style={{
                color: "rgba(255, 30, 73, 0.55)",
                fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif",
                fontSize: "30px",
                fontWeight: 900,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "color 0.4s, opacity 0.4s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255, 30, 73, 0.85)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255, 30, 73, 0.55)";
              }}
            >
              E n t e r
            </div>
          )}

          {phase === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div
                ref={loadingTextRef}
                style={{
                  color: "rgba(255, 30, 73, 0.35)",
                  fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif",
                  fontSize: "14px",
                  fontWeight: 900,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                }}
              >
                loading
              </div>
              <div
                style={{
                  width: "100px",
                  height: "1px",
                  background: "rgba(255, 30, 73, 0.08)",
                  borderRadius: "1px",
                  overflow: "hidden",
                }}
              >
                <div
                  ref={loadingBarRef}
                  style={{
                    width: "35%",
                    height: "100%",
                    background: "rgba(255, 30, 73, 0.35)",
                    borderRadius: "1px",
                  }}
                />
              </div>
            </div>
          )}

        </div>
      ) : (
        <div
          ref={fadeOverlayRef}
          style={{
            position: "fixed",
            inset: 0,
            background: "#040102",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
        </div>
      )}
    </div>
  );
}
