import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Users,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useApplications } from "../features/applications/hooks/useApplications";
import { useDecisions } from "../features/decisions/hooks/useDecisions";
import {
  useCreateReview,
  useReviews,
} from "../features/reviews/hooks/useReviews";
import { PDFExportButton } from "../components/ui/PDFExportButton";

function DashboardPage() {
  const navigate = useNavigate();

  const applicationsQuery = useApplications();
  const reviewsQuery = useReviews();
  const decisionsQuery = useDecisions();

  const createReviewMutation = useCreateReview();

  const isLoading =
    applicationsQuery.isLoading ||
    reviewsQuery.isLoading ||
    decisionsQuery.isLoading;

  const isError =
    applicationsQuery.isError ||
    reviewsQuery.isError ||
    decisionsQuery.isError;

  const handleStartReview = (applicationId: string) => {
    const existingReview = reviewsQuery.data?.find(
      (review) => review.applicationId === applicationId,
    );

    if (existingReview) {
      navigate(`/reviews/${existingReview.id}`);
      return;
    }

    createReviewMutation.mutate(
      {
        applicationId,
        rubricId: "RUBRIC-001",
        reviewerId: "REVWR-001",
        scores: {},
        totalScore: null,
        status: "IN_PROGRESS",
        reviewerComment: "",
        startedAt: new Date().toISOString(),
        completedAt: null,
        updatedAt: new Date().toISOString(),
        version: 1,
      },
      {
        onSuccess: (createdReview) => {
          toast.success("Review started");
          navigate(`/reviews/${createdReview.id}`);
        },
        onError: () => {
          toast.error("Failed to start review");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <main className="p-6">
        <p className="text-sm text-muted-foreground">
          Loading dashboard...
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-danger">
          Failed to load dashboard data.
        </div>
      </main>
    );
  }

  const applications = applicationsQuery.data ?? [];
  const reviews = reviewsQuery.data ?? [];
  const decisions = decisionsQuery.data ?? [];

  const reviewMap = new Map(
    reviews.map((review) => [review.applicationId, review]),
  );

  const decisionMap = new Map(
    decisions.map((decision) => [
      decision.applicationId,
      decision,
    ]),
  );

  // Application Statistics
  const totalApplications = applications.length;
  const newApplications = applications.filter(
    (application) => application.status === "NEW",
  ).length;
  const inReviewApplications = applications.filter(
    (application) => application.status === "IN_REVIEW",
  ).length;

  // Decision Statistics
  const shortlistedApplications = decisions.filter(
    (decision) => decision.decision === "SHORTLISTED",
  ).length;
  const rejectedApplications = decisions.filter(
    (decision) => decision.decision === "REJECTED",
  ).length;

  // Review Statistics
  const completedReviews = reviews.filter(
    (review) => review.status === "COMPLETE",
  ).length;
  const inProgressReviews = reviews.filter(
    (review) => review.status === "IN_PROGRESS",
  ).length;

  const scoredReviews = reviews.filter(
    (review) =>
      review.status === "COMPLETE" &&
      review.totalScore !== null,
  );

  const averageScore =
    scoredReviews.length > 0
      ? Math.round(
          scoredReviews.reduce(
            (total, review) =>
              total + (review.totalScore ?? 0),
            0,
          ) / scoredReviews.length,
        )
      : null;

  const needsAttention = applications.filter(
    (application) => {
      const review = reviewMap.get(application.id);
      const decision = decisionMap.get(application.id);

      if (decision) {
        return false;
      }

      return (
        !review ||
        review.status !== "COMPLETE" ||
        review.totalScore === null
      );
    },
  );

  const readyForDecision = applications.filter(
    (application) => {
      const review = reviewMap.get(application.id);
      const decision = decisionMap.get(application.id);

      return (
        review?.status === "COMPLETE" &&
        review.totalScore !== null &&
        !decision
      );
    },
  );

  const recentApplications = [...applications]
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime(),
    )
    .slice(0, 5);

  // Prepare data for PDF export
  const getExportData = () => {
    const recentData = recentApplications.map(app => {
      const review = reviewMap.get(app.id);
      const decision = decisionMap.get(app.id);
      return {
        'Application ID': app.id,
        'Program': app.program,
        'Score': review?.status === 'COMPLETE' && review.totalScore !== null 
          ? `${review.totalScore}/100` 
          : 'N/A',
        'Review Status': review?.status === 'COMPLETE' ? 'Complete' : 
                          review ? 'In Progress' : 'Not Started',
        'Decision': decision?.decision === 'SHORTLISTED' ? 'Shortlisted' :
                    decision?.decision === 'REJECTED' ? 'Rejected' : 'Pending',
        'Submitted': new Date(app.submittedAt).toLocaleDateString(),
      };
    });

    return [
      {
        'Metric': 'Total Applications',
        'Value': totalApplications.toString(),
      },
      {
        'Metric': 'New Applications',
        'Value': newApplications.toString(),
      },
      {
        'Metric': 'In Review',
        'Value': inReviewApplications.toString(),
      },
      {
        'Metric': 'Shortlisted',
        'Value': shortlistedApplications.toString(),
      },
      {
        'Metric': 'Rejected',
        'Value': rejectedApplications.toString(),
      },
      {
        'Metric': 'Completed Reviews',
        'Value': completedReviews.toString(),
      },
      {
        'Metric': 'Ready for Decision',
        'Value': readyForDecision.length.toString(),
      },
      ...recentData,
    ];
  };

  const exportColumns = [
    { header: 'Metric / Application', accessor: 'Metric' },
    { header: 'Value / Status', accessor: 'Value' },
  ];

  return (
    <main className="space-y-6 p-4 sm:p-6">
      {/* Header with PDF Export */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monitor applicant screening activity, review progress,
            and admissions decisions.
          </p>
        </div>
        <PDFExportButton
          data={getExportData()}
          columns={exportColumns}
          filename={`dashboard_${new Date().toISOString().split('T')[0]}`}
          label="Export Report"
          variant="purple"
        />
      </section>

      {/* Main statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Total Applications"
          value={totalApplications}
          icon={Users}
        />
        <DashboardMetric
          label="New"
          value={newApplications}
          icon={FileCheck2}
        />
        <DashboardMetric
          label="In Review"
          value={inReviewApplications}
          icon={Clock3}
        />
        <DashboardMetric
          label="Shortlisted"
          value={shortlistedApplications}
          icon={CheckCircle2}
        />
      </section>

      {/* Secondary statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric
          label="Completed Reviews"
          value={completedReviews}
          icon={FileCheck2}
        />
        <DashboardMetric
          label="Ready for Decision"
          value={readyForDecision.length}
          icon={Clock3}
        />
        <DashboardMetric
          label="Rejected"
          value={rejectedApplications}
          icon={XCircle}
        />
        <DashboardMetric
          label="Needs Attention"
          value={needsAttention.length}
          icon={AlertTriangle}
        />
      </section>

      {/* Review + Decision overview */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Review Progress */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Review Progress
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current reviewer activity across the application pool.
              </p>
            </div>
            <FileCheck2
              size={20}
              className="text-primary"
              strokeWidth={1.8}
            />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                Completed Reviews
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {completedReviews}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                In Progress
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {inProgressReviews}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Average completed-review score
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {averageScore !== null
                ? `${averageScore}/100`
                : "—"}
            </p>
          </div>
        </div>

        {/* Decision Overview */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">
                Decision Overview
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Applications that have completed review and reached a decision stage.
              </p>
            </div>
            <CheckCircle2
              size={20}
              className="text-primary"
              strokeWidth={1.8}
            />
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
              <span className="text-sm text-muted-foreground">
                Ready for decision
              </span>
              <span className="font-semibold text-foreground">
                {readyForDecision.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                Shortlisted
              </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                {shortlistedApplications}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
              <span className="text-sm text-red-700 dark:text-red-300">
                Rejected
              </span>
              <span className="font-semibold text-red-700 dark:text-red-300">
                {rejectedApplications}
              </span>
            </div>
          </div>
          <Link
            to="/shortlist"
            className="mt-5 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Open decision workspace →
          </Link>
        </div>
      </section>

      {/* Needs Attention */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Needs Attention
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Applications that still need review before a final decision can be made.
            </p>
          </div>
          <AlertTriangle
            size={20}
            className="text-warning"
            strokeWidth={1.8}
          />
        </div>
        <div className="mt-6">
          {needsAttention.length > 0 ? (
            <div className="space-y-3">
              {needsAttention.slice(0, 5).map((application) => {
                const review = reviewMap.get(application.id);
                return (
                  <div
                    key={application.id}
                    className="flex items-center justify-between gap-4 rounded-lg bg-muted p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {application.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {application.program}
                      </p>
                    </div>
                    {review ? (
                      <Link
                        to={`/reviews/${review.id}`}
                        className="text-xs font-medium text-warning hover:underline"
                      >
                        Continue review
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleStartReview(application.id)
                        }
                        disabled={
                          createReviewMutation.isPending
                        }
                        className="text-xs font-medium text-warning hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {createReviewMutation.isPending
                          ? "Starting..."
                          : "Start review"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-success/10 p-4 text-sm text-success">
              No applications currently need attention.
            </div>
          )}
        </div>
      </section>

      {/* Recent Applications */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">
              Recent Applications
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Most recently submitted applications.
            </p>
          </div>
          <Link
            to="/applicants"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all applicants →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Application
                </th>
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Program
                </th>
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Score
                </th>
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Review
                </th>
                <th className="px-5 py-3 font-medium text-muted-foreground">
                  Decision
                </th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((application) => {
                const review = reviewMap.get(application.id);
                const decision = decisionMap.get(application.id);
                const score =
                  review?.status === "COMPLETE" &&
                  review.totalScore !== null
                    ? `${review.totalScore}/100`
                    : "—";

                return (
                  <tr
                    key={application.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={`/applicants/${application.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {application.id}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {application.applicantId}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {application.program}
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">
                      {score}
                    </td>
                    <td className="px-5 py-4">
                      {review?.status === "COMPLETE" ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          Complete
                        </span>
                      ) : review ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                          In progress
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          Not started
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {decision?.decision === "SHORTLISTED" ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          Shortlisted
                        </span>
                      ) : decision?.decision === "REJECTED" ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                          Rejected
                        </span>
                      ) : review?.status === "COMPLETE" ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                          Ready
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

interface DashboardMetricProps {
  label: string;
  value: number;
  icon: typeof Users;
}

function DashboardMetric({
  label,
  value,
  icon: Icon,
}: DashboardMetricProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {label}
        </p>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon size={18} strokeWidth={1.8} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

export default DashboardPage;