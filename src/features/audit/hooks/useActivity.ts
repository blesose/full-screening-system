import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuditEventsByApplication, createAuditEvent } from "../auditApi";
import { getCommentsByApplication, createComment } from "../../comments/commentsApi";
import type { AuditEvent } from "../../../types/audit";

export function useAuditTrail(applicationId?: string) {
  return useQuery({
    queryKey: ["auditEvents", applicationId],
    queryFn: () => getAuditEventsByApplication(applicationId!),
    enabled: Boolean(applicationId),
  });
}

export function useComments(applicationId?: string) {
  return useQuery({
    queryKey: ["comments", applicationId],
    queryFn: () => getCommentsByApplication(applicationId!),
    enabled: Boolean(applicationId),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (savedComment) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", savedComment.applicationId],
      });
    },
  });
}

export function useLogAuditEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<AuditEvent, "id">) => createAuditEvent(data),
    onSuccess: (savedEvent) => {
      queryClient.invalidateQueries({
        queryKey: ["auditEvents", savedEvent.applicationId],
      });
    },
  });
}