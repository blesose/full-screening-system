import { GoogleGenAI } from "@google/genai";
import {
  type AIScreeningResult,
} from "../schemas/ai.schema";

const apiKey = process.env.GEMINI_API_KEY;

// Only initialize if API key exists
const genai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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

/**
 * Generate a fallback response when AI is not available
 */
function getFallbackResponse(input: AIScreeningRequest): AIScreeningResult {
  const score = input.review.totalScore ?? 70;
  
  // Determine recommendation and confidence together
  let recommendation: "SHORTLIST" | "REJECT" | "MANUAL_REVIEW";
  let confidence: number;
  
  if (score >= input.rubric.shortlistThreshold) {
    recommendation = "SHORTLIST";
    confidence = 85;
  } else if (score <= input.rubric.rejectThreshold) {
    recommendation = "REJECT";
    confidence = 85;
  } else {
    recommendation = "MANUAL_REVIEW";
    confidence = 60;
  }

  // Build strengths based on data
  const strengths: string[] = [];
  if (input.applicant.gpa >= 3.5) {
    strengths.push(`Strong GPA of ${input.applicant.gpa}/${input.applicant.gpaScale}`);
  }
  if (input.applicant.testScore >= 85) {
    strengths.push(`Good test score of ${input.applicant.testScore}/100`);
  }
  if (input.applicant.activities.length > 0) {
    strengths.push(`Active participation in ${input.applicant.activities.length} activities`);
  }
  if (input.applicant.achievements.length > 0) {
    strengths.push(`${input.applicant.achievements.length} achievements listed`);
  }
  if (strengths.length === 0) {
    strengths.push("Application submitted and ready for review");
  }

  // Build concerns based on data
  const concerns: string[] = [];
  if (input.applicant.gpa < 2.5) {
    concerns.push(`GPA of ${input.applicant.gpa} is below average`);
  }
  if (input.applicant.testScore < 60) {
    concerns.push(`Test score of ${input.applicant.testScore} is below threshold`);
  }
  if (input.review.status !== "COMPLETE") {
    concerns.push("Review is not yet complete");
  }
  if (input.applicant.essay.length < 100) {
    concerns.push("Personal statement is brief and could be more detailed");
  }

  // Build evidence
  const evidence: string[] = [
    `GPA: ${input.applicant.gpa}/${input.applicant.gpaScale}`,
    `Test Score: ${input.applicant.testScore}/100`,
    `Review Score: ${score}/100`,
    `Review Status: ${input.review.status}`,
    `Program: ${input.applicant.program}`,
  ];
  if (input.applicant.activities.length > 0) {
    evidence.push(`Activities: ${input.applicant.activities.join(", ")}`);
  }
  if (input.applicant.achievements.length > 0) {
    evidence.push(`Achievements: ${input.applicant.achievements.join(", ")}`);
  }

  return {
    recommendation,
    confidence,
    score: Math.round(score),
    summary: `The applicant scored ${Math.round(score)}/100 on the screening rubric. ${recommendation === "SHORTLIST" ? "Meets the shortlist threshold." : recommendation === "REJECT" ? "Does not meet the minimum requirements." : "Requires manual review by the admissions team."}`,
    strengths: strengths.length > 0 ? strengths : ["Application shows potential"],
    concerns: concerns.length > 0 ? concerns : ["No major concerns identified"],
    evidence,
  };
}

export async function screenApplicant(
  input: AIScreeningRequest,
): Promise<AIScreeningResult> {
  // If Gemini is not available, use fallback
  if (!genai) {
    console.log("Gemini API not configured. Using fallback screening.");
    return getFallbackResponse(input);
  }

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

  try {
    const response = await genai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const output = response.text;

    if (!output) {
      console.log("Gemini returned empty response. Using fallback.");
      return getFallbackResponse(input);
    }

    // Strip markdown code fences if present, as a safety net
    const cleaned = output.trim().replace(/^```json\s*|\s*```$/g, "");

    let parsed: unknown;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.log("Gemini returned invalid JSON. Using fallback.");
      return getFallbackResponse(input);
    }

    // Validate the response structure
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "recommendation" in parsed &&
      "score" in parsed
    ) {
      // Normalize confidence: some responses return 0-1 fractions instead of 0-100
      if (
        "confidence" in parsed &&
        typeof (parsed as { confidence: unknown }).confidence === "number"
      ) {
        const record = parsed as { confidence: number };
        if (record.confidence <= 1) {
          record.confidence = Math.round(record.confidence * 100);
        }
      }
      return parsed as AIScreeningResult;
    } else {
      console.log("Gemini response structure invalid. Using fallback.");
      return getFallbackResponse(input);
    }
  } catch (error) {
    console.error("AI screening error:", error);
    console.log("Using fallback response due to AI service error.");
    return getFallbackResponse(input);
  }
}