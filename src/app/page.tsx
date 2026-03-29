"use client";

import dynamic from "next/dynamic";

const SphereScene = dynamic(() => import("@/components/SphereScene"), {
  ssr: false,
  loading: () => (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#040102",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#ff1e49",
      fontFamily: "Space Grotesk, sans-serif",
      fontSize: "0.7rem",
      letterSpacing: "0.3em",
      textTransform: "uppercase" as const,
    }}>
      loading...
    </div>
  ),
});

export default function Home() {
  return <SphereScene />;
}
