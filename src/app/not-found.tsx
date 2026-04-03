"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#040102",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
      }}
    >
      <div
        style={{
          color: "rgba(255, 30, 73, 0.25)",
          fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif",
          fontSize: "clamp(80px, 15vw, 180px)",
          fontWeight: 900,
          letterSpacing: "0.15em",
          lineHeight: 1,
        }}
      >
        404
      </div>

      <div
        style={{
          color: "rgba(255, 30, 73, 0.5)",
          fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif",
          fontSize: "14px",
          fontWeight: 900,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
        }}
      >
        page not found
      </div>

      <Link
        href="/"
        style={{
          marginTop: "1rem",
          color: "rgba(255, 30, 73, 0.55)",
          fontFamily: "'Enclav Acadam', 'Space Grotesk', sans-serif",
          fontSize: "18px",
          fontWeight: 900,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          textDecoration: "none",
          transition: "color 0.4s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(255, 30, 73, 0.85)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255, 30, 73, 0.55)";
        }}
      >
        R e t u r n
      </Link>
    </div>
  );
}
