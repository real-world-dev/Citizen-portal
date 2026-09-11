/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // We lint in CI separately; don't block local builds on it for the demo.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
