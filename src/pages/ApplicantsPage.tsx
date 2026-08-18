import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { useApplicants } from "../features/applicants/hooks/useApplicants";
import { useApplications } from "../features/applications/hooks/useApplications";
import { useReviews } from "../features/reviews/hooks/useReviews";

import type { ApplicationStatus } from "../types/application";

const statusLabels: Record<ApplicationStatus, string> = {
  NEW: "New",
  IN_REVIEW: "In Review",
  REVIEW_COMPLETE: "Review Complete",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
};

function ApplicantsPage() {
  const {
    data: reviews,
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useReviews();

  const {
    data: applicants,
    isLoading: applicantsLoading,
    isError: applicantsError,
  } = useApplicants();

  const {
    data: applications,
    isLoading: applicationsLoading,
    isError: applicationsError,
  } = useApplications();

  const [searchParams] = useSearchParams();

  const initialStatus =
    (searchParams.get("status") as ApplicationStatus | null) ?? "ALL";

  const initialSearch = searchParams.get("search") ?? "";

  const initialProgram = searchParams.get("program") ?? "ALL";

  const initialMinScore = searchParams.get("minScore");

  const initialMaxScore = searchParams.get("maxScore");

  const initialSortField =
    searchParams.get("sort") ?? "submittedAt";

  const initialSortDirection =
    searchParams.get("direction") === "asc"
      ? "asc"
      : "desc";

  const [search, setSearch] = useState(initialSearch);

  const [statusFilter, setStatusFilter] = useState<
    ApplicationStatus | "ALL"
  >(initialStatus);

  const [programFilter, setProgramFilter] =
    useState(initialProgram);

  const [minScore, setMinScore] = useState<number | null>(
    initialMinScore !== null
      ? Number(initialMinScore)
      : null,
  );

  const [maxScore, setMaxScore] = useState<number | null>(
    initialMaxScore !== null
      ? Number(initialMaxScore)
      : null,
  );

  const [sortField, setSortField] =
    useState(initialSortField);

  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">(initialSortDirection);

  const isLoading =
    applicantsLoading ||
    applicationsLoading ||
    reviewsLoading;

  const isError =
    applicantsError ||
    applicationsError ||
    reviewsError;

  const applicantRows = useMemo(() => {
    if (!applicants || !applications || !reviews) {
      return [];
    }

    const applicantMap = new Map(
      applicants.map((applicant) => [
        applicant.id,
        applicant,
      ]),
    );

    const reviewMap = new Map(
      reviews.map((review) => [
        review.applicationId,
        review,
      ]),
    );

    return applications.map((application) => {
      const applicant = applicantMap.get(
        application.applicantId,
      );

      const review = reviewMap.get(application.id);

      return {
        application,
        applicantName: applicant
          ? `${applicant.firstName} ${applicant.lastName}`
          : "Unknown Applicant",

        applicantEmail:
          applicant?.email ?? "—",

        applicantPhone:
          applicant?.phone ?? "—",

        applicantLocation:
          applicant?.location ?? "—",

        reviewScore:
          review?.status === "COMPLETE"
            ? review.totalScore
            : null,
      };
    });
  }, [applicants, applications, reviews]);

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const filtered = applicantRows.filter((row) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        row.applicantName
          .toLowerCase()
          .includes(normalizedSearch) ||
        row.applicantEmail
          .toLowerCase()
          .includes(normalizedSearch) ||
        row.application.program
          .toLowerCase()
          .includes(normalizedSearch) ||
        row.application.programCode
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        row.application.status === statusFilter;

      const matchesProgram =
        programFilter === "ALL" ||
        row.application.program === programFilter;

      const matchesMinScore =
        minScore === null ||
        (row.reviewScore !== null &&
          row.reviewScore >= minScore);

      const matchesMaxScore =
        maxScore === null ||
        (row.reviewScore !== null &&
          row.reviewScore <= maxScore);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProgram &&
        matchesMinScore &&
        matchesMaxScore
      );
    });

    return [...filtered].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortField === "gpa") {
        aValue = a.application.gpa;
        bValue = b.application.gpa;
      } else if (sortField === "testScore") {
        aValue = a.application.testScore;
        bValue = b.application.testScore;
      } else if (sortField === "score") {
        aValue = a.reviewScore ?? 0;
        bValue = b.reviewScore ?? 0;
      } else {
        aValue = new Date(a.application.submittedAt).getTime();
        bValue = new Date(b.application.submittedAt).getTime();
      }

      if (aValue === bValue) return 0;
      
      return sortDirection === "asc" 
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  }, [
    applicantRows,
    search,
    statusFilter,
    programFilter,
    minScore,
    maxScore,
    sortField,
    sortDirection,
  ]);

  if (isLoading) {
    return (
      <main className="p-6">
        <p className="text-sm text-muted-foreground">
          Loading applicants...
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <h1 className="text-base font-semibold text-red-900 dark:text-red-200">
            Unable to load applicants
          </h1>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            We could not retrieve the applicant and application data.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Admissions Workspace
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Applicants
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage submitted applications.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-surface">
        {/* Filters */}
        <div className="flex flex-col gap-4 border-b border-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search applicants, programs..."
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={minScore ?? ""}
                onChange={(event) =>
                  setMinScore(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                placeholder="Min score"
                className="w-28 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <input
                type="number"
                min="0"
                max="100"
                value={maxScore ?? ""}
                onChange={(event) =>
                  setMaxScore(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                placeholder="Max score"
                className="w-28 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal
              size={17}
              className="text-muted-foreground"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | ApplicationStatus
                    | "ALL",
                )
              }
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">
                All statuses
              </option>

              {Object.entries(statusLabels).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>

            <select
              value={programFilter}
              onChange={(event) =>
                setProgramFilter(event.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">
                All programs
              </option>

              {[
                ...new Set(
                  applicantRows.map(
                    (row) =>
                      row.application.program,
                  ),
                ),
              ].map((program) => (
                <option
                  key={program}
                  value={program}
                >
                  {program}
                </option>
              ))}
            </select>

            <select
              value={sortField}
              onChange={(event) =>
                setSortField(event.target.value)
              }
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="score">
                Review score
              </option>
              <option value="submittedAt">
                Submission date
              </option>
              <option value="gpa">
                GPA
              </option>
              <option value="testScore">
                Test score
              </option>
            </select>

            <select
              value={sortDirection}
              onChange={(event) =>
                setSortDirection(
                  event.target.value as
                    | "asc"
                    | "desc",
                )
              }
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="desc">
                Descending
              </option>
              <option value="asc">
                Ascending
              </option>
            </select>
          </div>
        </div>

        {/* Applicants table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Applicant
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Program
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  GPA
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Test Score
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Review Score
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredRows.map((row) => (
                <tr
                  key={row.application.id}
                  className="transition hover:bg-muted/50"
                >
                  <td className="px-5 py-4">
                    <div>
                      <Link
                        to={`/applicant/${row.application.applicantId}`}
                        className="text-sm font-medium text-foreground hover:text-primary"
                      >
                        {row.applicantName}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.applicantEmail}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm text-foreground">
                      {row.application.program}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.application.programCode}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-foreground">
                    {row.application.gpa.toFixed(2)}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-foreground">
                    {row.application.testScore}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-foreground">
                    {row.reviewScore ?? "—"}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      {statusLabels[
                        row.application.status
                      ]}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center"
                  >
                    <p className="text-sm font-medium text-foreground">
                      No applicants found
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {filteredRows.length} of{" "}
            {applicantRows.length} applications
          </p>
        </div>
      </section>
    </main>
  );
}

export default ApplicantsPage;