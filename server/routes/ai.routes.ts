import { Router } from "express";
import { z } from "zod";
import {
  screenApplicant,
  type AIScreeningRequest,
} from "../services/ai.service";

const router = Router();

const AIScreeningRequestSchema = z.object({
  applicant: z.object({
    firstName: z.string(),
    lastName: z.string(),
    program: z.string(),
    gpa: z.number(),
    gpaScale: z.number(),
    testScore: z.number(),
    essay: z.string(),
    activities: z.array(z.string()),
    achievements: z.array(z.string()),
    recommendationStatus: z.string(),
  }),

  review: z.object({
    totalScore: z.number().nullable(),
    status: z.string(),
    scores: z.record(z.string(), z.number().nullable()).optional(),
  }),

  rubric: z.object({
    shortlistThreshold: z.number(),
    rejectThreshold: z.number(),
  }),
});

router.post("/screen", async (req, res) => {
  try {
    const parsed = AIScreeningRequestSchema.parse(req.body);

    const result = await screenApplicant(
      parsed as AIScreeningRequest,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("AI screening error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid screening request.",
        details: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      error: "AI screening failed.",
    });
  }
});

export default router;