"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CatalogProduct } from "@/data/products";
import type { Review, ReviewStats } from "@/types/reviews";
import { PatronCarousel } from "./reviews/PatronCarousel";
import lux from "./reviews/luxury.module.css";

const HELPFUL_VOTES_KEY = "miskova:helpful-votes";

type SearchProduct = Pick<CatalogProduct, "name" | "slug">;

function StarPips({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="star-pips" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((pip) => (
        <svg key={pip} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.44 6.2 20.5l1.1-6.47L2.6 9.45l6.5-.95z"
            fill={pip <= rating ? "var(--gold)" : "none"}
            stroke={pip <= rating ? "var(--gold)" : "var(--line)"}
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
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error(`status ${res.status}`);
      const payload = await res.json();
      setReviewsList(payload.data ?? []);
      setStats(payload.stats ?? null);
      setLoadState("ready");
    } catch {
      setLoadState("error");
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
    <div className="reviews-registry-wrapper">
      {hasReviews && (
        <div className="reviews-overview-card">
          <div className="overview-score-box">
            <div className="overview-score-number">{stats?.averageRating ?? "—"}</div>
            <div
              className="overview-stars"
              role="img"
              aria-label={`${stats?.averageRating} out of 5 stars`}
            >
              <StarPips rating={stats ? Math.round(stats.averageRating) : 0} size={17} />
            </div>
            <div className="overview-count">
              Based on {stats?.totalReviews} {stats?.totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>

          <div className="overview-bars" aria-hidden={loadState === "loading"}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats?.breakdown[star as 1 | 2 | 3 | 4 | 5] ?? 0;
              const total = stats?.totalReviews ?? 0;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const isSelected = selectedRating === String(star);
              return (
                <button
                  key={star}
                  type="button"
                  className={`bar-row-btn ${isSelected ? "bar-active" : ""}`}
                  onClick={() =>
                    setSelectedRating((prev) => (prev === String(star) ? "all" : String(star)))
                  }
                  title={`Filter by ${star} stars (${count} reviews)`}
                >
                  <span className="bar-star-label">
                    <span>{star}</span>
                  </span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${percentage}%` }} />
                  </span>
                  <span className="bar-count-label">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasReviews && (
        <div className="reviews-toolbar">
          <div className="toolbar-left">
            <div className="filter-select-wrapper">
              <select
                aria-label="Filter reviews by fragrance"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Fragrances ({reviewsList.length})</option>
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="toolbar-right">
            <span className="sort-label">Sort by:</span>
            <select
              aria-label="Sort reviews by criteria"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Most Recent</option>
              <option value="highest">Highest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {loadState === "error" ? (
        <div className="reviews-error-banner" role="alert">
          <p className="error-banner-text">Reviews could not be loaded.</p>
          <button type="button" className="reset-filters-btn" onClick={() => fetchReviews()}>
            Try again
          </button>
        </div>
      ) : loadState === "loading" ? (
        <div className="reviews-grid" aria-busy="true" aria-label="Loading reviews">
          {[0, 1, 2].map((i) => (
            <div key={i} className="review-card reviews-skeleton" aria-hidden="true">
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
          ))}
        </div>
      ) : reviewsList.length === 0 ? (
        <div className="no-reviews-box zero-registry-box">
          <p className="no-reviews-text">No reviews yet</p>
          <button type="button" className="mk-primary-button write-first-btn" onClick={onWrite}>
            Write a review
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="no-reviews-box">
          <p>No reviews match your selected filters.</p>
          <button
            type="button"
            className="reset-filters-btn"
            onClick={() => {
              setSelectedRating("all");
              setSelectedProduct("all");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="reviews-grid">
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
                className={`review-card ${isNewlyAdded ? "is-newly-added" : ""}`}
              >
                <div className="review-card-header">
                  <div className="reviewer-info">
                    <div>
                      <div className="reviewer-name-row">
                        <span className="reviewer-name">{rev.authorName}</span>
                        <span className="community-badge">· {rev.location}</span>
                      </div>
                      <div className="reviewer-meta">
                        <time dateTime={rev.createdAt}>{formatDate(rev.createdAt)}</time>
                      </div>
                    </div>
                  </div>
                  <StarPips rating={rev.rating} />
                </div>

                {matchedProduct && (
                  <div className="review-product-tag">
                    <span className="tag-fragrance-name">{matchedProduct.name}</span>
                  </div>
                )}

                <div className="review-content">
                  <h3 className="review-headline">{rev.title}</h3>
                  <p className="review-body-text">{rev.comment}</p>
                </div>

                <div className="review-card-footer">
                  <button
                    type="button"
                    className={`helpful-btn ${isVoted ? "voted" : ""}`}
                    onClick={() => handleHelpful(rev.id)}
                    disabled={isVoted}
                    aria-label={`Mark review by ${rev.authorName} as helpful. Currently ${rev.helpfulCount} helpful votes.`}
                  >
                    <span>{isVoted ? "Helpful" : "Helpful?"}</span>
                    <span className="helpful-count">({rev.helpfulCount})</span>
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

  return (
    <>
      <button type="button" className="mk-primary-button header-write-btn" onClick={open}>
        Write a review
      </button>
      <dialog
        ref={dialogRef}
        className={`review-dialog ${lux.reviewDialog}`}
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
        <div className={lux.reviewDialogInner}>
        <div className={lux.reviewDialogHead}>
          <div>
            <h3 id="review-dialog-title" className={lux.reviewDialogTitle}>
              Write a review
            </h3>
            <div className={lux.reviewDialogRule} aria-hidden="true" />
          </div>
          <form method="dialog">
            <button type="submit" className="modal-close-btn" aria-label="Close review dialog">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </form>
        </div>
        {formSubmitted ? (
          <div className="review-success-block">
            <span className="review-success-seal" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p role="status" id="review-success-title" className="review-success-text">Thank you — your review is published</p>
            <form method="dialog">
              <button type="submit" className="mk-primary-button review-success-close">
                Close
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="review-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="review-rating">
                Rating
              </label>
              <div
                className="star-rating-selector"
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
                    className={`star-choice-btn ${star <= formRating ? "star-active" : ""}`}
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
                        fill={star <= formRating ? "var(--gold)" : "none"}
                        stroke={star <= formRating ? "var(--gold)" : "var(--ink-soft)"}
                        strokeWidth="1.4"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="form-product" className="form-label">
                Fragrance
              </label>
              <select
                id="form-product"
                value={products.some((p) => p.slug === formProduct) ? formProduct : (products[0]?.slug ?? "")}
                onChange={(e) => setFormProduct(e.target.value)}
                className="form-input"
              >
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="form-name" className="form-label">
                  Your Name
                </label>
                <input
                  id="form-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="form-input"
                  aria-invalid={Boolean(fieldErrors.authorName)}
                  aria-describedby={fieldErrors.authorName ? "form-name-error" : undefined}
                />
                {fieldErrors.authorName && (
                  <p className="form-field-error" id="form-name-error">
                    {fieldErrors.authorName}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="form-city" className="form-label">
                  City
                </label>
                <select
                  id="form-city"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="form-input"
                >
                  {EGYPT_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="form-title" className="form-label">
                Headline
              </label>
              <input
                id="form-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="form-comment" className="form-label">
                Review
              </label>
              <textarea
                id="form-comment"
                rows={4}
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                className="form-input form-textarea"
                aria-invalid={Boolean(fieldErrors.comment)}
                aria-describedby={fieldErrors.comment ? "form-comment-error" : undefined}
              />
              {fieldErrors.comment && (
                <p className="form-field-error" id="form-comment-error">
                  {fieldErrors.comment}
                </p>
              )}
            </div>

            {fieldErrors.form && (
              <p className="form-level-error" role="alert">
                {fieldErrors.form}
              </p>
            )}

            <button type="submit" disabled={submitting} className="mk-primary-button form-submit-btn">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
        </div>
      </dialog>
    </>
  );
}

export function ReviewsSection({ products }: { products: SearchProduct[] }) {
  const reviews = useReviews();

  return (
    <section id="reviews" className={`reviews-section ${lux.scope}`} aria-labelledby="reviews-heading">
      <div className="reviews-container">
        <div className="reviews-header">
          <h2 className="reviews-title" id="reviews-heading">
            Customer reviews
          </h2>
          <ReviewDialog
            products={products}
            onSubmitted={(review, stats) => {
              reviews.setReviewsList((prev) => [review, ...prev]);
              reviews.setStats(stats);
              reviews.setNewlySubmittedId(review.id);
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
