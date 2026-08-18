import aiApi from "../../lib/aiApi";

export interface AIScreeningResult {
  recommendation: "SHORTLIST" | "REJECT" | "MANUAL_REVIEW";
  confidence: number;
  score: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  evidence: string[];
}

export interface AIScreeningApplicant {
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
}

export interface AIScreeningReview {
  totalScore: number | null;
  status: string;
  scores?: Record<string, number | null>;
}

export interface AIScreeningRubric {
  shortlistThreshold: number;
  rejectThreshold: number;
}

interface AIScreeningApiResponse {
  success: boolean;
  data?: AIScreeningResult;
  error?: string;
}

export async function analyzeApplication(
  applicant: AIScreeningApplicant,
  review: AIScreeningReview,
  rubric: AIScreeningRubric,
): Promise<AIScreeningResult> {
  const response = await aiApi.post<AIScreeningApiResponse>(
    "/api/ai/screen",
    { applicant, review, rubric },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "AI screening failed.");
  }

  return response.data.data;
}