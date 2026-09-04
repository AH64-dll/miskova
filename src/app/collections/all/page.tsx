import type { Metadata } from "next";
import ArchiveSection from "@/home/ArchiveSection";

export const metadata: Metadata = {
  title: "All Products | Miskova Fragrances",
  description: "All Products by Miskova Fragrances.",
};

export default function AllProductsPage() {
  return <ArchiveSection />;
}
