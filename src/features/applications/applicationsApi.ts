import api from "../../lib/api";
import type { Application } from "../../types/application";

export const getApplications = async (): Promise<Application[]> => {
  const response = await api.get<Application[]>("/applications");

  return response.data;
};

export const getApplicationById = async (
  id: string,
): Promise<Application> => {
  const response = await api.get<Application>(`/applications/${id}`);

  return response.data;
};