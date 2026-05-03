"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

const SphereScene = dynamic(() => import("@/components/SphereScene"), {
  ssr: false,
});

type Phase = "enter" | "loading" | "ready";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("enter");
  const [fadeOut, setFadeOut] = useState(false);

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
            src="/images/logo-hh.svg"
            alt="Hannah Hajar"
            style={{
              width: "min(500px, 70vw)",
              marginBottom: "3rem",
              filter: "drop-shadow(0 0 30px rgba(255,30,73,0.25))",
              animation: "breatheLogo 4s ease-in-out infinite",
            }}
          />

          {phase === "enter" && (
            <div
              style={{
                color: "rgba(255, 30, 73, 0.55)",
                fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif",
                fontSize: "30px",
                fontWeight: 900,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                animation: "fadeIn 1.2s ease forwards",
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
                style={{
                  color: "rgba(255, 30, 73, 0.35)",
                  fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif",
                  fontSize: "14px",
                  fontWeight: 900,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  animation: "pulse 1.5s ease-in-out infinite",
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
                  style={{
                    width: "35%",
                    height: "100%",
                    background: "rgba(255, 30, 73, 0.35)",
                    borderRadius: "1px",
                    animation: "loadingBar 1.2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          )}

        </div>
      ) : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#040102",
            zIndex: 9999,
            pointerEvents: "none",
            animation: "fadeOutFinal 0.8s ease forwards",
          }}
        >
        </div>
      )}
    </div>
  );
}
