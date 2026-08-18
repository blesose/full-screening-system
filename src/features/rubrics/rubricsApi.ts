import api from "../../lib/api";
import type { Rubric } from "../../types/rubric";

export const getRubrics = async (): Promise<Rubric[]> => {
  const response = await api.get<Rubric[]>("/rubrics");

  return response.data;
};

export const getActiveRubric = async (): Promise<Rubric> => {
  const response = await api.get<Rubric[]>("/rubrics?active=true");

  return response.data[0];
};