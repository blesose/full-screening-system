import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createSavedView,
  deleteSavedView,
  getSavedViews,
} from "../savedViewsApi";

import type { SavedView } from "../../../types/savedView";

export const useSavedViews = () => {
  return useQuery({
    queryKey: ["savedViews"],
    queryFn: getSavedViews,
  });
};

export const useCreateSavedView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<SavedView, "id">) =>
      createSavedView(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["savedViews"],
      });
    },
  });
};

export const useDeleteSavedView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSavedView(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["savedViews"],
      });
    },
  });
};