import type { ApplicationStatus } from "./application";

export type SavedViewSortField =
  | "score"
  | "submittedAt"
  | "gpa"
  | "testScore";

export type SortDirection = "asc" | "desc";

export interface SavedViewFilters {
  status: ApplicationStatus | "ALL";
  program: string;
  minScore: number | null;
  maxScore: number | null;
  search: string;
}

export interface SavedViewSort {
  field: SavedViewSortField;
  direction: SortDirection;
}

export interface SavedView {
  id: string;
  name: string;
  filters: SavedViewFilters;
  sort: SavedViewSort;
  createdBy: string;
  createdAt: string;
}