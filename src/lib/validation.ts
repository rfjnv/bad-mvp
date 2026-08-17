import { z } from "zod";
import { normalizePhone } from "./format";

export const telegramLinkSchema = z.object({
  deviceId: z.string().trim().min(8).max(100),
});

export const telegramSyncRoutineSchema = z.object({
  deviceId: z.string().trim().min(8).max(100),
  items: z.array(z.string().trim().min(1).max(200)).max(50),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(999),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Укажите имя").max(120),
  customerPhone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v) !== null, "Неверный формат телефона"),
  customerAddress: z.string().trim().min(5, "Укажите адрес доставки").max(500),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "PAYME", "CLICK"]),
  items: z.array(checkoutItemSchema).min(1, "Корзина пуста"),
  appliedBundleSlug: z.string().trim().min(1).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  login: z.string().trim().min(1, "Укажите логин"),
  password: z.string().min(1, "Укажите пароль"),
});

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Укажите slug")
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  name: z.string().trim().min(1, "Укажите название"),
  sortOrder: z.number().int().default(0),
});

export const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Укажите slug")
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  name: z.string().trim().min(1, "Укажите название"),
  brand: z.string().trim().min(1, "Укажите бренд"),
  categoryId: z.string().trim().min(1, "Выберите категорию"),
  description: z.string().trim().min(1, "Укажите описание"),
  composition: z.string().trim().min(1, "Укажите состав"),
  dosage: z.string().trim().min(1, "Укажите способ применения"),
  price: z.number().int().positive("Цена должна быть больше нуля"),
  oldPrice: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0),
  imageUrl: z.string().trim().min(1, "Укажите изображение"),
  sesCertNumber: z.string().trim().max(120).nullable().optional(),
  sesCertFileUrl: z.string().trim().max(300).nullable().optional(),
  sesCertIssuedAt: z.coerce.date().nullable().optional(),
  sesCertExpiresAt: z.coerce.date().nullable().optional(),
  conformityCertNumber: z.string().trim().max(120).nullable().optional(),
  conformityCertFileUrl: z.string().trim().max(300).nullable().optional(),
  conformityCertIssuedAt: z.coerce.date().nullable().optional(),
  conformityCertExpiresAt: z.coerce.date().nullable().optional(),
  activeSubstance: z.string().trim().max(120).nullable().optional(),
  activeAmount: z.number().positive().nullable().optional(),
  activeUnit: z.string().trim().max(20).nullable().optional(),
  servingsPerPackage: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

export const bundleSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Укажите slug")
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  name: z.string().trim().min(1, "Укажите название"),
  description: z.string().trim().min(1, "Укажите описание"),
  discountPct: z.number().int().min(1).max(50),
  imageUrl: z.string().trim().min(1, "Укажите изображение"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  productIds: z.array(z.string().min(1)).min(2, "Выберите минимум 2 товара"),
});

export const bannerSchema = z.object({
  title: z.string().trim().min(1, "Укажите заголовок").max(120),
  subtitle: z.string().trim().max(200).nullable().optional(),
  imageUrl: z.string().trim().min(1, "Укажите изображение"),
  linkUrl: z.string().trim().max(300).nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const orderStatusSchema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export const subscriptionRequestSchema = z.object({
  plan: z.enum(["BASIC", "COMPLEX", "PREMIUM"]),
  customerName: z.string().trim().min(2, "Укажите имя").max(120),
  customerPhone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v) !== null, "Неверный формат телефона"),
  age: z.number().int().positive().max(120).nullable().optional(),
  goals: z.array(z.string()).min(1, "Выберите хотя бы одну цель"),
  healthNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const subscriptionStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "ACTIVE", "CANCELLED"]),
});

export const catalogQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  sort: z.enum(["price_asc", "price_desc", "name_asc"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
});
