"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CollectionHeader } from "@/components/layout/CollectionHeader";
import { CollectionFooter } from "@/components/layout/CollectionFooter";
import { ProductCard, effectivePrice } from "@/components/ProductCard";
import { SORT_OPTIONS, type SortOptionId } from "@/lib/collection-constants";
import type { CatalogProduct } from "@/data/products";
export default function CollectionListing({
  title,
  products,
  theme,
}: {
  title: string;
  products: CatalogProduct[];
  theme?: string;
}) {
  const [sort, setSort] = useState<SortOptionId>("highest-rate");

  const sorted = useMemo(() => {
    const list = [...products];
    switch (sort) {
      case "newest":
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        list.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "lowest-price":
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case "highest-price":
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case "highest-rate":
      default:
        list.sort((a, b) => b.position - a.position);
        break;
    }
    return list;
  }, [products, sort]);

  return (
    <div className={`collection-page-root${theme ? ` ${theme}` : ""}`}>
      <CollectionHeader />
      <main id="main-content" className="collection-container">
        <header className="collection-hero">
          <h1 className="collection-title">{title}</h1>
        </header>

        <div className="collection-sort">
          <label htmlFor="collection-sort">Sort by</label>
          <select
            id="collection-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOptionId)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mk-product-grid">
          {sorted.map((product, index) => (
            <ProductCard key={product.slug} product={product} priority={index === 0} />
          ))}
        </div>
      </main>
      <CollectionFooter />
    </div>
  );
}
