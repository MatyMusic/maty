import { z } from "zod";

export const phoneRegex = /^[+()\- 0-9]{6,20}$/;

export const AddressZ = z.object({
  street: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  region: z.string().trim().optional().default(""),
  zip: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default("IL"),
});

export const CustomerCreateZ = z.object({
  fullName: z.string().min(2, "שם קצר מדי"),
  email: z.string().email(),
  phone: z.string().regex(phoneRegex, "טלפון לא תקין"),
  address: AddressZ.optional().default({}),
  status: z
    .enum(["lead", "contacted", "qualified", "booked", "archived"])
    .optional()
    .default("lead"),
  notes: z.string().max(2000).optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().optional().default(""),
  assignedToUserId: z.string().optional(),
});

export const CustomerUpdateZ = CustomerCreateZ.partial();
