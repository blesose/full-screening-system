import api from "../../lib/api";
import type { Decision } from "../../types/decision";

export const getDecisions = async (): Promise<Decision[]> => {
  const response = await api.get<Decision[]>("/decisions");

  return response.data;
};

export const getDecisionById = async (
  id: string,
): Promise<Decision> => {
  const response = await api.get<Decision>(`/decisions/${id}`);

  return response.data;
};

export const createDecision = async (
  data: Omit<Decision, "id">,
): Promise<Decision> => {
  const response = await api.post<Decision>(
    "/decisions",
    data,
  );

  return response.data;
};

export const updateDecision = async (
  id: string,
  data: Partial<Decision>,
): Promise<Decision> => {
  const response = await api.patch<Decision>(
    `/decisions/${id}`,
    data,
  );

  return response.data;
};