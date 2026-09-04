export type Review = {
  id: string;
  productSlug: string;
  authorName: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  location: string;
  createdAt: string;
  helpfulCount: number;
  perfumeNotes?: string;
};

export interface PatronDispatch {
  id: string;
  cdnUrl: string;
  localPath?: string;
  altText: string;
  title?: string;
}

export type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
};

export type NewReviewInput = {
  productSlug: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  location?: string;
};
