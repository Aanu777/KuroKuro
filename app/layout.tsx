import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kurokuro — Search the web. Keep it yours.",
  description: "A calm, privacy-first search interface powered by SearXNG.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
