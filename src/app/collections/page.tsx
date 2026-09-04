import type { Metadata } from "next";
import { CollectionHeader } from "@/components/layout/CollectionHeader";
import { CollectionFooter } from "@/components/layout/CollectionFooter";
import { CategoryCard } from "@/components/ProductCard";
import { fallbackCatalog } from "@/data/products";
import "@/app/home.css";
import "./collections.css";

export const metadata: Metadata = {
  title: "Categories | Miskova Fragrances",
  description: "Categories by Miskova Fragrances.",
};

export default function CategoriesPage() {
  return (
    <div className="collection-page-root">
      <CollectionHeader />

      <main id="main-content" className="collection-container">

        <header className="collection-hero">
          <h1 className="collection-title">Categories</h1>
        </header>

        <div className="mk-categories-grid" role="region" aria-label="Categories Directory">
          {fallbackCatalog.categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </main>

      <CollectionFooter />
    </div>
  );
}
