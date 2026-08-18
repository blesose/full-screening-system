import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  LoaderCircle,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useApplications } from "../features/applications/hooks/useApplications";
import { useReviews } from "../features/reviews/hooks/useReviews";
import {
  useCreateDecision,
  useDecisions,
} from "../features/decisions/hooks/useDecisions";
import { useRubric } from "../features/rubrics/hooks/useRubric";
import { useLogAuditEvent } from "../features/audit/hooks/useActivity";
type DecisionFilter =
  | "ALL"
  | "READY"
  | "SHORTLISTED"
  | "REJECTED"
  | "REVIEW";

const decisionFilterLabels: Record<DecisionFilter, string> = {
  ALL: "All applications",
  READY: "Ready for decision",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  REVIEW: "Needs review",
};

function ShortlistPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<DecisionFilter>("ALL");

  const {
    data: applications = [],
    isLoading: applicationsLoading,
    isError: applicationsError,
  } = useApplications();

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useReviews();

  const {
    data: decisions = [],
    isLoading: decisionsLoading,
    isError: decisionsError,
  } = useDecisions();

  const {
    data: rubric,
    isLoading: rubricLoading,
    isError: rubricError,
  } = useRubric();

  const createDecisionMutation = useCreateDecision();
  const logAuditEvent = useLogAuditEvent();

  const isLoading =
    applicationsLoading ||
    reviewsLoading ||
    decisionsLoading ||
    rubricLoading;

  const isError =
    applicationsError ||
    reviewsError ||
    decisionsError ||
    rubricError;

  const reviewMap = useMemo(() => {
    return new Map(
      reviews.map((review) => [review.applicationId, review]),
    );
  }, [reviews]);

  const decisionMap = useMemo(() => {
    return new Map(
      decisions.map((decision) => [
        decision.applicationId,
        decision,
      ]),
    );
  }, [decisions]);

  const getRecommendation = useCallback(
    (applicationId: string) => {
      const review = reviewMap.get(applicationId);
      const decision = decisionMap.get(applicationId);

      if (decision) {
        return decision.decision;
      }

      if (!review || review.status !== "COMPLETE") {
        return "MANUAL_REVIEW";
      }

      if (review.totalScore === null) {
        return "MANUAL_REVIEW";
      }

      if (
        review.totalScore >= rubric!.shortlistThreshold
      ) {
        return "SHORTLIST";
      }

      if (
        review.totalScore <= rubric!.rejectThreshold
      ) {
        return "REJECT";
      }

      return "MANUAL_REVIEW";
    },
    [reviewMap, decisionMap, rubric],
  );

  const readyForDecisionCount = applications.filter(
    (application) => {
      const review = reviewMap.get(application.id);
      const decision = decisionMap.get(application.id);

      return (
        review?.status === "COMPLETE" &&
        review.totalScore !== null &&
        !decision
      );
    },
  ).length;

  const shortlistedCount = decisions.filter(
    (decision) => decision.decision === "SHORTLISTED",
  ).length;

  const rejectedCount = decisions.filter(
    (decision) => decision.decision === "REJECTED",
  ).length;

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return applications.filter((application) => {
      const review = reviewMap.get(application.id);
      const decision = decisionMap.get(application.id);

      const matchesSearch =
        !normalizedSearch ||
        [
          application.id,
          application.applicantId,
          application.program,
          application.programCode,
          application.intake,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      switch (filter) {
        case "READY":
          return (
            review?.status === "COMPLETE" &&
            review.totalScore !== null &&
            !decision
          );

        case "SHORTLISTED":
          return decision?.decision === "SHORTLISTED";

        case "REJECTED":
          return decision?.decision === "REJECTED";

        case "REVIEW":
          return (
            !decision &&
            (!review || review.status !== "COMPLETE")
          );

        case "ALL":
        default:
          return true;
      }
    });
  }, [
    applications,
    reviewMap,
    decisionMap,
    search,
    filter,
  ]);

  const handleDecision = (
    applicationId: string,
    decision: "SHORTLISTED" | "REJECTED",
  ) => {
    const review = reviewMap.get(applicationId);

    if (!review || review.status !== "COMPLETE") {
      toast.error(
        "Complete the application review before making a decision.",
      );
      return;
    }

    if (review.totalScore === null) {
      toast.error(
        "A completed review must have a total score.",
      );
      return;
    }

    const decisionLabel =
      decision === "SHORTLISTED"
        ? "shortlist"
        : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${decisionLabel} ${applicationId}?`,
    );

    if (!confirmed) {
      return;
    }

    const reason =
      decision === "SHORTLISTED"
        ? `Application scored ${review.totalScore}/100 and met the shortlist threshold of ${rubric?.shortlistThreshold ?? 0}.`
        : `Application scored ${review.totalScore}/100 and met the rejection threshold of ${rubric?.rejectThreshold ?? 0}.`;

    createDecisionMutation.mutate(
      {
        applicationId,
        decision,
        decidedBy: review.reviewerId,
        reason,
        decidedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "SHORTLISTED"
              ? "Application shortlisted successfully"
              : "Application rejected successfully",
          );
          logAuditEvent.mutate({
            applicationId,
            actorId: review.reviewerId,
            action: "DECISION_MADE",
            description: `Application was ${decision === "SHORTLISTED" ? "shortlisted" : "rejected"}.`,
            metadata: { decision, score: review.totalScore },
            createdAt: new Date().toISOString(),
        });

        },
        onError: () => {
          toast.error(
            "Failed to save the admission decision.",
          );
        },
      },
    );
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading decision workspace...
        </div>
      </main>
    );
  }

  if (isError || !rubric) {
    return (
      <main className="space-y-6">
        <section>
          <p className="text-sm text-slate-500">
            Admissions Workspace
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
            Decision & Shortlisting
          </h1>
        </section>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load applications, reviews, decisions,
          or the active rubric.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm text-slate-500">
          Admissions Workspace
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
          Decision & Shortlisting
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Review completed applications and make final
          admissions decisions.
        </p>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Applications"
          value={applications.length}
          icon={<FileText size={18} />}
          iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
        />

        <StatCard
          label="Ready for Decision"
          value={readyForDecisionCount}
          icon={<AlertCircle size={18} />}
          iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
        />

        <StatCard
          label="Shortlisted"
          value={shortlistedCount}
          icon={<CheckCircle2 size={18} />}
          iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
        />

        <StatCard
          label="Rejected"
          value={rejectedCount}
          icon={<XCircle size={18} />}
          iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
        />
      </section>

      {/* Active rules */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">
              Active Decision Rules
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recommendations are based on the active rubric.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Shortlist ≥ {rubric.shortlistThreshold}
            </span>

            <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Reject ≤ {rubric.rejectThreshold}
            </span>
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* Search + filter */}
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search applications, applicants, programs..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as DecisionFilter,
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {Object.entries(decisionFilterLabels).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <ListChecks
              size={36}
              className="text-slate-400"
            />

            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              No applications found
            </h2>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Try adjusting your search or decision filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-950">
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Application
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Program
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Recommendation
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => {
                  const review = reviewMap.get(
                    application.id,
                  );

                  const decision = decisionMap.get(
                    application.id,
                  );

                  const recommendation =
                    getRecommendation(application.id);

                  const reviewComplete =
                    review?.status === "COMPLETE" &&
                    review.totalScore !== null;

                  return (
                    <tr
                      key={application.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      {/* Application */}
                      <td className="px-5 py-4">
                        <Link
                          to={`/applicants/${application.id}`}
                          className="font-medium text-indigo-700 hover:underline dark:text-indigo-400"
                        >
                          {application.id}
                        </Link>

                        <p className="mt-1 text-xs text-slate-500">
                          {application.applicantId}
                        </p>
                      </td>

                      {/* Program */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {application.program}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {application.programCode} ·{" "}
                          {application.intake}
                        </p>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {review?.totalScore !== null &&
                          review?.totalScore !== undefined
                            ? `${review.totalScore}/100`
                            : "—"}
                        </span>
                      </td>

                      {/* Recommendation */}
                      <td className="px-5 py-4">
                        {recommendation === "SHORTLIST" ||
                        recommendation === "SHORTLISTED" ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Shortlist
                          </span>
                        ) : recommendation === "REJECT" ||
                          recommendation === "REJECTED" ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            Reject
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Manual review
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {decision?.decision ===
                        "SHORTLISTED" ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Shortlisted
                          </span>
                        ) : decision?.decision ===
                          "REJECTED" ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            Rejected
                          </span>
                        ) : reviewComplete ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            In review
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4">
                        {decision ? (
                          <span className="text-xs text-slate-500">
                            Decision recorded
                          </span>
                        ) : !reviewComplete ? (
                          <Link
                            to={
                              review
                                ? `/reviews/${review.id}`
                                : `/applicants/${application.id}`
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-400"
                          >
                            <Clock3 size={14} />
                            Review incomplete
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={
                                createDecisionMutation.isPending
                              }
                              onClick={() =>
                                handleDecision(
                                  application.id,
                                  "SHORTLISTED",
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              Shortlist
                            </button>

                            <button
                              type="button"
                              disabled={
                                createDecisionMutation.isPending
                              }
                              onClick={() =>
                                handleDecision(
                                  application.id,
                                  "REJECTED",
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClassName,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <div
          className={`rounded-lg p-2 ${iconClassName}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export default ShortlistPage;