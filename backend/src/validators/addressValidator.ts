import { z } from "zod";

export const createAddressSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters long" }),
  phone: z.string().min(7, { message: "Phone number must be at least 7 characters long" }),
  addressLine1: z.string().min(3, { message: "Address line 1 must be at least 3 characters long" }),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(2, { message: "City must be at least 2 characters long" }),
  state: z.string().min(2, { message: "State must be at least 2 characters long" }),
  postalCode: z.string().min(3, { message: "Postal code must be at least 3 characters long" }),
  country: z.string().min(2, { message: "Country must be at least 2 characters long" }),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();
