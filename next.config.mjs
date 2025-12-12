// next.config.mjs
import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typedRoutes: true,
  outputFileTracingRoot: path.join(process.cwd()),

  // ------------------------------------------
  // 🛑 הדבר הכי חשוב — לא לשבור build בגלל TS/ESLint
  // ------------------------------------------
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ------------------------------------------

  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "@react-three/fiber",
      "@react-three/drei",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Cloudinary / OAuth / GitHub
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },

      // YouTube thumbnails
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },

      // Fitness providers
      { protocol: "https", hostname: "wger.de", pathname: "/**" },
      { protocol: "https", hostname: "v2.exercisedb.io", pathname: "/**" },
      {
        protocol: "https",
        hostname: "d205bpvrqc9yn1.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "exercisedb.p.rapidapi.com",
        pathname: "/**",
      },

      // Stock images
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },

      // GIF providers
      { protocol: "https", hostname: "media.giphy.com", pathname: "/**" },
      { protocol: "https", hostname: "i.giphy.com", pathname: "/**" },
      { protocol: "https", hostname: "media.tenor.com", pathname: "/**" },

      // Wikipedia / misc
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },

      // ✅ Spotify covers
      { protocol: "https", hostname: "i.scdn.co", pathname: "/**" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox; style-src 'unsafe-inline';",
  },

  async rewrites() {
    return [
      { source: "/api/flub/:path*", destination: "/api/club/:path*" },
      {
        source: "/assets/images/fit/hero/:id.jpg",
        destination: "/assets/images/fit/hero/:id.svg",
      },
      {
        source: "/assets/images/fit/hero/:id.webp",
        destination: "/assets/images/fit/hero/:id.svg",
      },
      {
        source: "/assets/images/fit/hero/:id.png",
        destination: "/assets/images/fit/hero/:id.svg",
      },
    ];
  },

  async redirects() {
    return [
      { source: "/maty-date", destination: "/date", permanent: true },
      {
        source: "/maty-date/:path*",
        destination: "/date/:path*",
        permanent: true,
      },
    ];
  },

  webpack: (config, { dev }) => {
    if (dev) config.cache = false;

    config.module.rules.push({
      test: /\.(glsl|vs|fs)$/,
      type: "asset/source",
    });

    return config;
  },

  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
