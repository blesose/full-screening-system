export type ReviewStatus = "IN_PROGRESS" | "COMPLETE";

export interface ReviewScores {
  [criterionId: string]: number | null;
}

export interface Review {
  id: string;
  applicationId: string;
  rubricId: string;
  reviewerId: string;
  scores: ReviewScores;
  totalScore: number | null;
  status: ReviewStatus;
  reviewerComment: string;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  version: number;
}