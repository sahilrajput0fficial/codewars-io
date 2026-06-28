import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENVIRONMENT !== "production") {
  throw new Error("Build aborted: NEXT_PUBLIC_ENVIRONMENT must be set to 'production' in production builds.");
}

const nextConfig: NextConfig = {};
export default nextConfig;
