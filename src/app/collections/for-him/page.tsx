import type { Metadata } from "next";
import CollectionListing from "../CollectionListing";
import { fallbackCatalog } from "@/data/products";
import styles from "./for-him.module.css";
import "@/app/home.css";
import "../collections.css";

export const metadata: Metadata = {
  title: "For Him | Miskova Fragrances",
  description: "For Him by Miskova Fragrances.",
};

export default function ForHimCollectionPage() {
  const himProducts = fallbackCatalog.products.filter((p) =>
    p.categorySlugs.includes("men-fragrances"),
  );
  return (
    <div className={styles.scope}>
      <CollectionListing title="For Him" products={himProducts} theme="for-him-theme" />
    </div>
  );
}
