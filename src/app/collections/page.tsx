import type { Metadata } from "next";
import CollectionsSection from "@/home/CollectionsSection";

export const metadata: Metadata = {
  title: "Categories | Miskova Fragrances",
  description: "Categories by Miskova Fragrances.",
};

export default function CategoriesPage() {
  return <CollectionsSection />;
}
