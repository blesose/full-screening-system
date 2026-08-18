import z from "zod";

export const AIScreeningResultSchema = z.object({
  recommendation: z.enum([
    "SHORTLIST",
    "REJECT",
    "MANUAL_REVIEW",
  ]),

  confidence: z.number().min(0).max(100),

  score: z.number().min(0).max(100),

  summary: z.string(),

  strengths: z.array(z.string()),

  concerns: z.array(z.string()),

  evidence: z.array(z.string()),
});

export type AIScreeningResult = z.infer<
  typeof AIScreeningResultSchema>;