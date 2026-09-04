import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { StoredReviewSchema, normalizeText, type StoredReview } from "./reviewSchemas";
import type { NewReviewInput, Review } from "@/types/reviews";

export class ReviewValidationError extends Error {
  field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = "ReviewValidationError";
    this.field = field;
  }
}

export class ReviewStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewStorageError";
  }
}

function resolveStorePath(): string {
  const override = process.env.REVIEWS_STORE_PATH;
  console.log("resolveStorePath returns:", path.join(process.cwd(), ".data", "reviews.json"));
  if (override && override.trim()) return override;
  return path.join(process.cwd(), ".data", "reviews.json");
}

// Serialize all writes through one chain so concurrent requests never clobber each other.

// Cross-process safety: exclusive lock file with stale-lock recovery.
async function withFileLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  const lockPath = `${filePath}.lock`;
  const staleMs = 10_000;
  const deadline = Date.now() + 10_000;
  for (;;) {
    try {
      const handle = await fs.open(lockPath, "wx");
      try {
        await handle.writeFile(`${process.pid}:${Date.now()}`);
      } finally {
        await handle.close();
      }
      try {
        return await task();
      } finally {
        try {
          await fs.unlink(lockPath);
        } catch {
          /* already released */
        }
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== "EEXIST") throw error;
      try {
        const raw = await fs.readFile(lockPath, "utf8");
        const stamp = Number(raw.split(":")[1]);
        if (Number.isFinite(stamp) && Date.now() - stamp > staleMs) {
          await fs.unlink(lockPath);
          continue;
        }
      } catch {
        /* lock vanished; retry */
      }
      if (Date.now() > deadline) {
        throw new ReviewStorageError("Review store is busy. Please try again.");
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

async function readStore(): Promise<Review[]> {
  const storePath = resolveStorePath();
  let raw: string;
  try {
    raw = await fs.readFile(storePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw new ReviewStorageError("Review store is unavailable.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ReviewStorageError("Review store is unavailable.");
  }
  if (!Array.isArray(parsed)) throw new ReviewStorageError("Review store is unavailable.");
  const reviews: Review[] = [];
  for (const entry of parsed) {
    const result = StoredReviewSchema.safeParse(entry);
    if (!result.success) throw new ReviewStorageError("Review store is unavailable.");
    reviews.push(result.data as Review);
  }
  return reviews;
}

async function writeStore(reviews: Review[]): Promise<void> {
  const storePath = resolveStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  const tmp = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(reviews, null, 2), "utf8");
    await fs.rename(tmp, storePath);
  } catch (err) {
    try {
      await fs.unlink(tmp);
    } catch {
      /* cleanup best-effort */
    }
    throw new ReviewStorageError("Review store is unavailable.");
  }
}

export async function getReviews(): Promise<Review[]> {
  return readStore();
}

export function createFileReviewStore(_storePath: string) {
  return {
    list: () => readStore(),
    create: (input: NewReviewInput, validSlugs: Set<string>) => addReview(input, validSlugs),
    voteHelpful: (id: string) => voteHelpful(id),
  };
}

let writeChain: Promise<unknown> = Promise.resolve();

export async function addReview(
  input: NewReviewInput,
  validSlugs?: Set<string>,
): Promise<Review> {
  const authorName = normalizeText(
    typeof input.authorName === "string" ? input.authorName : "",
  ).trim();
  if (authorName.length < 2 || authorName.length > 60) {
    throw new ReviewValidationError(
      "Your name must be between 2 and 60 characters.",
      "authorName",
    );
  }

  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewValidationError("Please choose a rating between 1 and 5 stars.", "rating");
  }

  const comment = normalizeText(
    typeof input.comment === "string" ? input.comment : "",
  ).trim();
  if (comment.length < 10 || comment.length > 2000) {
    throw new ReviewValidationError(
      "Your review must be between 10 and 2000 characters.",
      "comment",
    );
  }

  let title = normalizeText(typeof input.title === "string" ? input.title : "").trim();
  if (title.length > 120) {
    throw new ReviewValidationError("The title must be 120 characters or fewer.", "title");
  }
  if (!title) title = `${rating}-Star Experience`;

  const productSlug = typeof input.productSlug === "string" ? input.productSlug : "";
  if (!productSlug) {
    throw new ReviewValidationError("Please select a valid fragrance.", "productSlug");
  }
  if (validSlugs && !validSlugs.has(productSlug)) {
    throw new ReviewValidationError("Please select a valid fragrance.", "productSlug");
  }

  let location = normalizeText(
    typeof input.location === "string" ? input.location : "",
  ).trim();
  if (location.length > 60) {
    throw new ReviewValidationError("The city must be 60 characters or fewer.", "location");
  }
  if (!location) location = "Cairo, Egypt";

  const review: StoredReview = {
    id: randomUUID(),
    productSlug,
    authorName,
    rating,
    title,
    comment,
    verifiedBuyer: false,
    location,
    createdAt: new Date().toISOString(),
    helpfulCount: 0,
  };

  return await withFileLock(resolveStorePath(), async () => {
    const reviews = await readStore();
    reviews.unshift(review);
    await writeStore(reviews);
    return review;
  });
}

export async function voteHelpful(id: string): Promise<Review | null> {
  const parsed = StoredReviewSchema.shape.id.safeParse(id);
  if (!parsed.success) {
    throw new ReviewValidationError("Invalid review id.", "id");
  }
  const run = writeChain.then(() =>
    withFileLock(resolveStorePath(), async () => {
      const reviews = await readStore();
      const review = reviews.find((r) => r.id === id);
      if (!review) return null;
      review.helpfulCount += 1;
      await writeStore(reviews);
      return review;
    }),
  );
  writeChain = run.catch(() => undefined);
  return run;
}

export type { ReviewStats } from "@/types/reviews";
