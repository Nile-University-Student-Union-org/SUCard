import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SU Card Scanner",
    short_name: "SU Scanner",
    description: "Nile University Student Union card scanner for partner vendors",
    start_url: "/scan",
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
  };
}
