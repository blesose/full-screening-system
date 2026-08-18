import type { Application } from "../../types/application";

export interface ApplicationListItem {
  application: Application;

  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantLocation: string;

  reviewScore: number | null;
  
}