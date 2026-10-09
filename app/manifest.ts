import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SU Card",
    short_name: "SU Card",
    description: "Nile University Student Union membership card",
    start_url: "/",
    display: "standalone",
    background_color: "#0F3056",
    theme_color: "#0F3056",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Scanner",
        short_name: "Scan",
        description: "Open the SU Card scanner",
        url: "/scan",
      },
    ],
  };
}
