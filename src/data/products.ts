/* Single source of truth for the storefront catalog.
 *
 * Narrative copy (name/story/aura/notes/chapter/inspiredBy/bundle copy) is the
 * approved reference voice adopted verbatim from the premium redesign. Commerce
 * values (price, salePrice, images) are the live
 * EasyOrders values mirrored by the checked-in fallback catalog below.
 * Purchase links are intentionally absent: checkout happens in the on-site bag.
 */

export type Persona = "him" | "her" | "summer" | "best";

export type Product = {
  slug: string;
  name: string;
  inspiredBy?: string;
  chapter?: string;
  price: number | null;
  salePrice?: number;
  image: string;
  story: string;
  aura?: string;
  notes?: { top: string; heart: string; base: string };
  keyNotes?: string;
  extra?: string;
  bundleOf?: { name: string; inspiredBy: string; top: string; heart: string; base: string }[];
  isBundle?: boolean;
  /* Store categorization (mirrors the live EasyOrders categories). */
  isSummer?: boolean;
  isBestSeller?: boolean;
  forGender?: "him" | "her" | "unisex";
  categorySlugs?: string[];
};

const img = (f: string) => `/assets/products/${f}.webp`;

export const brand = {
  name: "Miskova",
  fullName: "Miskova Fragrances",
  tagline: "Seal your story.",
  shippingNote: "Free shipping for any order above 1200 EGP",
  freeShippingThreshold: 1200,
  currency: "EGP",
  address: "Cairo, Egypt",
  phone: "01036202634",
  email: "miskovafragrances@gmail.com",
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61585754406759",
    instagram: "https://www.instagram.com/miskova_fragrances",
    tiktok: "https://www.tiktok.com/@miskova_fragrance",
  },
  pages: {
    about: "https://miskova.myeasyorders.com/pages/About-us",
    privacy: "https://miskova.myeasyorders.com/pages/privacy-policy",
    refund: "https://miskova.myeasyorders.com/pages/refund-policy",
    shipping: "https://miskova.myeasyorders.com/pages/shipping-policy",
    terms: "https://miskova.myeasyorders.com/pages/terms-and-conditions",
  },
  story: {
    title: "Our Story",
    intro:
      "At Miskova, we believe that a fragrance is more than just a scent—it’s the silent language of your story. Each Chapter in our collection is meticulously crafted to be the sensory backdrop of your life’s most meaningful moments, helping you express who you are without saying a word.",
    pillars: [
      {
        title: "Crafted for Excellence",
        body: "Our fragrances are designed with a single goal: to make you the best version of yourself. We focus on creating a sophisticated presence that ensures you stand out with effortless elegance in every room you enter.",
      },
      {
        title: "A Lasting Impression",
        body: "We ensure that each fragrance offers a powerful and refined presence that stays with you, making your impact unforgettable from start to finish.",
      },
      {
        title: "Seal Your Story",
        body: "It’s about more than luxury; it’s about confidence. Miskova gives you the final touch of perfection to \"Seal Your Story\" and walk with absolute assurance.",
      },
    ],
  },
  reviewImages: [1, 2, 3, 4, 5].map((n) => `/assets/reviews/dispatch-${n}.jpg`),
};

export const products: Product[] = [
  {
    slug: "Vintage-Lounge",
    name: "Vintage Lounge",
    inspiredBy: "Tobacco Vanille",
    chapter: "I",
    price: 550,
    salePrice: 500,
    image: img("Vintage-Lounge"),
    story:
      "It’s the smell of the rich, deep comfort you worked for. This is the moment you sink into your favorite leather chair, surrounded by the warm aroma of Tobacco and Spices, finally allowing yourself to relax completely. This Chapter seals the feeling of unhurried ease and deserved luxury.",
    aura: "Wisdom & Comfort",
    notes: {
      top: "Tobacco Leaf & Aromatic Spices",
      heart: "Creamy Tonka Bean, Cacao & Vanilla",
      base: "Dried Fruits & Sweet Wood Sap",
    },
    isSummer: false,
    isBestSeller: false,
    forGender: "him",
    categorySlugs: ["men-fragrances", "all-products"],
  },
  {
    slug: "Heir",
    name: "Heir",
    inspiredBy: "Althaïr",
    chapter: "II",
    price: 590,
    salePrice: 490,
    image: img("Heir"),
    story:
      "Heir gives you a natural, established charisma. It tells people you are a person of substance who possesses a true, warm inner strength. This Chapter seals the quiet confidence and the warm legacy of true leadership.",
    aura: "Warm Authority & Charisma",
    notes: { top: "Orange Blossom", heart: "Praline & Cinnamon", base: "Warm Vanilla" },
    isSummer: false,
    isBestSeller: true,
    forGender: "him",
    categorySlugs: ["men-fragrances", "all-products"],
  },
  {
    slug: "Liquid-Gold",
    name: "Liquid Gold",
    inspiredBy: "Le Male Elixir",
    chapter: "III",
    price: 450,
    image: img("Liquid-Gold"),
    story:
      "The magnetic declaration of your ambition. Liquid Gold is the captivating force that asserts itself before you even walk into a room. This Chapter seals the sheer willpower that makes you achieve everything you desire and shine through any crowd.",
    aura: "Magnetism & Ambition",
    notes: { top: "Lavender & Mint", heart: "Vanilla & Benzoin", base: "Honey, Tonka Bean & Tobacco" },
    isSummer: false,
    isBestSeller: true,
    forGender: "her",
    categorySlugs: ["men-fragrances", "all-products"],
  },
  {
    slug: "Eternal-Knot",
    name: "Eternal Knot",
    inspiredBy: "Stronger With You Intensely",
    chapter: "IV",
    price: 450,
    image: img("Eternal-Knot"),
    story:
      "Eternal Knot gives you the feeling of being totally secure and supported. It tells people you are enveloped in a powerful, warm embrace that never lets go. This Chapter seals the unbreakable bond that gives you the sense that you are never alone, and your strength is doubled.",
    aura: "Depth & Unity",
    notes: { top: "Pink Pepper", heart: "Deep Toffee & Cinnamon", base: "Warm Vanilla & Amber" },
    isSummer: false,
    isBestSeller: false,
    forGender: "unisex",
    categorySlugs: ["men-fragrances", "all-products"],
  },
  {
    slug: "Heavens-cut",
    name: "Heaven’s Cut",
    inspiredBy: "Angels’ Share",
    chapter: "V",
    price: 650,
    image: img("Heavens-cut"),
    story:
      "This is the scent of supreme, effortless luxury. The boozy Cognac and warm Cinnamon combine into something truly decadent and smooth. This Chapter seals the powerful, elegant indulgence that makes you feel utterly untouchable and perfectly refined.",
    aura: "Divine Indulgence",
    notes: {
      top: "Boozy Cognac Oil",
      heart: "Warm Cinnamon & Oakwood Absolute",
      base: "Creamy Vanilla, Praline & Sandalwood",
    },
    isSummer: false,
    isBestSeller: false,
    forGender: "unisex",
    categorySlugs: ["men-fragrances", "all-products"],
  },
  {
    slug: "Ivory-Nectar",
    name: "Ivory Nectar",
    inspiredBy: "Bianco Latte",
    chapter: "VI",
    price: 450,
    salePrice: 400,
    image: img("Ivory-Nectar"),
    story:
      "This scent is a pure, soft embrace. The Caramel and silky Vanilla are incredibly smooth and comforting, creating an irresistible, cloud-like texture. This Chapter seals the gentle presence of comfort at its highest peak, making you uniquely memorable.",
    aura: "Pure Comfort & Brightness",
    notes: { top: "Warm Caramel", heart: "Sweet Honey & Coumarin", base: "Silky Vanilla & White Musk" },
    isSummer: false,
    isBestSeller: false,
    forGender: "her",
    categorySlugs: ["women-fragrances", "all-products"],
  },
  {
    slug: "Sweet-Empire",
    name: "Sweet Empire",
    inspiredBy: "La Capitale",
    chapter: "VII",
    price: 690,
    image: img("Sweet-Empire"),
    story:
      "This scent makes you feel like royalty wrapped in velvet. The unexpected Strawberry and rich Saffron Leather are so deep and smooth, it smells like priceless couture. This Chapter seals the Majestic Splendor that says you own the room with effortless, luxurious elegance.",
    aura: "Velvet Elegance",
    notes: { top: "Sweet Strawberry & Caramel", heart: "Spicy Saffron & Ginger", base: "Luxurious Leather & Vanilla" },
    isSummer: false,
    isBestSeller: false,
    forGender: "her",
    categorySlugs: ["women-fragrances", "all-products"],
  },
  {
    slug: "Crimson-Bloom",
    name: "Crimson Bloom",
    inspiredBy: "Hibiscus Mahajád",
    chapter: "VIII",
    price: 550,
    image: img("Crimson-Bloom"),
    story:
      "This is not just a flower, it’s a feverish, velvet curtain of scent. The massive Hibiscus and Rose are deepened by a powerful, lush, almost jammy intensity that has a rich, commanding texture. This Chapter seals the Intense Drama and the Feverish Opulence of a rare, high-stakes secret.",
    aura: "Intense Drama & Depth",
    notes: { top: "Ethereal Hibiscus & Spearmint", heart: "Jammy Rose & Cassis", base: "Warm Vanilla & Ambrette Seeds" },
    isSummer: true,
    isBestSeller: true,
    forGender: "her",
    categorySlugs: ["Summer-fragrances", "women-fragrances", "all-products", "best-fragrances"],
  },
  {
    slug: "Third-Act",
    name: "Third Act",
    inspiredBy: "Grand Soir",
    chapter: "IX",
    price: 650,
    salePrice: 550,
    image: img("Third-Act"),
    story:
      "Step into the spotlight with Third Act, a scent designed for those who command the room. Inspired by the iconic Grand Soir, this fragrance is the sweeping, golden finale of the Miskova collection. The composition opens with an opulent glow, where rich Amber and deep Benzoin create a resonant warmth that settles around you like velvet curtains. As the scent unfolds, a touch of Vanilla adds a sweet, sophisticated depth, sealing a dramatic masterpiece that lingers long after the lights dim.",
    aura: "Dramatic Magnificence",
    keyNotes: "Amber, Benzoin, Vanilla",
    extra: "Vibe: Sophisticated, Bold, and Unforgettable.",
    isSummer: false,
    isBestSeller: true,
    forGender: "unisex",
    categorySlugs: ["men-fragrances", "women-fragrances", "all-products"],
  },
  {
    slug: "Exotic-Dusk",
    name: "Exotic Dusk",
    inspiredBy: "Oud Maracujá",
    chapter: "X",
    price: 750,
    salePrice: 590,
    image: img("Exotic-Dusk"),
    story:
      "Inspired by the legendary Oud Maracuja, Exotic Dusk is the grandest, most intoxicating finale of our collection. This scent opens with dazzling, exotic Passion Fruit that slices through the dense, primal warmth of Oud and Rich Leather. Designed for ultimate confidence and supremacy, Exotic Dusk makes you the most powerful entity in the room, moving with silent, commanding grace.",
    notes: { top: "Dazzling Passion Fruit", heart: "Primal Oud", base: "Rich Leather" },
    isSummer: false,
    isBestSeller: false,
    forGender: "unisex",
    categorySlugs: ["men-fragrances", "all-products"],
  },
  {
    slug: "Pacific-Sol",
    name: "Pacific Sol",
    inspiredBy: "Pacific Chill",
    chapter: "XI",
    price: 690,
    salePrice: 620,
    image: img("Pacific-Sol"),
    story:
      "A brilliant citrus surge that cuts through cooling herbs, softened by cold apricot, giving the wearer an aura of refreshment and energy. Designed for the individual who radiates confidence and effortless energy. A perfect signature for hot days and summery nights.",
    aura: "Refreshment & Energy",
    notes: { top: "Orange, Lemon, Bergamot & Mint", heart: "Apricot & Basil", base: "Dates & Fig" },
    isSummer: true,
    isBestSeller: true,
    forGender: "unisex",
    categorySlugs: ["Summer-fragrances", "men-fragrances", "women-fragrances", "all-products", "best-fragrances"],
  },
  {
    slug: "Fruit-Fusion",
    name: "Fruit Fusion",
    inspiredBy: "Erba Pura",
    chapter: "XII",
    price: 550,
    salePrice: 450,
    image: img("Fruit-Fusion"),
    story:
      "An exotic fruit explosion that transitions into a sophisticated musky, ambery warmth. It starts loud and joyful, then settles into a magnetic, “clean luxury” scent. A versatile masterpiece for the optimist — bright enough to fend off the hottest days but still with the magnetic presence needed for a night out.",
    aura: "Bliss & Happiness",
    notes: { top: "Orange, Sicilian Lemon & Bergamot", heart: "Exotic Fruits", base: "White Musk, Warm Amber & Vanilla" },
    isSummer: true,
    isBestSeller: true,
    forGender: "unisex",
    categorySlugs: ["Summer-fragrances", "men-fragrances", "women-fragrances", "all-products", "best-fragrances"],
  },
  {
    slug: "Y-code",
    name: "Y Code",
    inspiredBy: "Y Eau de Parfum",
    chapter: "XIII",
    price: 450,
    image: img("Y-code"),
    story:
      "A powerful aromatic-fougère that balances clean, metallic freshness with a warm, dark woody depth. It leaves a dense, magnetic trail that projects hard and commands the room. Tailored for the modern visionary — sharp enough for the boardroom, yet sensual enough for the night.",
    notes: { top: "Green Apple, Frozen Ginger & Italian Bergamot", heart: "Sage, Juniper Berries & Geranium", base: "Amberwood, Cedar & Tonka Bean" },
    isSummer: true,
    isBestSeller: false,
    forGender: "him",
    categorySlugs: ["men-fragrances", "Summer-fragrances", "all-products", "best-fragrances"],
  },
  {
    slug: "The-Pequod",
    name: "The Pequod",
    inspiredBy: "Acqua di Giò Profumo",
    chapter: "XIV",
    price: 490,
    salePrice: 440,
    image: img("The-Pequod"),
    story:
      "A complex, dark-aquatic and woody fragrance. It starts with an intense, realistic blast of salted ocean air and transitions into a warm, deeply masculine skin-scent of rich woods and ambergris. Tailored for the enigmatic individual — sophisticated enough for formal evenings and rugged enough to make a powerful, distinct statement during the day.",
    notes: { top: "Aquatic Accord & Bergamot", heart: "Rosemary, Sage & Geranium", base: "Incense & Dark Patchouli" },
    isSummer: true,
    isBestSeller: false,
    forGender: "him",
    categorySlugs: ["Summer-fragrances", "men-fragrances", "all-products"],
  },
  {
    slug: "Spider-bundle",
    name: "Spider Bundle",
    price: 1000,
    salePrice: 800,
    image: img("Spider-bundle"),
    isBundle: true,
    story:
      "“With great power comes great responsibility.” This bundle captures the ultimate dual identity of Spider-Man — mapping his quiet duty against his unnatural powers. Master the duty. Unleash the power.",
    bundleOf: [
      {
        name: "Y Code — Great Responsibility",
        inspiredBy: "Chapter XIII",
        top: "Crisp Green Apple",
        heart: "Frozen Ginger",
        base: "Grounded Amberwood",
      },
      {
        name: "Crimson Bloom — Great Power",
        inspiredBy: "Chapter VIII",
        top: "Rich Hibiscus",
        heart: "Jammy Rose",
        base: "Warm Vanilla",
      },
    ],
    isSummer: true,
    isBestSeller: true,
    forGender: "him",
    categorySlugs: ["Summer-fragrances", "men-fragrances", "all-products", "best-fragrances"],
  },
  {
    slug: "Day-and-Night",
    name: "Day and Night Bundle",
    price: 790,
    image: img("Day-and-Night"),
    isBundle: true,
    story:
      "The ultimate duo for those who seek perfection without compromise. This bundle brings together our most masterfully balanced blends, designed to cover every hour of your day and every mood. Whether you’re looking for the vibrant luxury of Liquid Gold or the deep, secure embrace of Eternal Knot, this pair ensures you are always at your best. Versatile, powerful, and timeless.",
    aura: "Ultimate Versatility & Excellence",
    bundleOf: [
      { name: "Liquid Gold", inspiredBy: "Le Male Elixir", top: "Fresh Mint", heart: "Golden Honey", base: "Rich Vanilla" },
      {
        name: "Eternal Knot",
        inspiredBy: "Stronger With You Intensely",
        top: "Spicy Cinnamon",
        heart: "Deep Toffee",
        base: "Warm Amber & Vanilla",
      },
    ],
    isSummer: false,
    isBestSeller: true,
    forGender: "unisex",
    categorySlugs: ["men-fragrances", "all-products", "best-fragrances"],
  },
];

export const bySlug = (slug: string) => products.find((p) => p.slug === slug)!;
const pick = (...slugs: string[]) => slugs.map(bySlug);

/* Collection pick-lists follow the approved design's curation order. "him"
 * carries the full store men's category (15): the nine curated chapters lead,
 * the remaining six follow. Counts: summer 6 · best 6 · him 15 · her 6. */
export const collections = {
  summer: pick("Pacific-Sol", "Fruit-Fusion", "The-Pequod", "Y-code", "Crimson-Bloom", "Spider-bundle"),
  best: pick("Day-and-Night", "Spider-bundle", "Pacific-Sol", "Crimson-Bloom", "Liquid-Gold", "Y-code"),
  him: pick(
    "Heir",
    "Liquid-Gold",
    "Vintage-Lounge",
    "Third-Act",
    "Exotic-Dusk",
    "Heavens-cut",
    "Eternal-Knot",
    "The-Pequod",
    "Y-code",
    "Crimson-Bloom",
    "Pacific-Sol",
    "Fruit-Fusion",
    "Spider-bundle",
    "Day-and-Night",
    "Ivory-Nectar",
  ),
  her: pick("Crimson-Bloom", "Sweet-Empire", "Ivory-Nectar", "Fruit-Fusion", "Pacific-Sol", "Exotic-Dusk"),
};

export const bundles = products.filter((p) => p.isBundle);

export const formatPrice = (n: number) => `${n.toLocaleString("en-EG")} EGP`;
export const discountPct = (p: Product) =>
  p.price && p.salePrice ? Math.round(((p.price - p.salePrice) / p.price) * 100) : 0;
export const effectivePrice = (p: Product) => p.salePrice ?? p.price ?? 0;

export type Category = {
  slug: string;
  name: string;
  image: string;
  productCount: number;
  subtitle: string;
  tagline: string;
};

export const categories: Category[] = [
  {
    slug: "Summer-fragrances",
    name: "Summer Collection",
    image: "/assets/categories/Summer-fragrances.jpg",
    productCount: 6,
    subtitle: "Mediterranean Sun & Coastal Breeze",
    tagline: "Vibrant, sun-kissed citrus and herbal notes",
  },
  {
    slug: "men-fragrances",
    name: "For Him",
    image: "/assets/categories/men-fragrances.jpg",
    productCount: 15,
    subtitle: "Architectural & Smoky Woods",
    tagline: "Distinguished leather, vetiver & noble spices",
  },
  {
    slug: "women-fragrances",
    name: "For Her",
    image: "/assets/categories/women-fragrances.jpg",
    productCount: 6,
    subtitle: "Velvet Florals & Golden Amber",
    tagline: "Intoxicating Damask rose, saffron & sweet resins",
  },
];

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string;
  position: number;
  createdAt: string;
  quantity: number;
  trackStock: boolean;
  isAvailable: boolean;
  categorySlugs: string[];
  requiresVariant: boolean;
};

export type CatalogCategory = {
  slug: string;
  name: string;
  image: string;
  productCount: number;
};

export type CatalogSnapshot = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
};

type FallbackSeed = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  position: number;
  createdAt: string;
  quantity: number;
  trackStock: boolean;
  categorySlugs: string[];
  requiresVariant: boolean;
};
/* Snapshot of the live store (verified against the EasyOrders API by
 * scripts/test-catalog-parity.mjs). Treated as read-only truth. */
const SEEDS: FallbackSeed[] = [
  {
    id: "c4be0d28-d977-4c87-ba6d-a8dea9adda2b",
    name: "Day and Night Bundle",
    slug: "Day-and-Night",
    price: 790,
    salePrice: null,
    position: 22,
    createdAt: "2026-04-24T22:42:36.341594Z",
    quantity: 50,
    trackStock: false,
    categorySlugs: ["men-fragrances", "all-products", "best-fragrances"],
    requiresVariant: true,
  },
  {
    id: "8da01248-bd24-470f-9d74-2f799c4c4c56",
    name: "Spider bundle",
    slug: "Spider-bundle",
    price: 1000,
    salePrice: 800,
    position: 22,
    createdAt: "2026-08-05T15:23:05.436369Z",
    quantity: 0,
    trackStock: false,
    categorySlugs: [
      "men-fragrances",
      "Summer-fragrances",
      "all-products",
      "best-fragrances",
      "women-fragrances",
    ],
    requiresVariant: true,
  },
  {
    id: "ada902af-7883-49f1-b72d-61b091deb334",
    name: "Fruit Fusion (Erba Pura)",
    slug: "Fruit-Fusion",
    price: 550,
    salePrice: 450,
    position: 20,
    createdAt: "2026-04-26T20:11:32.631582Z",
    quantity: 50,
    trackStock: true,
    categorySlugs: ["men-fragrances", "Summer-fragrances", "all-products", "women-fragrances"],
    requiresVariant: true,
  },
  {
    id: "ab9b8f4f-2af9-4ddb-81f1-cac53a7f8b58",
    name: "Pacific Sol (Pacific Chill)",
    slug: "Pacific-Sol",
    price: 690,
    salePrice: 620,
    position: 20,
    createdAt: "2026-04-26T19:59:56.773024Z",
    quantity: 50,
    trackStock: false,
    categorySlugs: ["men-fragrances", "Summer-fragrances", "all-products", "best-fragrances"],
    requiresVariant: true,
  },
  {
    id: "06c60443-1385-4fdb-8434-acddd7d7a70e",
    name: "Heir (Althaïr)",
    slug: "Heir",
    price: 590,
    salePrice: 490,
    position: 19,
    createdAt: "2026-01-21T18:15:37.834455Z",
    quantity: 0,
    trackStock: true,
    categorySlugs: ["men-fragrances", "all-products"],
    requiresVariant: true,
  },
  {
    id: "cf2b43a2-878d-4e9a-9cc3-d228adc55072",
    name: "Third Act (Grand Soir)",
    slug: "Third-Act",
    price: 650,
    salePrice: 550,
    position: 18,
    createdAt: "2026-02-06T15:32:56.614439Z",
    quantity: 4,
    trackStock: true,
    categorySlugs: ["men-fragrances", "all-products"],
    requiresVariant: true,
  },
  {
    id: "589442c5-294b-4b6b-ac51-dd005eb9cd73",
    name: "Crimson Bloom (Hibiscus Mahajád)",
    slug: "Crimson-Bloom",
    price: 550,
    salePrice: null,
    position: 17,
    createdAt: "2026-01-21T23:03:33.960311Z",
    quantity: 50,
    trackStock: true,
    categorySlugs: [
      "men-fragrances",
      "Summer-fragrances",
      "all-products",
      "best-fragrances",
      "women-fragrances",
    ],
    requiresVariant: true,
  },
  {
    id: "a32833e2-914c-4097-ab74-4485451f4c99",
    name: "Vintage Lounge (Tobacco Vanille)",
    slug: "Vintage-Lounge",
    price: 550,
    salePrice: 500,
    position: 17,
    createdAt: "2026-01-21T23:29:39.864182Z",
    quantity: 50,
    trackStock: true,
    categorySlugs: ["men-fragrances", "all-products"],
    requiresVariant: true,
  },
  {
    id: "254e2dfb-1928-41ae-9c68-ca322f537226",
    name: "Exotic Dusk (Oud Maracujá)",
    slug: "Exotic-Dusk",
    price: 750,
    salePrice: 590,
    position: 17,
    createdAt: "2026-02-14T20:00:20.962941Z",
    quantity: 0,
    trackStock: false,
    categorySlugs: ["men-fragrances", "all-products"],
    requiresVariant: true,
  },
  {
    id: "19bef0b6-9a7a-4b58-84b9-fe850f8b63ea",
    name: "Liquid Gold (Le Male Elixir)",
    slug: "Liquid-Gold",
    price: 450,
    salePrice: null,
    position: 15,
    createdAt: "2026-01-21T17:17:12.066218Z",
    quantity: 5,
    trackStock: true,
    categorySlugs: ["men-fragrances", "all-products", "best-fragrances"],
    requiresVariant: true,
  },
  {
    id: "27dc363e-67df-4fcc-8912-e01d15811fdb",
    name: "Ivory Nectar (Bianco Latte)",
    slug: "Ivory-Nectar",
    price: 450,
    salePrice: 400,
    position: 15,
    createdAt: "2026-01-22T00:00:50.23001Z",
    quantity: 5,
    trackStock: true,
    categorySlugs: ["men-fragrances", "all-products", "women-fragrances"],
    requiresVariant: true,
  },
  {
    id: "47b04399-d709-46f9-8118-1c56ea2089d4",
    name: "Eternal Knot (Stronger With You Intensely)",
    slug: "Eternal-Knot",
    price: 450,
    salePrice: null,
    position: 15,
    createdAt: "2026-04-11T18:24:24.936712Z",
    quantity: 50,
    trackStock: true,
    categorySlugs: ["men-fragrances", "all-products"],
    requiresVariant: true,
  },
  {
    id: "464314a8-c9eb-4f9c-8b9c-4869dff7c76e",
    name: "The Pequod (Acqua di gio profumo)",
    slug: "The-Pequod",
    price: 490,
    salePrice: 440,
    position: 15,
    createdAt: "2026-05-17T14:24:45.680507Z",
    quantity: 0,
    trackStock: false,
    categorySlugs: ["men-fragrances", "Summer-fragrances", "all-products"],
    requiresVariant: true,
  },
  {
    id: "95fcb2c2-1e94-44a0-94a2-c851bfc22ddc",
    name: "Heaven's Cut (Angels Share)",
    slug: "Heavens-cut",
    price: 650,
    salePrice: null,
    position: 10,
    createdAt: "2026-01-21T23:45:33.455259Z",
    quantity: 1,
    trackStock: true,
    categorySlugs: ["men-fragrances", "all-products", "women-fragrances"],
    requiresVariant: true,
  },
  {
    id: "4c1846b1-5b38-447c-b527-3a4d9178adab",
    name: "Sweet Empire (La Capitale)",
    slug: "Sweet-Empire",
    price: 690,
    salePrice: null,
    position: 1,
    createdAt: "2026-01-21T20:32:34.637569Z",
    quantity: 0,
    trackStock: true,
    categorySlugs: ["all-products", "women-fragrances"],
    requiresVariant: true,
  },
  {
    id: "410c827a-59b2-4ba9-80c5-59c6b0468fb4",
    name: "Y code (Y Edp)",
    slug: "Y-code",
    price: 450,
    salePrice: null,
    position: 1,
    createdAt: "2026-05-17T14:11:46.01005Z",
    quantity: 0,
    trackStock: false,
    categorySlugs: ["men-fragrances", "Summer-fragrances", "all-products", "best-fragrances"],
    requiresVariant: true,
  },
];
function seedToProduct(seed: FallbackSeed): CatalogProduct {
  return {
    ...seed,
    image: `/assets/products/${seed.slug}.webp`,
    isAvailable: !seed.trackStock || seed.quantity > 0,
  };
}

export const fallbackCatalog: CatalogSnapshot = {
  products: SEEDS.map(seedToProduct),
  categories: [
    {
      slug: "Summer-fragrances",
      name: "Summer Collection",
      image: "/assets/categories/Summer-fragrances.jpg",
      productCount: 6,
    },
    {
      slug: "men-fragrances",
      name: "For Him",
      image: "/assets/categories/men-fragrances.jpg",
      productCount: 15,
    },
    {
      slug: "women-fragrances",
      name: "For Her",
      image: "/assets/categories/women-fragrances.jpg",
      productCount: 6,
    },
  ],
};
