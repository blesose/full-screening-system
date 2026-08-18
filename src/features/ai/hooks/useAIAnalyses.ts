import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAIAnalysis,
  getAIAnalysesByApplication,
} from "../aiAnalysesApi";
import type { AIScreeningRecord } from "../../../types/ai";

export function useLatestAIAnalysis(applicationId?: string) {
  return useQuery({
    queryKey: ["aiAnalyses", applicationId],
    queryFn: async () => {
      const records = await getAIAnalysesByApplication(applicationId!);

      if (records.length === 0) {
        return null;
      }

      return records.reduce((latest, record) =>
        new Date(record.createdAt) > new Date(latest.createdAt)
          ? record
          : latest,
      );
    },
    enabled: Boolean(applicationId),
  });
}

export function useSaveAIAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AIScreeningRecord) => createAIAnalysis(data),
    onSuccess: (savedRecord) => {
      queryClient.invalidateQueries({
        queryKey: ["aiAnalyses", savedRecord.applicationId],
      });
    },
  });
}