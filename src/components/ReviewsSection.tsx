"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CatalogProduct } from "@/data/products";
import type { Review, ReviewStats } from "@/types/reviews";
import { PatronCarousel } from "./reviews/PatronCarousel";
import { useStore } from "@/components/store";
import { Button, Eyebrow, Icon, Rule } from "@/components/ui";
import { BASE_PATH } from "@/utils/basePath";
import { initialReviews, calculateReviewStats } from "@/data/reviews";

const HELPFUL_VOTES_KEY = "miskova:helpful-votes";

type SearchProduct = Pick<CatalogProduct, "name" | "slug">;

function StarPips({
  rating,
  size = 15,
  tone = "rose",
}: {
  rating: number;
  size?: number;
  tone?: "rose" | "gold";
}) {
  const fill = tone === "gold" ? "var(--color-gold)" : "var(--color-her-rose)";
  const stroke = tone === "gold" ? "var(--color-gold-3)" : "var(--color-her-rose)";
  return (
    <span className="star-pips inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((pip) => (
        <svg key={pip} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.44 6.2 20.5l1.1-6.47L2.6 9.45l6.5-.95z"
            fill={pip <= rating ? fill : "none"}
            stroke={pip <= rating ? stroke : "var(--color-smoke)"}
            strokeWidth="1.4"
          />
        </svg>
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function useReviews() {
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [newlySubmittedId, setNewlySubmittedId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await fetch(`${BASE_PATH}/api/reviews`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const payload = await res.json();
      setReviewsList(payload.data ?? []);
      setStats(payload.stats ?? null);
      setLoadState("ready");
    } catch {
      setReviewsList(initialReviews);
      setStats(calculateReviewStats(initialReviews));
      setLoadState("ready");
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    try {
      const stored = window.localStorage.getItem(HELPFUL_VOTES_KEY);
      if (stored) setVotedIds(JSON.parse(stored));
    } catch {
      // Corrupt local storage; continue gracefully
    }
  }, [fetchReviews]);

  const handleHelpful = async (id: string) => {
    if (votedIds[id]) return;
    const target = reviewsList.find((r) => r.id === id);
    if (!target) return;

    const previous = target.helpfulCount;
    setReviewsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpfulCount: previous + 1 } : r)),
    );

    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(id)}/helpful`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const payload = await res.json();
      setReviewsList((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, helpfulCount: payload.data.helpfulCount as number } : r,
        ),
      );
      const nextVotes = { ...votedIds, [id]: true };
      setVotedIds(nextVotes);
      window.localStorage.setItem(HELPFUL_VOTES_KEY, JSON.stringify(nextVotes));
    } catch {
      setReviewsList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, helpfulCount: previous } : r)),
      );
    }
  };

  return {
    reviewsList,
    setReviewsList,
    stats,
    setStats,
    loadState,
    votedIds,
    newlySubmittedId,
    setNewlySubmittedId,
    fetchReviews,
    handleHelpful,
  };
}

export function ReviewList({
  products,
  reviewsList,
  stats,
  loadState,
  votedIds,
  newlySubmittedId,
  fetchReviews,
  handleHelpful,
  onWrite,
}: {
  products: SearchProduct[];
  reviewsList: Review[];
  stats: ReviewStats | null;
  loadState: "loading" | "ready" | "error";
  votedIds: Record<string, boolean>;
  newlySubmittedId: string | null;
  fetchReviews: () => void;
  handleHelpful: (id: string) => void;
  onWrite: (event?: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const hasReviews = (stats?.totalReviews ?? 0) > 0;

  let filtered = [...reviewsList];
  if (selectedRating !== "all") {
    filtered = filtered.filter((r) => r.rating === Number(selectedRating));
  }
  if (selectedProduct !== "all") {
    filtered = filtered.filter(
      (r) => r.productSlug.toLowerCase() === selectedProduct.toLowerCase(),
    );
  }
  if (sortBy === "highest") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "helpful") {
    filtered.sort((a, b) => b.helpfulCount - a.helpfulCount);
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 md:px-10">
      {hasReviews && (
        <div className="mt-14 flex flex-col items-center gap-10 md:flex-row md:items-end md:justify-between">
          {/* Score */}
          <div className="relative w-full max-w-sm border border-gold-3/40 bg-cream p-8 text-center text-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7),0_0_50px_-18px_rgba(201,169,97,0.35)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-2 border border-gold/30" />
            <div className="relative font-display text-6xl font-light leading-none text-ink">
              {stats?.averageRating ?? "—"}
            </div>
            <div aria-hidden="true" className="mx-auto mt-3 h-px w-16 bg-gold-3/60" />
            <div
              className="relative mt-4 flex justify-center"
              role="img"
              aria-label={`${stats?.averageRating} out of 5 stars`}
            >
              <StarPips rating={stats ? Math.round(stats.averageRating) : 0} size={17} tone="gold" />
            </div>
            <div className="relative mt-4 eyebrow text-[10px] text-ink/55">
              Based on {stats?.totalReviews} {stats?.totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="w-full max-w-md" aria-hidden={loadState === "loading"}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats?.breakdown[star as 1 | 2 | 3 | 4 | 5] ?? 0;
              const total = stats?.totalReviews ?? 0;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const isSelected = selectedRating === String(star);
              return (
                <button
                  key={star}
                  type="button"
                  className={`group flex w-full items-center gap-4 py-1.5 text-left ${isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                  onClick={() =>
                    setSelectedRating((prev) => (prev === String(star) ? "all" : String(star)))
                  }
                  title={`Filter by ${star} stars (${count} reviews)`}
                >
                  <span className={`eyebrow w-4 text-[10px] ${isSelected ? "text-gold-2" : "text-cream/60"}`}>
                    <span>{star}</span>
                  </span>
                  <span className="relative h-px flex-1 bg-cream/25">
                    <span
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-3 via-gold to-gold-2 transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </span>
                  <span className="w-6 text-right font-sans text-[11px] tabular-nums text-cream/75">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasReviews && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-cream/10 py-4">
          <div className="relative">
            <select
              aria-label="Filter reviews by fragrance"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full appearance-none border border-gold/20 bg-ink-2 py-2 pl-3 pr-9 font-sans text-xs text-cream focus:outline-none"
            >
              <option value="all">All Fragrances ({reviewsList.length})</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
            <Icon.ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold/70" />
          </div>
          <div className="flex items-center gap-3">
            <span className="eyebrow text-[10px] text-cream/40">Sort by:</span>
            <div className="relative">
              <select
                aria-label="Sort reviews by criteria"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none border border-gold/20 bg-ink-2 py-2 pl-3 pr-9 font-sans text-xs text-cream focus:outline-none"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="helpful">Most Helpful</option>
              </select>
              <Icon.ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold/70" />
            </div>
          </div>
        </div>
      )}

      {loadState === "error" ? (
        <div className="mt-10 border border-her-rose/40 bg-her-deep/20 p-6 text-center" role="alert">
          <p className="font-sans text-sm text-cream/80">Reviews could not be loaded.</p>
          <button
            type="button"
            className="link-draw eyebrow mt-3 text-[10px] text-gold"
            onClick={() => fetchReviews()}
          >
            Try again
          </button>
        </div>
      ) : loadState === "loading" ? (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3" aria-busy="true" aria-label="Loading reviews">
          {[0, 1, 2].map((i) => (
            <div key={i} className="review-card reviews-skeleton bg-cream/95 p-6" aria-hidden="true">
              <div className="skeleton-line skeleton-line--title mb-3 h-4 w-1/2 animate-pulse bg-ink/10" />
              <div className="skeleton-line mb-2 h-3 w-full animate-pulse bg-ink/10" />
              <div className="skeleton-line mb-2 h-3 w-full animate-pulse bg-ink/10" />
              <div className="skeleton-line skeleton-line--short h-3 w-2/3 animate-pulse bg-ink/10" />
            </div>
          ))}
        </div>
      ) : reviewsList.length === 0 ? (
        <div className="mt-12 border border-gold/20 bg-ink-2/70 px-8 py-16 text-center">
          <div className="flex items-center justify-center gap-4 text-gold/70" aria-hidden="true">
            <span className="h-px w-16 bg-gold/40" />
            <svg width="9" height="9" viewBox="0 0 10 10">
              <rect x="2.2" y="2.2" width="5.6" height="5.6" transform="rotate(45 5 5)" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className="h-px w-16 bg-gold/40" />
          </div>
          <p className="mt-7 font-display text-2xl font-light italic text-cream/85">No reviews yet</p>
          <p className="mt-3 eyebrow text-[10px] text-cream/45">Your verdict completes the chapter</p>
          <div className="mt-8 flex justify-center">
            <Button variant="gold" onClick={onWrite}>
              Write a review
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 border border-gold/20 bg-ink-2/70 p-12 text-center">
          <p className="font-sans text-sm text-cream/70">No reviews match your selected filters.</p>
          <button
            type="button"
            className="link-draw eyebrow mt-3 text-[10px] text-gold"
            onClick={() => {
              setSelectedRating("all");
              setSelectedProduct("all");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {filtered.map((rev) => {
            const matchedProduct = products.find(
              (p) => p.slug.toLowerCase() === rev.productSlug.toLowerCase(),
            );
            const isVoted = Boolean(votedIds[rev.id]);
            const isNewlyAdded = rev.id === newlySubmittedId;
            return (
              <article
                key={rev.id}
                id={`review-${rev.id}`}
                className={`review-card relative bg-cream p-7 pb-8 text-ink shadow-[0_40px_60px_-30px_rgba(0,0,0,0.8)] ${isNewlyAdded ? "ring-1 ring-gold" : ""}`}
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-gold-3/70 via-gold/40 to-transparent" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-xl italic leading-none">{rev.authorName}</span>
                      <span className="eyebrow text-[9px] text-gold-3">· {rev.location}</span>
                    </div>
                    <div className="mt-1.5 eyebrow text-[9px] text-ink/45">
                      <time dateTime={rev.createdAt}>{formatDate(rev.createdAt)}</time>
                    </div>
                  </div>
                  <StarPips rating={rev.rating} />
                </div>

                {matchedProduct && (
                  <div className="mt-4 inline-block border border-gold-3/40 px-2 py-1">
                    <span className="eyebrow text-[9px] text-gold-3">{matchedProduct.name}</span>
                  </div>
                )}

                <div className="mt-5">
                  <h3 className="font-display text-xl leading-snug">{rev.title}</h3>
                  <p className="mt-2 font-sans text-[13px] font-light leading-relaxed text-ink/75">{rev.comment}</p>
                </div>

                <div className="mt-6 flex justify-end border-t border-ink/15 pt-4">
                  <button
                    type="button"
                    className={`link-draw eyebrow text-[9px] ${isVoted ? "text-her-rose" : "text-ink/55 hover:text-gold-3"}`}
                    onClick={() => handleHelpful(rev.id)}
                    disabled={isVoted}
                    aria-label={`Mark review by ${rev.authorName} as helpful. Currently ${rev.helpfulCount} helpful votes.`}
                  >
                    <span>{isVoted ? "Helpful" : "Helpful?"}</span>
                    <span className="ml-1 tabular-nums">({rev.helpfulCount})</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EGYPT_CITIES = [
  "Cairo",
  "Alexandria",
  "Giza",
  "New Cairo",
  "Zamalek",
  "Maadi",
  "Sheikh Zayed",
  "Mansoura",
  "Red Sea / Sahel",
  "Port Said",
  "Tanta",
  "Aswan",
  "Luxor",
];

export function ReviewDialog({
  products,
  onSubmitted,
}: {
  products: SearchProduct[];
  onSubmitted: (review: Review, stats: ReviewStats) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("Cairo");
  const [formProduct, setFormProduct] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"authorName" | "comment" | "form", string>>
  >({});
  const open = useCallback(
    (event?: React.MouseEvent<HTMLButtonElement>) => {
      triggerRef.current = (event?.currentTarget as HTMLElement | undefined) ?? null;
      const dialog = dialogRef.current;
      if (!dialog) return;
      setFormSubmitted(false);
      if (products.length > 0 && !products.some((p) => p.slug === formProduct)) {
        setFormProduct(products[0]?.slug ?? "");
      }
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        dialog
          .querySelector<HTMLElement>('#review-rating .star-choice-btn[aria-checked="true"]')
          ?.focus();
      });
    },
    [formProduct, products],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    const handleClose = () => {
      setSubmitting(false);
      triggerRef.current?.focus?.();
    };
    const handleExternalOpen = (event: Event) => {
      const trigger = (event as CustomEvent<HTMLElement | null>).detail ?? null;
      triggerRef.current = trigger;
      setFormSubmitted(false);
      if (!dialog.open) dialog.showModal();
      dialog.querySelector<HTMLElement>('#review-rating .star-choice-btn[aria-checked="true"]')?.focus();
    };
    dialog.addEventListener("click", handleClick);
    dialog.addEventListener("close", handleClose);
    window.addEventListener("miskova:open-review", handleExternalOpen);
    return () => {
      dialog.removeEventListener("click", handleClick);
      dialog.removeEventListener("close", handleClose);
      window.removeEventListener("miskova:open-review", handleExternalOpen);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Partial<Record<"authorName" | "comment", string>> = {};
    if (formName.trim().length < 2) errors.authorName = "Please enter your name.";
    if (formComment.trim().length < 10) errors.comment = "Please share at least 10 characters.";
    setFieldErrors(errors);
    if (errors.authorName || errors.comment) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: formName.trim(),
          productSlug: formProduct,
          rating: formRating,
          title: formTitle.trim(),
          comment: formComment.trim(),
          location: formCity,
        }),
      });
      let payload: { data?: Review; stats?: ReviewStats; error?: string };
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        setFieldErrors({ form: "Reviews could not be reached. Please try again." });
        return;
      }
      if (!res.ok || !payload.data || !payload.stats) {
        setFieldErrors({
          form: payload.error || "Your review could not be submitted. Please try again.",
        });
        return;
      }
      onSubmitted(payload.data, payload.stats);
      setFormSubmitted(true);
      setFieldErrors({});
    } catch {
      setFieldErrors({ form: "Reviews could not be reached. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "form-input w-full border border-ink/20 bg-white px-3 py-2.5 font-sans text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none";

  return (
    <>
      <Button variant="gold" onClick={open}>
        Write a review
      </Button>
      <dialog
        ref={dialogRef}
        className="review-dialog m-auto w-[min(92vw,560px)] border border-gold-3/30 bg-cream p-0 text-ink shadow-[0_60px_120px_-40px_rgba(0,0,0,0.85)] backdrop:bg-ink/80 backdrop:backdrop-blur-sm"
        aria-labelledby={formSubmitted ? "review-success-title" : "review-dialog-title"}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const root = dialogRef.current;
          if (!root) return;
          const focusables = Array.from(
            root.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null);
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="relative max-h-[86vh] overflow-y-auto p-8 md:p-10">
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <div className="flex items-start justify-between">
            <div>
              <Eyebrow className="text-gold-3">
                <Rule /> The register
              </Eyebrow>
              <h3 id="review-dialog-title" className="display mt-3 text-4xl">
                Write a review
              </h3>
            </div>
            <form method="dialog">
              <button type="submit" className="p-1 text-ink/50 transition-colors hover:text-ink" aria-label="Close review dialog">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          </div>
          {formSubmitted ? (
            <div className="mt-10 border-t border-ink/10 pt-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold text-gold-3" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p role="status" id="review-success-title" className="mt-5 font-display text-2xl italic text-ink/85">
                Thank you — your review is published
              </p>
              <form method="dialog" className="mt-6 flex justify-center">
                <Button variant="ink">Close</Button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label className="eyebrow mb-2 block text-[10px] text-ink/60" htmlFor="review-rating">
                  Rating
                </label>
                <div
                  className="star-rating-selector flex items-center gap-1"
                  role="radiogroup"
                  aria-label="Select star rating"
                  id="review-rating"
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                    event.preventDefault();
                    const next =
                      event.key === "ArrowRight"
                        ? Math.min(5, formRating + 1)
                        : Math.max(1, formRating - 1);
                    setFormRating(next);
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={star === formRating}
                      tabIndex={star === formRating ? 0 : -1}
                      className={`star-choice-btn p-1 ${star <= formRating ? "star-active" : ""}`}
                      onClick={() => setFormRating(star)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        setFormRating(star);
                      }}
                      aria-label={`${star} star`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.44 6.2 20.5l1.1-6.47L2.6 9.45l6.5-.95z"
                          fill={star <= formRating ? "var(--color-her-rose)" : "none"}
                          stroke={star <= formRating ? "var(--color-her-rose)" : "var(--color-smoke)"}
                          strokeWidth="1.4"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="form-product" className="eyebrow mb-2 block text-[10px] text-ink/60">
                  Fragrance
                </label>
                <div className="relative">
                  <select
                    id="form-product"
                    value={products.some((p) => p.slug === formProduct) ? formProduct : (products[0]?.slug ?? "")}
                    onChange={(e) => setFormProduct(e.target.value)}
                    className={`${inputCls} cursor-pointer appearance-none pr-9`}
                  >
                    {products.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Icon.ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="form-name" className="eyebrow mb-2 block text-[10px] text-ink/60">
                    Your Name
                  </label>
                  <input
                    id="form-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={inputCls}
                    aria-invalid={Boolean(fieldErrors.authorName)}
                    aria-describedby={fieldErrors.authorName ? "form-name-error" : undefined}
                  />
                  {fieldErrors.authorName && (
                    <p className="form-field-error mt-1.5 font-sans text-xs text-her-rose" id="form-name-error">
                      {fieldErrors.authorName}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="form-city" className="eyebrow mb-2 block text-[10px] text-ink/60">
                    City
                  </label>
                  <div className="relative">
                    <select
                      id="form-city"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className={`${inputCls} cursor-pointer appearance-none pr-9`}
                    >
                      {EGYPT_CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <Icon.ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="form-title" className="eyebrow mb-2 block text-[10px] text-ink/60">
                  Headline
                </label>
                <input
                  id="form-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="form-comment" className="eyebrow mb-2 block text-[10px] text-ink/60">
                  Review
                </label>
                <textarea
                  id="form-comment"
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  className={`${inputCls} form-textarea resize-none`}
                  aria-invalid={Boolean(fieldErrors.comment)}
                  aria-describedby={fieldErrors.comment ? "form-comment-error" : undefined}
                />
                {fieldErrors.comment && (
                  <p className="form-field-error mt-1.5 font-sans text-xs text-her-rose" id="form-comment-error">
                    {fieldErrors.comment}
                  </p>
                )}
              </div>

              {fieldErrors.form && (
                <p className="form-level-error border border-her-rose/40 bg-her-deep/10 p-3 text-center font-sans text-xs text-her-ink" role="alert">
                  {fieldErrors.form}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="gold" type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

export function ReviewsSection({ products }: { products: SearchProduct[] }) {
  const reviews = useReviews();
  const { showToast } = useStore();

  return (
    <section id="reviews" className="grain relative overflow-hidden border-t border-cream/10 pb-24 pt-20 text-cream" aria-labelledby="reviews-heading">
      {/* Warm umber band texture — consistent with the house's dark bands */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_15%_8%,rgba(201,169,97,0.14),transparent_62%),radial-gradient(55%_45%_at_88%_88%,rgba(140,107,47,0.18),transparent_62%),radial-gradient(45%_40%_at_58%_45%,rgba(180,83,106,0.06),transparent_65%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      <div className="relative mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow className="text-gold">
              <Rule /> Voices of the house
            </Eyebrow>
            <h2 className="reviews-title display mt-4 text-4xl md:text-5xl" id="reviews-heading">
              Customer reviews
            </h2>
            <p className="mt-3 hidden eyebrow text-[10px] text-cream/40 md:block">As shared with the house</p>
          </div>
          <ReviewDialog
            products={products}
            onSubmitted={(review, stats) => {
              reviews.setReviewsList((prev) => [review, ...prev]);
              reviews.setStats(stats);
              reviews.setNewlySubmittedId(review.id);
              showToast("Thank you — your review is published");
            }}
          />
        </div>

        <PatronCarousel />

        <ReviewList
          products={products}
          reviewsList={reviews.reviewsList}
          stats={reviews.stats}
          loadState={reviews.loadState}
          votedIds={reviews.votedIds}
          newlySubmittedId={reviews.newlySubmittedId}
          fetchReviews={reviews.fetchReviews}
          handleHelpful={reviews.handleHelpful}
          onWrite={(event?: React.MouseEvent<HTMLButtonElement>) =>
            window.dispatchEvent(
              new CustomEvent("miskova:open-review", {
                detail: (event?.currentTarget as HTMLElement | undefined) ?? null,
              }),
            )
          }
        />
      </div>
    </section>
  );
}
