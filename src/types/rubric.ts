export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  required: boolean;
}

export interface Rubric {
  id: string;
  name: string;
  version: number;
  active: boolean;
  criteria: RubricCriterion[];
  shortlistThreshold: number;
  rejectThreshold: number;
}