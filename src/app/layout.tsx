import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Hannah Hajar",
  description: "Hannah Hajar — bio, abstract, concerts, and media.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

