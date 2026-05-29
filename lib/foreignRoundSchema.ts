import { z } from "zod";

export const foreignRoundSchema = z.object({
  playerId: z.string().trim().min(1, "Please enter your HNA Player ID."),
  fullName: z.string().trim().min(2, "Please enter your full name."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ?? "").trim()),
  datePlayed: z.string().min(1, "Please select the date you played."),
  country: z.string().trim().min(2, "Please enter the country where you played."),
  courseName: z.string().trim().min(2, "Please enter the course name."),
  courseRating: z.coerce.number().min(50).max(90),
  slopeRating: z.coerce.number().int().min(55).max(155),
  par: z.coerce.number().int().min(60).max(80),
  grossScore: z.coerce.number().int().min(40).max(200),
});

export type ForeignRoundInput = z.infer<typeof foreignRoundSchema>;

