import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import Curtain from "@/components/Curtain";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import BagDrawer from "@/components/BagDrawer";
import SiteChrome from "@/components/SiteChrome";
import { StoreProvider } from "@/components/store";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Miskova Fragrances — Seal Your Story",
  description:
    "Miskova Fragrances — Seal your story. A house of fragrance chapters, crafted in Cairo, Egypt.",
  icons: { icon: "/assets/brand/favicon.webp" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <StoreProvider>
          {children}
          <SiteChrome>
            <Curtain />
            <Header />
            <Footer />
            <ProductDetail />
            <BagDrawer />
          </SiteChrome>
        </StoreProvider>
      </body>
    </html>
  );
}
