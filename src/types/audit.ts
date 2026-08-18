export interface AuditEvent {
    id: string;
    applicationId: string;
    actorId: string;
    action: string;
    description: string;
    metadata: Record<string, unknown>;
    createdAt: string;
}

