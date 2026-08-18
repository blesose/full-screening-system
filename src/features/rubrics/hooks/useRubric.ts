import { useQuery } from "@tanstack/react-query";
import { getActiveRubric } from "../rubricsApi";

export const useRubric = () => {
  return useQuery({
    queryKey: ["rubric", "active"],
    queryFn: getActiveRubric,
  });
};