import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createReview,
  getReviewById,
  getReviews,
  updateReview,
} from "../reviewsApi";

import type { Review } from "../../../types/review";

export const useReviews = () => {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: getReviews,
  });
};

export const useReview = (id: string | undefined) => {
  return useQuery({
    queryKey: ["review", id],
    queryFn: () => getReviewById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Review, "id">) =>
      createReview(data),

    onSuccess: (createdReview) => {
      queryClient.setQueryData(
        ["review", createdReview.id],
        createdReview,
      );

      queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Review>;
    }) => updateReview(id, data),

    onSuccess: (updatedReview) => {
      queryClient.setQueryData(
        ["review", updatedReview.id],
        updatedReview,
      );

      queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });
    },
  });
};