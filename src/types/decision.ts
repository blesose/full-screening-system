export type DecisionStatus =
  | "SHORTLISTED"
  | "REJECTED";

export interface Decision {
  id: string;
  applicationId: string;
  decision: DecisionStatus;
  decidedBy: string;
  reason: string;
  decidedAt: string;
}