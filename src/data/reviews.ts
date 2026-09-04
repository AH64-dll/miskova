import { Review } from "@/types/reviews";

export const initialReviews: Review[] = [];

export function calculateReviewStats(reviews: Review[]): {
  averageRating: number;
  totalReviews: number;
  breakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
} {
  const total = reviews.length;
  if (total === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star] = (breakdown[star] || 0) + 1;
    sum += r.rating;
  }

  const averageRating = Number((sum / total).toFixed(1));
  return { averageRating, totalReviews: total, breakdown };
}
