import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded from node_modules at runtime; Turbopack can't bundle these.
  serverExternalPackages: ["chromadb", "@chroma-core/default-embed"],
};

export default nextConfig;
