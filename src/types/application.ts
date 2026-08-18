export type ApplicationStatus =
  | "NEW"
  | "IN_REVIEW"
  | "REVIEW_COMPLETE"
  | "SHORTLISTED"
  | "REJECTED";

export type RecommendationStatus = "received" | "pending";

export interface Application {
  id: string;
  applicantId: string;
  program: string;
  programCode: string;
  intake: string;
  gpa: number;
  gpaScale: number;
  testScore: number;
  essay: string;
  activities: string[];
  achievements: string[];
  recommendationStatus: RecommendationStatus;
  status: ApplicationStatus;
  submittedAt: string;
}