import { GoogleGenAI } from "@google/genai";
import {
  type AIScreeningResult,
} from "../schemas/ai.schema";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const genai = new GoogleGenAI({
  apiKey,
});

export interface AIScreeningRequest {
  applicant: {
    firstName: string;
    lastName: string;
    program: string;
    gpa: number;
    gpaScale: number;
    testScore: number;
    essay: string;
    activities: string[];
    achievements: string[];
    recommendationStatus: string;
  };

  review: {
    totalScore: number | null;
    status: string;
    scores?: Record<string, number | null>;
  };

  rubric: {
    shortlistThreshold: number;
    rejectThreshold: number;
  };
}

export async function screenApplicant(
  input: AIScreeningRequest,
): Promise<AIScreeningResult> {
  const prompt = `
You are an AI screening assistant for an admissions
screening and shortlisting system.

Your role is to assist authorized human reviewers.

Analyze applications using ONLY the information provided
in the application, review, and rubric.

Do not make assumptions about protected characteristics,
social status, ethnicity, religion, gender, disability,
family background, or other sensitive attributes.

Do not make the final admissions decision.

Provide an evidence-based recommendation that supports
human review.

The recommendation must be one of:
SHORTLIST
REJECT
MANUAL_REVIEW

Use the configured rubric thresholds.

If the reviewer has completed the rubric, treat the
reviewer's total score as the authoritative screening
score.

If the review is incomplete, clearly state that the
analysis is a pre-screening assessment.

Keep the reasoning grounded in the supplied evidence.

Return ONLY valid JSON in this exact structure:

{
  "recommendation": "SHORTLIST | REJECT | MANUAL_REVIEW",
  "confidence": 0,
  "score": 0,
  "summary": "string",
  "strengths": ["string"],
  "concerns": ["string"],
  "evidence": ["string"]
}

Application data:

${JSON.stringify(input, null, 2)}
`;

  const response = await genai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const output = response.text;

if (!output) {
  throw new Error("Gemini returned an empty response.");
}

// Strip markdown code fences if present, as a safety net
const cleaned = output.trim().replace(/^```json\s*|\s*```$/g, "");

let parsed: unknown;

try {
  parsed = JSON.parse(cleaned);
} catch {
  throw new Error("Gemini returned invalid JSON.");
}

// Normalize confidence: some responses return 0-1 fractions instead of 0-100
if (
  typeof parsed === "object" &&
  parsed !== null &&
  "confidence" in parsed &&
  typeof (parsed as { confidence: unknown }).confidence === "number"
) {
  const record = parsed as { confidence: number };

  if (record.confidence <= 1) {
    record.confidence = Math.round(record.confidence * 100);
  }
}
}