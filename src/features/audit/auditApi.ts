import api from "../../lib/api";
import type { AuditEvent } from "../../types/audit";

export const getAuditEventsByApplication = async (
  applicationId: string,
): Promise<AuditEvent[]> => {
  const response = await api.get<AuditEvent[]>(
    `/auditEvents?applicationId=${applicationId}`,
  );
  return response.data;
};

export const createAuditEvent = async (
  data: Omit<AuditEvent, "id">,
): Promise<AuditEvent> => {
  const response = await api.post<AuditEvent>("/auditEvents", data);
  return response.data;
};