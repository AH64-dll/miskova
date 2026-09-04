import type { Metadata } from "next";
import BestSellersSection from "@/home/BestSellersSection";

export const metadata: Metadata = {
  title: "Best Sellers | Miskova Fragrances",
  description: "Best Sellers by Miskova Fragrances.",
};

export default function BestSellersPage() {
  return <BestSellersSection />;
}
