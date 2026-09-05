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

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_STATUSES = ["pending", "collected"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

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
  // Fulfilment lifecycle (EasyOrders-style COD flow): the order starts
  // pending; payment is collected in cash by the courier at delivery.
  status: z.enum(ORDER_STATUSES).default("pending"),
  paymentMethod: z.literal("cod").default("cod"),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("pending"),
  paymentCollectedAt: z.string().datetime().nullable().default(null),
  statusUpdatedAt: z.string().datetime().nullable().default(null),
});

export type StoredOrder = z.infer<typeof StoredOrderSchema>;

const cleanText = () => z.string().transform((value) => normalizeText(value).trim());

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
    name: cleanText().pipe(z.string().min(2, "Please enter your name.").max(60)),
    phone: cleanText().pipe(z.string().min(7).max(20)).refine(isValidEgPhone, "Please enter a valid phone number."),
    governorate: z.enum(GOVERNORATES),
    address: cleanText().pipe(z.string().min(5, "Please enter your delivery address.").max(300)),
    notes: cleanText().pipe(z.string().max(500)).optional().default(""),
  }),
});

export type OrderSubmissionInput = z.infer<typeof OrderSubmissionSchema>;

/** Lenient EGP phone check: digits with optional +, spaces, dashes (7-20 chars, 7+ digits). */
export function isValidEgPhone(raw: string): boolean {
  const value = normalizeText(raw).trim();
  if (!/^[+\d][\d\s-]{6,19}$/.test(value)) return false;
  return value.replace(/\D/g, "").length >= 7;
}
