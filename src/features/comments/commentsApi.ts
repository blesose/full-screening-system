import api from "../../lib/api";
import type { ReviewComment } from "../../types/comment";

export const getCommentsByApplication = async (
  applicationId: string,
): Promise<ReviewComment[]> => {
  const response = await api.get<ReviewComment[]>(
    `/comments?applicationId=${applicationId}`,
  );
  return response.data;
};

export const createComment = async (
  data: Omit<ReviewComment, "id" | "createdAt" | "updatedAt">,
): Promise<ReviewComment> => {
  const now = new Date().toISOString();

  const response = await api.post<ReviewComment>("/comments", {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return response.data;
};