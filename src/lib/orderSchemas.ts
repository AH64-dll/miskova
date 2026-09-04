import { z } from "zod";
import { normalizeText } from "./reviewSchemas";

export { normalizeText };

export const GOVERNORATES = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Red Sea",
  "Beheira",
  "Fayoum",
  "Gharbia",
  "Ismailia",
  "Menofia",
  "Minya",
  "Qalyubia",
  "New Valley",
  "Suez",
  "Aswan",
  "Asyut",
  "Beni Suef",
  "Port Said",
  "Damietta",
  "Sharkia",
  "South Sinai",
  "Kafr El Sheikh",
  "Matrouh",
  "Luxor",
  "Qena",
  "North Sinai",
  "Sohag",
] as const;

export const StoredOrderSchema = z.object({
  ref: z.string().min(1).max(32),
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        qty: z.number().int().min(1).max(9),
        unitPrice: z.number().int().min(0),
        name: z.string().min(1),
      }),
    )
    .min(1)
    .max(10),
  total: z.number().int().min(0),
  customer: z.object({
    name: z.string().min(2).max(60),
    phone: z.string().min(7).max(20),
    governorate: z.string().min(1).max(40),
    address: z.string().min(5).max(300),
    notes: z.string().max(500),
  }),
  createdAt: z.string().datetime(),
});

export type StoredOrder = z.infer<typeof StoredOrderSchema>;

export const OrderSubmissionSchema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        qty: z.number().int().min(1).max(9),
      }),
    )
    .min(1)
    .max(10),
  customer: z.object({
    name: z.string().min(2).max(60),
    phone: z.string().min(7).max(20),
    governorate: z.enum(GOVERNORATES),
    address: z.string().min(5).max(300),
    notes: z.string().max(500).optional().default(""),
  }),
});

export type OrderSubmissionInput = z.infer<typeof OrderSubmissionSchema>;

/** Lenient EGP phone check: digits with optional +, spaces, dashes (7-20 chars, 7+ digits). */
export function isValidEgPhone(raw: string): boolean {
  const value = normalizeText(raw).trim();
  if (!/^[+\d][\d\s-]{6,19}$/.test(value)) return false;
  return value.replace(/\D/g, "").length >= 7;
}
