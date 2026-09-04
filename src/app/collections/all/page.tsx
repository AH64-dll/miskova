import type { Metadata } from "next";
import CollectionListing from "../CollectionListing";
import { fallbackCatalog } from "@/data/products";
import "@/app/home.css";
import "../collections.css";

export const metadata: Metadata = {
  title: "All Products | Miskova Fragrances",
  description: "All Products by Miskova Fragrances.",
};

export default function AllProductsPage() {
  return <CollectionListing title="All Products" products={fallbackCatalog.products} theme="all-theme" />;
}
