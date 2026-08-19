import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Clock3,
  Search,
  CheckCircle2,
  FileSearch,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

import { useReviews } from "../features/reviews/hooks/useReviews";
import { useApplications } from "../features/applications/hooks/useApplications";

type ReviewFilter = "ALL" | "IN_PROGRESS" | "COMPLETE";

const reviewStatusLabels: Record<ReviewFilter, string> = {
  ALL: "All statuses",
  IN_PROGRESS: "In progress",
  COMPLETE: "Completed",
};

function ReviewsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ReviewFilter>("ALL");

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useReviews();

  const {
    data: applications = [],
    isLoading: applicationsLoading,
    isError: applicationsError,
  } = useApplications();

  const isLoading = reviewsLoading || applicationsLoading;
  const isError = reviewsError || applicationsError;

  const applicationMap = useMemo(() => {
    return new Map(
      applications.map((application) => [
        application.id,
        application,
      ]),
    );
  }, [applications]);

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reviews.filter((review) => {
      const application = applicationMap.get(review.applicationId);

      const matchesStatus =
        statusFilter === "ALL" ||
        review.status === statusFilter;

      if (!normalizedSearch) {
        return matchesStatus;
      }

      const searchableText = [
        review.id,
        review.applicationId,
        application?.id,
        application?.program,
        application?.programCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        searchableText.includes(normalizedSearch)
      );
    });
  }, [reviews, applicationMap, search, statusFilter]);

  const inProgressCount = reviews.filter(
    (review) => review.status === "IN_PROGRESS",
  ).length;

  const completedCount = reviews.filter(
    (review) => review.status === "COMPLETE",
  ).length;

  const averageScore = useMemo(() => {
    const completedScores = reviews
      .filter(
        (review) =>
          review.status === "COMPLETE" &&
          review.totalScore !== null,
      )
      .map((review) => review.totalScore as number);

    if (completedScores.length === 0) {
      return null;
    }

    return (
      completedScores.reduce(
        (total, score) => total + score,
        0,
      ) / completedScores.length
    );
  }, [reviews]);

  if (isLoading) {
    return (
      <main className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <section>
          <p className="text-sm text-muted-foreground">
            Admissions Workspace
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-foreground">
            Reviews
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading reviewer activity...
          </p>
        </section>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <section>
          <p className="text-sm text-muted-foreground">
            Admissions Workspace
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-foreground">
            Reviews
          </h1>
        </section>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load reviews or applications.
          Please check that the API server is running.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page header */}
      <section className="space-y-1 sm:space-y-2">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
          Admissions Workspace
        </p>

        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          Reviews
        </h1>

        <p className="text-sm text-muted-foreground">
          Review applicant submissions, score applications,
          and track reviewer progress.
        </p>
      </section>

      {/* Review statistics - Responsive grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total Reviews
            </p>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <p className="mt-2 sm:mt-4 text-2xl sm:text-3xl font-semibold text-foreground">
            {reviews.length}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              In Progress
            </p>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock3 size={18} />
            </div>
          </div>
          <p className="mt-2 sm:mt-4 text-2xl sm:text-3xl font-semibold text-foreground">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Average Completed Score
            </p>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-2 sm:mt-4 text-2xl sm:text-3xl font-semibold text-foreground">
            {averageScore !== null
              ? `${averageScore.toFixed(1)}/100`
              : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {completedCount} completed review
            {completedCount === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      {/* Reviews table */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reviews, applications, programs..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ReviewFilter)
              }
              className="w-full sm:w-auto rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {Object.entries(reviewStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 text-center">
            <FileSearch size={32} className="text-muted-foreground" />
            <h2 className="mt-4 text-base font-semibold text-foreground">
              No reviews found
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Try adjusting your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted text-left">
                  <th className="px-3 sm:px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Application
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Program
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Reviewer
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Score
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Updated
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.map((review) => {
                  const application = applicationMap.get(review.applicationId);
                  const isComplete = review.status === "COMPLETE";

                  return (
                    <tr
                      key={review.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <Link
                          to={`/applicants/${review.applicationId}`}
                          className="font-medium text-primary hover:underline text-sm"
                        >
                          {review.applicationId}
                        </Link>
                      </td>

                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <p className="text-sm font-medium text-foreground">
                          {application?.program ?? "Unknown"}
                        </p>
                        {application?.programCode && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {application.programCode}
                          </p>
                        )}
                      </td>

                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm text-foreground">
                        {review.reviewerId}
                      </td>

                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <span className={`text-sm font-semibold ${
                          review.totalScore !== null && review.totalScore >= 70
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : review.totalScore !== null && review.totalScore >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : review.totalScore !== null
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground'
                        }`}>
                          {review.totalScore !== null
                            ? `${review.totalScore}/100`
                            : "—"}
                        </span>
                      </td>

                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 size={12} />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <Clock3 size={12} className="animate-pulse" />
                            In Progress
                          </span>
                        )}
                      </td>

                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-sm text-muted-foreground">
                        {new Date(review.updatedAt).toLocaleDateString()}
                      </td>

                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <Link
                          to={`/reviews/${review.id}`}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 sm:py-2 text-xs font-medium transition ${
                            isComplete
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {isComplete ? (
                            <>
                              <ArrowRight size={14} />
                              View Review
                            </>
                          ) : (
                            <>
                              <PlayCircle size={14} />
                              Continue
                            </>
                          )}
                        </Link>
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

export default ReviewsPage;