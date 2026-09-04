import { z } from "zod";

export const StoredReviewSchema = z.object({
  id: z.string().uuid(),
  productSlug: z.string().min(1),
  authorName: z.string().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120),
  comment: z.string().min(10).max(2000),
  verifiedBuyer: z.boolean(),
  location: z.string().max(60),
  createdAt: z.string().datetime(),
  helpfulCount: z.number().int().min(0),
  status: z.enum(["approved", "pending"]).optional(),
});

export type StoredReview = z.infer<typeof StoredReviewSchema>;

export const SubmissionSchema = z.object({
  productSlug: z.string().min(1),
  authorName: z.string().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().default(""),
  comment: z.string().min(10).max(2000),
  location: z.string().max(60).optional().default(""),
});

export type SubmissionInput = z.infer<typeof SubmissionSchema>;

export function normalizeText(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}
