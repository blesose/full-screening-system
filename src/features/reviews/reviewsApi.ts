import api from "../../lib/api";
import type { Review } from "../../types/review";

export const getReviews = async (): Promise<Review[]> => {
  const response = await api.get<Review[]>("/reviews");

  return response.data;
};

export const getReviewById = async (
  id: string,
): Promise<Review> => {
  const response = await api.get<Review>(`/reviews/${id}`);

  return response.data;
};

export const createReview = async (
  data: Omit<Review, "id">,
): Promise<Review> => {
  const response = await api.post<Review>(
    "/reviews",
    data,
  );

  return response.data;
};

export const updateReview = async (
  id: string,
  data: Partial<Review>,
): Promise<Review> => {
  const response = await api.patch<Review>(
    `/reviews/${id}`,
    data,
  );

  return response.data;
};