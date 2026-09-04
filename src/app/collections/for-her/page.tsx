import type { Metadata } from "next";
import CollectionListing from "../CollectionListing";
import { fallbackCatalog } from "@/data/products";
import styles from "./for-her.module.css";
import "@/app/home.css";
import "../collections.css";

export const metadata: Metadata = {
  title: "For Her | Miskova Fragrances",
  description: "For Her by Miskova Fragrances.",
};

export default function ForHerCollectionPage() {
  const herProducts = fallbackCatalog.products.filter((p) =>
    p.categorySlugs.includes("women-fragrances"),
  );
  return (
    <div className={styles.herPersona}>
      <svg
        className={`${styles.flourish} ${styles.flourishTop}`}
        viewBox="0 0 240 240"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M120 216 C 118 160, 116 110, 122 48" />
        <path d="M122 96 C 96 92, 78 76, 72 52 C 98 56, 116 72, 122 96 Z" />
        <path d="M121 132 C 147 128, 165 112, 171 88 C 145 92, 127 108, 121 132 Z" />
        <path d="M120 168 C 100 165, 86 154, 82 136 C 100 139, 114 150, 120 168 Z" />
        <circle cx="122" cy="40" r="5" />
        <circle cx="72" cy="52" r="3" />
        <circle cx="171" cy="88" r="3" />
      </svg>
      <svg
        className={`${styles.flourish} ${styles.flourishBottom}`}
        viewBox="0 0 240 240"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M120 24 C 122 80, 124 130, 118 192" />
        <path d="M118 144 C 144 140, 162 124, 168 100 C 142 104, 124 120, 118 144 Z" />
        <path d="M119 108 C 93 104, 75 88, 69 64 C 95 68, 113 84, 119 108 Z" />
        <circle cx="118" cy="200" r="5" />
        <circle cx="168" cy="100" r="3" />
        <circle cx="69" cy="64" r="3" />
      </svg>
      <CollectionListing title="For Her" products={herProducts} theme="for-her-theme" />
    </div>
  );
}
