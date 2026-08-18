import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  XCircle,
  FileText,
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";

import { useApplicant } from "../features/applicants/hooks/useApplicants";
import { useReviews } from "../features/reviews/hooks/useReviews";
import { useDecisions } from "../features/decisions/hooks/useDecisions";
import { useApplications } from "../features/applications/hooks/useApplications";

type ApplicationStatus = "NEW" | "IN_REVIEW" | "REVIEW_COMPLETE" | "SHORTLISTED" | "REJECTED";

function ApplicantPortal() {
  const { applicantId } = useParams<{ applicantId: string }>();

  const {
    data: applicant,
    isLoading: applicantLoading,
    isError: applicantError,
  } = useApplicant(applicantId);

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

  const isLoading =
    applicantLoading ||
    applicationsLoading ||
    reviewsLoading ||
    decisionsLoading;

  const isError =
    applicantError ||
    applicationsError ||
    reviewsError ||
    decisionsError;

  // Find the application for this applicant
  const application = applications.find(
    (app) => app.applicantId === applicantId
  );

  // Find the review for this application
  const review = reviews.find(
    (r) => r.applicationId === application?.id
  );

  // Find the decision for this application
  const decision = decisions.find(
    (d) => d.applicationId === application?.id
  );

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading your application...
        </div>
      </main>
    );
  }

  if (isError || !applicant || !application) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
          <h1 className="mt-4 text-lg font-semibold text-red-900 dark:text-red-200">
            Application Not Found
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            We couldn't find your application. Please check your applicant ID and try again.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft size={16} />
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  // Determine status
  let status: ApplicationStatus = application.status as ApplicationStatus;
  if (decision?.decision === "SHORTLISTED") {
    status = "SHORTLISTED";
  } else if (decision?.decision === "REJECTED") {
    status = "REJECTED";
  }

  const statusConfig: Record<ApplicationStatus, {
    icon: typeof CheckCircle2;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
  }> = {
    SHORTLISTED: {
      icon: CheckCircle2,
      label: "Shortlisted",
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      description: "Congratulations! You've been shortlisted. Our team will contact you with next steps.",
    },
    REJECTED: {
      icon: XCircle,
      label: "Rejected",
      color: "text-red-700 dark:text-red-300",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      borderColor: "border-red-200 dark:border-red-800",
      description: "Thank you for your interest. We encourage you to apply again in future cycles.",
    },
    REVIEW_COMPLETE: {
      icon: FileCheck2,
      label: "Review Complete",
      color: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      description: "Your application has been reviewed. A decision will be made soon.",
    },
    IN_REVIEW: {
      icon: Clock3,
      label: "In Review",
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200 dark:border-amber-800",
      description: "Your application is currently being reviewed. We'll update you once the review is complete.",
    },
    NEW: {
      icon: FileText,
      label: "Submitted",
      color: "text-slate-700 dark:text-slate-300",
      bgColor: "bg-slate-50 dark:bg-slate-800/50",
      borderColor: "border-slate-200 dark:border-slate-700",
      description: "Your application has been submitted and is awaiting review.",
    },
  };

  const config = statusConfig[status] || statusConfig.NEW;
  const StatusIcon = config.icon;

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white transition"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      {/* Welcome Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-950 dark:text-white">
              Welcome, {applicant.firstName} {applicant.lastName}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {applicant.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-950/40">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              ID: {applicant.id}
            </span>
          </div>
        </div>
      </div>

      {/* Application Status Card */}
      <div className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-4 sm:p-6 shadow-sm`}>
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${config.bgColor}`}>
            <StatusIcon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Application Status
              </h2>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {config.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Program: {application.program} ({application.programCode})</span>
              <span>•</span>
              <span>Submitted: {new Date(application.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Applicant Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base sm:text-lg font-semibold text-slate-950 dark:text-white">
          Applicant Information
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm text-slate-900 dark:text-white">{applicant.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm text-slate-900 dark:text-white">{applicant.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Location</p>
              <p className="text-sm text-slate-900 dark:text-white">{applicant.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Program</p>
              <p className="text-sm text-slate-900 dark:text-white">{application.program}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scores Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base sm:text-lg font-semibold text-slate-950 dark:text-white">
          Your Scores
        </h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800">
            <p className="text-xs text-slate-500">GPA</p>
            <p className="mt-1 text-xl sm:text-2xl font-semibold text-slate-950 dark:text-white">
              {application.gpa.toFixed(2)}
              <span className="text-sm font-normal text-slate-400"> / {application.gpaScale}</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800">
            <p className="text-xs text-slate-500">Test Score</p>
            <p className="mt-1 text-xl sm:text-2xl font-semibold text-slate-950 dark:text-white">
              {application.testScore}
              <span className="text-sm font-normal text-slate-400"> / 100</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-800">
            <p className="text-xs text-slate-500">Review Score</p>
            <p className="mt-1 text-xl sm:text-2xl font-semibold text-slate-950 dark:text-white">
              {review?.totalScore !== null && review?.totalScore !== undefined
                ? `${review.totalScore}`
                : "—"}
              <span className="text-sm font-normal text-slate-400">
                {review?.totalScore !== null && review?.totalScore !== undefined ? " / 100" : ""}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Reviewer Feedback */}
      {review?.reviewerComment && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base sm:text-lg font-semibold text-slate-950 dark:text-white">
            Reviewer Feedback
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {review.reviewerComment}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Reviewed on {new Date(review.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Decision Information */}
      {decision && (
        <div className={`rounded-2xl border p-4 sm:p-6 shadow-sm ${
          decision.decision === "SHORTLISTED"
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
        }`}>
          <div className="flex items-start gap-3">
            {decision.decision === "SHORTLISTED" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-950 dark:text-white">
                Decision Information
              </h2>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {decision.reason}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Decided on {new Date(decision.decidedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Application Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base sm:text-lg font-semibold text-slate-950 dark:text-white">
          Application Timeline
        </h2>
        <div className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5"></div>
              {status !== "NEW" && (
                <div className="absolute top-3 left-0.5 h-full w-px bg-slate-200 dark:bg-slate-700"></div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Application Submitted</p>
              <p className="text-xs text-slate-500">
                {new Date(application.submittedAt).toLocaleDateString()} at{" "}
                {new Date(application.submittedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {(status === "IN_REVIEW" || status === "REVIEW_COMPLETE" || status === "SHORTLISTED" || status === "REJECTED") && (
            <div className="flex gap-3">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5"></div>
                {(status === "REVIEW_COMPLETE" || status === "SHORTLISTED" || status === "REJECTED") && (
                  <div className="absolute top-3 left-0.5 h-full w-px bg-slate-200 dark:bg-slate-700"></div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Application In Review</p>
                <p className="text-xs text-slate-500">Reviewer is assessing your application</p>
              </div>
            </div>
          )}

          {(status === "REVIEW_COMPLETE" || status === "SHORTLISTED" || status === "REJECTED") && (
            <div className="flex gap-3">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5"></div>
                {(status === "SHORTLISTED" || status === "REJECTED") && (
                  <div className="absolute top-3 left-0.5 h-full w-px bg-slate-200 dark:bg-slate-700"></div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Review Completed</p>
                <p className="text-xs text-slate-500">
                  {review?.completedAt
                    ? new Date(review.completedAt).toLocaleDateString()
                    : "Review completed"}
                </p>
              </div>
            </div>
          )}

          {(status === "SHORTLISTED" || status === "REJECTED") && (
            <div className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5"></div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {status === "SHORTLISTED" ? "Shortlisted" : "Rejected"}
                </p>
                <p className="text-xs text-slate-500">
                  {decision?.decidedAt
                    ? new Date(decision.decidedAt).toLocaleDateString()
                    : "Decision made"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-6 dark:from-indigo-950/30 dark:to-blue-950/30 dark:border-slate-800">
        <h2 className="text-base sm:text-lg font-semibold text-slate-950 dark:text-white">
          Next Steps
        </h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          {status === "SHORTLISTED" && (
            "Our team will contact you within 5-7 business days with further instructions about the next phase of the admissions process."
          )}
          {status === "REJECTED" && (
            "We appreciate your interest. We encourage you to continue building your skills and reapply in future admission cycles. Check our website for upcoming opportunities."
          )}
          {status === "REVIEW_COMPLETE" && (
            "Your application is now in the final review stage. You will receive a decision notification via email within 2-3 weeks."
          )}
          {status === "IN_REVIEW" && (
            "Your application is being carefully reviewed. This process typically takes 2-3 weeks. You'll receive an email notification when your status changes."
          )}
          {status === "NEW" && (
            "Your application has been received and is awaiting review. You'll be notified when review begins."
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Copy Application Link
          </button>
          <a
            href={`mailto:support@example.com`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}

export default ApplicantPortal;