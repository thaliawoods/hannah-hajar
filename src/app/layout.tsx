import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Hannah Hajar",
  description: "Hannah Hajar — bio, abstract, concerts, and media."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
