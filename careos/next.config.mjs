/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Every screen in the Phase One prototype prerenders, so the demo ships as
  // a fully static export — deployable to any static host. Remove `output`
  // when the Supabase backend lands and server features are needed.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: {
    // Linting runs in CI; the production build should never block on style rules.
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
};

export default nextConfig;
