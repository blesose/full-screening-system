import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Clock3,
  Search,
  CheckCircle2,
  FileSearch,
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
      <main className="space-y-6">
        <section>
          <p className="text-sm text-slate-500">
            Admissions Workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
            Reviews
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Loading reviewer activity...
          </p>
        </section>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="space-y-6">
        <section>
          <p className="text-sm text-slate-500">
            Admissions Workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
            Reviews
          </h1>
        </section>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load reviews or applications.
          Please check that the API server is running.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Page header */}
      <section>
        <p className="text-sm text-slate-500">
          Admissions Workspace
        </p>

        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">
              Reviews
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Review applicant submissions, score applications,
              and track reviewer progress.
            </p>
          </div>
        </div>
      </section>

      {/* Review statistics */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Total Reviews
            </p>

            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <ClipboardCheck size={18} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
            {reviews.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              In Progress
            </p>

            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock3 size={18} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Average Completed Score
            </p>

            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>

          <p className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">
            {averageScore !== null
              ? `${averageScore.toFixed(1)}/100`
              : "—"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {completedCount} completed review
            {completedCount === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      {/* Reviews table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                placeholder="Search reviews, applications, programs..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as ReviewFilter,
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {Object.entries(reviewStatusLabels).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <FileSearch
              size={36}
              className="text-slate-400"
            />

            <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              No reviews found
            </h2>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Try adjusting your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-950">
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Application
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Program
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Reviewer
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Updated
                  </th>

                    <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Action
                    </th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.map((review) => {
                  const application = applicationMap.get(
                    review.applicationId,
                  );

                  return (
                    <tr
                    key={review.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                    {/* Application */}
                    <td className="px-5 py-4">
                        <Link
                        to={`/applicants/${review.applicationId}`}
                        className="font-medium text-indigo-700 hover:underline dark:text-indigo-400"
                        >
                        {review.applicationId}
                        </Link>
                    </td>

                    {/* Program */}
                    <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {application?.program ?? "Unknown program"}
                        </p>

                        {application?.programCode && (
                        <p className="mt-1 text-xs text-slate-500">
                            {application.programCode}
                        </p>
                        )}
                    </td>

                    {/* Reviewer */}
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {review.reviewerId}
                    </td>

                    {/* Score */}
                    <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {review.totalScore !== null
                            ? `${review.totalScore}/100`
                            : "—"}
                        </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                        <Link
                        to={`/reviews/${review.id}`}
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium transition hover:opacity-80 ${
                            review.status === "COMPLETE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                        >
                        {review.status === "COMPLETE"
                            ? "Completed"
                            : "In progress"}
                        </Link>
                    </td>

                    {/* Updated */}
                    <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(review.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                        <Link
                        to={`/reviews/${review.id}`}
                        className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60"
                        >
                        Open Review
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