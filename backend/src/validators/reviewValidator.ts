import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z
    .number({ error: "Rating must be a number" })
    .int({ error: "Rating must be an integer" })
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating cannot exceed 5" }),
  comment: z.string().optional().nullable(),
});

export const updateReviewSchema = z.object({
  rating: z
    .number({ error: "Rating must be a number" })
    .int({ error: "Rating must be an integer" })
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating cannot exceed 5" })
    .optional(),
  comment: z.string().optional().nullable(),
});
