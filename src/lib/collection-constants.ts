export const ANNOUNCEMENT_TEXT = "FREE SHIPPING FOR ANY ORDER ABOVE 1200EGP";

export type SortOptionId = "highest-rate" | "newest" | "oldest" | "lowest-price" | "highest-price";

export const SORT_OPTIONS: { id: SortOptionId; label: string }[] = [
  { id: "highest-rate", label: "Highest Rate" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "lowest-price", label: "Lowest Price" },
  { id: "highest-price", label: "Highest Price" },
];

export const COLLECTION_SLUGS = {
  summer: "Summer-fragrances",
  him: "men-fragrances",
  her: "women-fragrances",
  best: "best-fragrances",
  all: "all-products",
} as const;

export const COLLECTION_TITLES: Record<string, string> = {
  [COLLECTION_SLUGS.summer]: "Summer Collection",
  [COLLECTION_SLUGS.him]: "For Him",
  [COLLECTION_SLUGS.her]: "For Her",
  [COLLECTION_SLUGS.best]: "Best Sellers !",
  [COLLECTION_SLUGS.all]: "All Products",
};
