/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force complete rebuild - cache invalidation
  generateBuildId: async () => {
    return Date.now().toString() + '-reset'
  },
}

export default nextConfig
