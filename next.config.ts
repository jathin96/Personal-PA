import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['grammy', '@prisma/client', 'node-cron'],
};

export default nextConfig;
