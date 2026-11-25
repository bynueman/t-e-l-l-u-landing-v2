import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  experimental: {
    agentUpgrade: "security",
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : [];
      config.externals = [...existing, { "node:sqlite": "commonjs node:sqlite" }];
    }
    return config;
  },
  ...(process.env.NODE_ENV === "development" && process.env.TELLU_DEV_HOST
    ? { allowedDevOrigins: [process.env.TELLU_DEV_HOST] }
    : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
