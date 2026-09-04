import Image from "next/image";
import Link from "next/link";
import type { CatalogCategory, CatalogProduct } from "@/data/products";

export function salePercent(product: CatalogProduct): number | null {
  if (product.salePrice === null || product.price <= 0) return null;
  if (product.salePrice >= product.price) return null;
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

export function effectivePrice(product: CatalogProduct): number {
  return product.salePrice ?? product.price;
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const outOfStock = product.trackStock && product.quantity <= 0;
  const pct = salePercent(product);
  return (
    <article className="mk-card" data-product={product.slug}>
      <div className="mk-card-media">
        {pct !== null && <span className="mk-card-badge">-{pct}%</span>}
        <Image
          src={product.image}
          alt={product.name}
          width={600}
          height={600}
          className="mk-card-img"
          priority={priority}
          sizes="(min-width: 1200px) 25vw, (min-width: 900px) 33vw, 50vw"
        />
        {outOfStock ? (
          <button
            className="mk-card-quick-add is-disabled"
            type="button"
            disabled
            aria-label={`${product.name} is out of stock`}
          >
            Out of stock
          </button>
        ) : (
          <button
            className="mk-card-quick-add"
            type="button"
            data-add={product.slug}
            aria-label={`Add ${product.name} to cart`}
          >
            Add to cart
          </button>
        )}
      </div>
      <div className="mk-card-info">
        <h2 className="mk-card-title">{product.name}</h2>
        <div className="mk-card-price">
          {product.salePrice !== null ? (
            <>
              <span className="mk-sale-price">{product.salePrice} EGP</span>
              <s className="mk-orig-price">{product.price} EGP</s>
            </>
          ) : (
            <span>{product.price} EGP</span>
          )}
        </div>
        {outOfStock && (
          <p className="mk-stock-flag" role="status">
            Out of stock
          </p>
        )}
        <a
          className="mk-card-link"
          href={product.canonicalUrl}
          aria-label={`View ${product.name} details`}
        >
          View details
        </a>
      </div>
    </article>
  );
}

const CATEGORY_ROUTES: Record<string, string> = {
  "summer-fragrances": "/collections/summer",
  "Summer-fragrances": "/collections/summer",
  "men-fragrances": "/collections/for-him",
  "women-fragrances": "/collections/for-her",
};

export function CategoryCard({ category }: { category: CatalogCategory }) {
  const href = CATEGORY_ROUTES[category.slug] ?? "/collections";
  return (
    <Link className="mk-category-card" href={href} aria-label={`View ${category.name} details`}>
      <Image
        src={category.image}
        alt={category.name}
        width={800}
        height={800}
        className="mk-category-img"
        loading="lazy"
        sizes="(min-width: 1200px) 33vw, (min-width: 900px) 50vw, 100vw"
      />
      <div className="mk-category-info">
        <span className="mk-category-count">{category.productCount} Product</span>
        <h2 className="mk-category-name">{category.name}</h2>
        <span className="mk-category-cta">View Details</span>
      </div>
    </Link>
  );
}
