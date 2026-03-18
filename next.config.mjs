/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Cache bust timestamp - forces full rebuild on Vercel
  env: {
    BUILD_TIMESTAMP: new Date().toISOString(),
  },
}

export default nextConfig
