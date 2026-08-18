import api from "../../lib/api";
import type { SavedView } from "../../types/savedView";

export const getSavedViews = async (): Promise<SavedView[]> => {
  const response = await api.get<SavedView[]>("/savedViews");

  return response.data;
};

export const createSavedView = async (
  data: Omit<SavedView, "id">,
): Promise<SavedView> => {
  const response = await api.post<SavedView>(
    "/savedViews",
    data,
  );

  return response.data;
};

export const deleteSavedView = async (
  id: string,
): Promise<void> => {
  await api.delete(`/savedViews/${id}`);
};