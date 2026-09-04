import { z } from "zod";
import { fallbackCatalog, type CatalogSnapshot } from "@/data/products";

const ORIGIN = "https://miskova.myeasyorders.com";
const API = "https://api.easy-orders.net/api/v1";

const COLLECTION_SLUGS = {
  summer: "Summer-fragrances",
  him: "men-fragrances",
  her: "women-fragrances",
  best: "best-fragrances",
  all: "all-products",
} as const;

const ALL_PRODUCTS_CATEGORY_ID = "8e037e3f-f03a-46cd-8f17-f8c9d350e359";

const JoinedCategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.coerce.number(),
  sale_price: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  thumb: z.string(),
  position: z.coerce.number().optional().default(0),
  created_at: z.string(),
  quantity: z.coerce.number().optional().default(0),
  track_stock: z.boolean().optional().default(false),
  categories: z.array(JoinedCategorySchema).optional().default([]),
  variations: z.array(z.unknown()).optional().default([]),
});

const ProductsResponseSchema = z.union([
  z.array(ProductSchema),
  z.object({ data: z.array(ProductSchema) }),
]);

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  thumb: z.string().optional().default(""),
});

const CategoriesResponseSchema = z.union([
  z.array(CategorySchema),
  z.object({ data: z.array(CategorySchema) }),
]);

function collapseName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  "Day-and-Night": "/assets/products/Day-and-Night.webp",
  "Spider-bundle": "/assets/products/Spider-bundle.webp",
  "Fruit-Fusion": "/assets/products/Fruit-Fusion.webp",
  "Pacific-Sol": "/assets/products/Pacific-Sol.webp",
  Heir: "/assets/products/Heir.webp",
  "Third-Act": "/assets/products/Third-Act.webp",
  "Vintage-Lounge": "/assets/products/Vintage-Lounge.webp",
  "Crimson-Bloom": "/assets/products/Crimson-Bloom.webp",
  "Exotic-Dusk": "/assets/products/Exotic-Dusk.webp",
  "Eternal-Knot": "/assets/products/Eternal-Knot.webp",
  "The-Pequod": "/assets/products/The-Pequod.webp",
  "Ivory-Nectar": "/assets/products/Ivory-Nectar.webp",
  "Liquid-Gold": "/assets/products/Liquid-Gold.webp",
  "Heavens-cut": "/assets/products/Heavens-cut.webp",
  "Sweet-Empire": "/assets/products/Sweet-Empire.webp",
  "Y-code": "/assets/products/Y-code.webp",
};

function rewriteImage(url: string): string {
  const match = /^https?:\/\/easyorders\.fra1\.digitaloceanspaces\.com\/(.+)$/.exec(url);
  if (match) return `https://files.easy-orders.net/${match[1]}`;
  return url;
}

function productImage(slug: string, remoteUrl: string): string {
  return LOCAL_PRODUCT_IMAGES[slug] ?? rewriteImage(remoteUrl);
}

function toSalePrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function getCatalog(): Promise<CatalogSnapshot> {
  try {
    const headers = { Origin: ORIGIN, Accept: "application/json" };
    const init: RequestInit = { headers, next: { revalidate: 600 } };

    const [productsRes, categoriesRes] = await Promise.all([
      fetch(
        `${API}/products?category_id=${ALL_PRODUCTS_CATEGORY_ID}&limit=50&sort=position,desc&join=categories,variants,variations`,
        init,
      ),
      fetch(`${API}/categories?limit=50`, init),
    ]);

    if (!productsRes.ok || !categoriesRes.ok) {
      throw new Error(`upstream status ${productsRes.status}/${categoriesRes.status}`);
    }

    const productsJson: unknown = await productsRes.json();
    const categoriesJson: unknown = await categoriesRes.json();

    const parsedProducts = ProductsResponseSchema.parse(productsJson);
    const parsedCategories = CategoriesResponseSchema.parse(categoriesJson);

    const rows = Array.isArray(parsedProducts) ? parsedProducts : parsedProducts.data;
    const catRows = Array.isArray(parsedCategories) ? parsedCategories : parsedCategories.data;

    const liveCategorySlugs = new Set(catRows.map((c) => c.slug));

    const products = rows.map((p) => {
      const quantity = p.quantity ?? 0;
      const trackStock = p.track_stock ?? false;
      const categorySlugs = p.categories
        .map((c) => c.slug)
        .filter((slug) => liveCategorySlugs.has(slug) || slug === "all-products");
      return {
        id: p.id,
        name: collapseName(p.name),
        slug: p.slug,
        price: p.price,
        salePrice: toSalePrice(p.sale_price),
        image: productImage(p.slug, p.thumb),
        position: p.position ?? 0,
        createdAt: p.created_at,
        quantity,
        trackStock,
        isAvailable: !trackStock || quantity > 0,
        categorySlugs,
        requiresVariant: (p.variations?.length ?? 0) > 0,
        canonicalUrl: `https://miskova.myeasyorders.com/products/${p.slug}`,
      };
    });

    if (products.length === 0) throw new Error("empty catalog");

    const counts = new Map<string, number>();
    for (const p of products) {
      for (const slug of p.categorySlugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }

    const rootOrder = [
      COLLECTION_SLUGS.summer,
      COLLECTION_SLUGS.him,
      COLLECTION_SLUGS.her,
    ];
    const LOCAL_CATEGORY_IMAGES: Record<string, string> = {
      [COLLECTION_SLUGS.summer]: "/assets/categories/Summer-fragrances.jpg",
      [COLLECTION_SLUGS.him]: "/assets/categories/men-fragrances.jpg",
      [COLLECTION_SLUGS.her]: "/assets/categories/women-fragrances.jpg",
    };
    const categories = rootOrder
      .map((slug) => {
        const live = catRows.find((c) => c.slug === slug);
        if (!live) return null;
        return {
          slug: live.slug,
          name: collapseName(live.name),
          image: LOCAL_CATEGORY_IMAGES[slug] ?? rewriteImage(live.thumb),
          productCount: counts.get(slug) ?? 0,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
    if (categories.length !== 3) throw new Error("missing root categories");

    return { products, categories };
  } catch {
    console.warn("catalog: live fetch failed, serving fallback catalog");
    return fallbackCatalog;
  }
}
