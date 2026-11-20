import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '192.168.100.2',
    '192.168.100.2:5000',
    '192.168.100.2:5001',
    'localhost:5000',
    'localhost:5001',
  ],
};

export default nextConfig;
