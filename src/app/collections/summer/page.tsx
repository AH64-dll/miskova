import type { Metadata } from "next";
import CollectionListing from "../CollectionListing";
import { fallbackCatalog } from "@/data/products";
import styles from "./summer.module.css";
import "@/app/home.css";
import "../collections.css";

export const metadata: Metadata = {
  title: "Summer Collection | Miskova Fragrances",
  description: "Summer Collection by Miskova Fragrances.",
};

export default function SummerCollectionPage() {
  const summerProducts = fallbackCatalog.products.filter((p) =>
    p.categorySlugs.includes("Summer-fragrances"),
  );
  return (
    <div className={styles.scope}>
      <CollectionListing title="Summer Collection" products={summerProducts} theme="summer-page-theme" />
    </div>
  );
}
