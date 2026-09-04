import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.easy-orders.net",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/collections/Summer-fragrances",
        destination: "/collections/summer",
        permanent: true,
      },
      {
        source: "/collections/summer-fragrances",
        destination: "/collections/summer",
        permanent: true,
      },
      {
        source: "/collections/men-fragrances",
        destination: "/collections/for-him",
        permanent: true,
      },
      {
        source: "/collections/women-fragrances",
        destination: "/collections/for-her",
        permanent: true,
      },
      {
        source: "/collections/all-products",
        destination: "/collections/all",
        permanent: true,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["three", "@react-three/fiber", "zod"],
  },
};

export default nextConfig;
