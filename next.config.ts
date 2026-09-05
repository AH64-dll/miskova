import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isPages ? "export" : undefined,
  basePath: isPages ? "/miskova" : undefined,
  trailingSlash: isPages ? true : undefined,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    unoptimized: isPages ? true : false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.easy-orders.net",
        pathname: "/**",
      },
    ],
  },
  ...(isPages
    ? {}
    : {
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
      }),
  experimental: {
    optimizePackageImports: ["three", "@react-three/fiber", "zod"],
  },
};

export default nextConfig;
