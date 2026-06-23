import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://res.cloudinary.com/**')],
  },
  allowedDevOrigins: ["192.168.1.106",]
};

export default nextConfig;
