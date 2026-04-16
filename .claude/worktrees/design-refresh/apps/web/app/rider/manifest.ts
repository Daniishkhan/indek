import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Indek Rider",
    short_name: "Indek",
    description: "Offline-tolerant rider workflow for COD parcel delivery.",
    start_url: "/rider",
    display: "standalone",
    background_color: "#f4efe7",
    theme_color: "#0f766e",
    icons: [],
  };
}
