import { useQuery } from "@tanstack/react-query";
import { getApplicantById, getApplicants } from "../applicantsApi";

export const useApplicants = () => {
    return useQuery({
        queryKey: ["applicants"],
        queryFn: getApplicants,
    });
};

export function useApplicant(id?: string) {
  return useQuery({
    queryKey: ["applicants", id],
    queryFn: () => getApplicantById(id!),
    enabled: Boolean(id),
  });
}