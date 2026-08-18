import api from "../../lib/api";
import type { AIScreeningRecord } from "../../types/ai";

export const getAIAnalysesByApplication = async (
  applicationId: string,
): Promise<AIScreeningRecord[]> => {
  const response = await api.get<AIScreeningRecord[]>(
    `/aiAnalyses?applicationId=${applicationId}`,
  );

  return response.data;
};

export const createAIAnalysis = async (
  data: AIScreeningRecord,
): Promise<AIScreeningRecord> => {
  const response = await api.post<AIScreeningRecord>(
    "/aiAnalyses",
    data,
  );

  return response.data;
};