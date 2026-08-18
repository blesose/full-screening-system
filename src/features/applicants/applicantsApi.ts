import api from "../../lib/api";
import type { Applicant } from "../../types/applicant";

export const getApplicants = async (): Promise<Applicant[]> => {
    const response = await api.get<Applicant[]>("/applicants");
    return response.data;
}

export const getApplicantById = async (
    id: string
) : Promise<Applicant> => {
    const response = await api.get<Applicant>(`/applicants/${id}`)
    return response.data;
}