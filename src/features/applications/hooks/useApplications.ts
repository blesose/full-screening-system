import { useQuery } from "@tanstack/react-query";
import { getApplications } from "../applicationsApi";

export const useApplications = () => {
  return useQuery({
    queryKey: ["applications"],
    queryFn: getApplications,
  });
};

