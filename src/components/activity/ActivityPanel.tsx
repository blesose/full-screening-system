import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  MessageSquare,
  PlayCircle,
  Send,
  ShieldCheck,
} from "lucide-react";

import {
  useAuditTrail,
  useComments,
  useCreateComment,
} from "../../features/audit/hooks/useActivity";

interface ActivityPanelProps {
  applicationId: string;
  reviewerId: string;
}

const actionIcons: Record<string, typeof ClipboardCheck> = {
  REVIEW_STARTED: PlayCircle,
  REVIEW_COMPLETED: ClipboardCheck,
  DECISION_MADE: ShieldCheck,
};

function ActivityPanel({ applicationId, reviewerId }: ActivityPanelProps) {
  const [commentText, setCommentText] = useState("");

  const { data: auditEvents = [], isLoading: auditLoading } =
    useAuditTrail(applicationId);

  const { data: comments = [], isLoading: commentsLoading } =
    useComments(applicationId);

  const createCommentMutation = useCreateComment();

  const timeline = useMemo(() => {
    const auditItems = auditEvents.map((event) => ({
      type: "audit" as const,
      id: event.id,
      timestamp: event.createdAt,
      event,
    }));

    const commentItems = comments.map((comment) => ({
      type: "comment" as const,
      id: comment.id,
      timestamp: comment.createdAt,
      comment,
    }));

    return [...auditItems, ...commentItems].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [auditEvents, comments]);

  const handleAddComment = () => {
    const trimmed = commentText.trim();

    if (!trimmed) {
      return;
    }

    createCommentMutation.mutate(
      {
        applicationId,
        reviewerId,
        text: trimmed,
      },
      {
        onSuccess: () => setCommentText(""),
      },
    );
  };

  const isLoading = auditLoading || commentsLoading;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">
          Activity & Comments
        </h2>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleAddComment();
            }
          }}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <button
          type="button"
          onClick={handleAddComment}
          disabled={createCommentMutation.isPending || !commentText.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading activity...</p>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-slate-500">
            No activity yet for this application.
          </p>
        ) : (
          timeline.map((item) => {
            if (item.type === "comment") {
              return (
                <div
                  key={item.id}
                  className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      {item.comment.reviewerId}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                    {item.comment.text}
                  </p>
                </div>
              );
            }

            const Icon = actionIcons[item.event.action] ?? ClipboardCheck;

            return (
              <div key={item.id} className="flex gap-3 px-1">
                <div className="mt-0.5 shrink-0 text-indigo-500">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {item.event.description}
                  </p>
                  <span className="text-xs text-slate-400">
                    {item.event.actorId} ·{" "}
                    {new Date(item.event.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default ActivityPanel;