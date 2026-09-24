import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().min(1, { message: "Delivery address ID is required" }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
