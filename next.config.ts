import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@ffmpeg-installer/ffmpeg'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Copy ffmpeg binaries to output
      config.externals = config.externals || [];
      config.externals.push({
        '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
      });
    }
    return config;
  },
};

export default nextConfig;
