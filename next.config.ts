import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth reads .docx files on the server; keep it out of the bundle.
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
