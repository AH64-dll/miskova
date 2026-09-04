import type { Metadata } from "next";
import localFont from "next/font/local";
import MiskovaCommerce from "@/components/MiskovaCommerce";
import "./globals.css";
import "./site-shell.css";

const almarai = localFont({
  src: [
    { path: "../../public/fonts/tsstApxBaigK_hnnQ1iFo0C3.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/tsstApxBaigK_hnnQ12Fow.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: false,
});

const bodoni = localFont({
  src: [
    { path: "../../public/fonts/bodoni-moda-regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/bodoni-moda-bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/bodoni-moda-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-bodoni",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Miskova Fragrances",
  description:
    "Enter the world of Miskova Fragrances. Luxurious, long-lasting scents crafted to seal your story with elegance. Find your perfect chapter today.",
  icons: { icon: "/assets/brand/favicon.webp" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bodoni.variable}>
      <body className={`${almarai.className} ${bodoni.variable}`}>
        {children}
        <MiskovaCommerce />
      </body>
    </html>
  );
}
