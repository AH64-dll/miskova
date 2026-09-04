import type { Metadata } from "next";
import CollectionListing from "../CollectionListing";
import { fallbackCatalog } from "@/data/products";
import styles from "./best-sellers.module.css";
import "@/app/home.css";
import "../collections.css";

export const metadata: Metadata = {
  title: "Best Sellers ! | Miskova Fragrances",
  description: "Best Sellers ! by Miskova Fragrances.",
};

export default function BestSellersPage() {
  const bestProducts = fallbackCatalog.products.filter((p) =>
    p.categorySlugs.includes("best-fragrances"),
  );
  return (
    <div className={styles.scope}>
      <CollectionListing title="Best Sellers !" products={bestProducts} theme="bestsellers-theme" />
    </div>
  );
}
