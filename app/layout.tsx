import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { BackendWake } from "@/components/system/BackendWake";

export const metadata: Metadata = {
  title: "KUROKURO — Search the web. Keep it yours.",
  applicationName: "KUROKURO",
  description: "A calm, privacy-first search interface powered by SearXNG.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/kurokuro.svg",
    shortcut: "/icons/kurokuro.svg",
    apple: "/icons/kurokuro.svg",
  },
  appleWebApp: {
    capable: true,
    title: "KUROKURO",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090909",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><I18nProvider><BackendWake />{children}</I18nProvider></body>
    </html>
  );
}
