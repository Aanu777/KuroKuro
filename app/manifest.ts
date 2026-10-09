import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "KUROKURO — Search the Web",
    short_name: "KUROKURO",
    description: "A calm, privacy-first search interface powered by SearXNG.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#090909",
    theme_color: "#090909",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/kurokuro.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
