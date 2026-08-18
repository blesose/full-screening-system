export type AIAnalysisType = 
| "ESSAY"
| "PROFILE"
| "EVIDENCE";

export interface AIEvidence {
    text: string;
    category: "STRENGTH" | "CONCERN" | "NEUTRAL";
    source: string;
}

export interface AIAnalysis {
    id: string;
    applicationId: string;
    type: AIAnalysisType;
    summary: string;
    evidence: AIEvidence[];
    createdAt: string;
    provider: string;
    model: string;
}

export type AIRecommendation = "SHORTLIST" | "REJECT" | "MANUAL_REVIEW";

export interface AIScreeningRecord {
  id: string;
  applicationId: string;
  recommendation: AIRecommendation;
  confidence: number;
  score: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  evidence: string[];
  provider: string;
  model: string;
  createdAt: string;
}