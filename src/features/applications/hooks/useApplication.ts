import { useQuery } from "@tanstack/react-query";
import { getApplicationById } from "../applicationsApi";

export const useApplication = (id: string | undefined) => {
  return useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplicationById(id!),
    enabled: Boolean(id),
  });
};