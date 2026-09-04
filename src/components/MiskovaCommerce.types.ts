import { products, type Product } from "@/data/products";

export type CatalogItem = {
  name: string;
  kind: string;
  price: string;
  href: string;
  image: string;
  slug: string;
  salePrice?: string;
  badge?: string;
  description?: string;
};

export const MISKOVA_CATALOG: CatalogItem[] = products.map((p) => ({
  name: p.name,
  kind: p.concentration,
  price: `${p.salePrice || p.price} EGP`,
  salePrice: p.salePrice ? `${p.salePrice} EGP` : undefined,
  href: `https://miskova.myeasyorders.com/products/${p.slug}`,
  image: p.image,
  slug: p.slug,
  badge: p.badge,
  description: p.description,
}));
