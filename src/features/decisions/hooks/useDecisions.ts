import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createDecision,
  getDecisionById,
  getDecisions,
  updateDecision,
} from "../decisionsApi";

export const useDecisions = () => {
  return useQuery({
    queryKey: ["decisions"],
    queryFn: getDecisions,
  });
};

export const useDecision = (id: string | undefined) => {
  return useQuery({
    queryKey: ["decision", id],
    queryFn: () => getDecisionById(id!),
    enabled: Boolean(id),
  });
};

export const useCreateDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["decisions"],
      });
    },
  });
};

export const useUpdateDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateDecision>[1];
    }) => updateDecision(id, data),

    onSuccess: (decision) => {
      queryClient.invalidateQueries({
        queryKey: ["decisions"],
      });

      queryClient.invalidateQueries({
        queryKey: ["decision", decision.id],
      });
    },
  });
};