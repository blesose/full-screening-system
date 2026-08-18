import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Save,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useApplication } from "../features/applications/hooks/useApplication";
import { useApplicant } from "../features/applicants/hooks/useApplicants";
import ActivityPanel from "../components/activity/ActivityPanel";
import AIScreeningAssistant from "../components/ai/AIScreeningAssistant";
import { useLogAuditEvent } from "../features/audit/hooks/useActivity";

import {
  useReview,
  useUpdateReview,
} from "../features/reviews/hooks/useReviews";
import {
  useCreateDecision,
} from "../features/decisions/hooks/useDecisions";
import { useRubric } from "../features/rubrics/hooks/useRubric";

type DecisionChoice = "SHORTLISTED" | "REJECTED";

function ReviewWorkspacePage() {
  const { reviewId } = useParams<{ reviewId: string }>();

  const {
    data: review,
    isLoading: isReviewLoading,
    isError: isReviewError,
  } = useReview(reviewId);

  const {
    data: application,
    isLoading: isApplicationLoading,
    isError: isApplicationError,
  } = useApplication(review?.applicationId);

   const {
    data: applicant,
    isLoading: isApplicantLoading,
    isError: isApplicantError,
  } = useApplicant(application?.applicantId);

  const {
    data: rubric,
    isLoading: isRubricLoading,
    isError: isRubricError,
  } = useRubric();

  const isLoading =
    isReviewLoading ||
    isApplicationLoading ||
    isApplicantLoading ||
    isRubricLoading;

  const isError =
    isReviewError ||
    isApplicationError ||
    isApplicantError ||
    isRubricError;

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading review workspace...
        </div>
      </main>
    );
  }

  if (isError || !review || !application || !applicant || !rubric) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to load review
          </h1>

          <p className="mt-2 text-sm text-red-700">
            We couldn't load the review workspace. Please try again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <ReviewWorkspaceContent
      review={review}
      application={application}
      applicant={applicant}
      rubric={rubric}
    />
  );
}

function ReviewWorkspaceContent({
  review,
  application,
  applicant,
  rubric,
}: {
  review: NonNullable<ReturnType<typeof useReview>["data"]>;
  application: NonNullable<
    ReturnType<typeof useApplication>["data"]
  >;
  applicant: NonNullable<ReturnType<typeof useApplicant>["data"]>;
  rubric: NonNullable<ReturnType<typeof useRubric>["data"]>;
}) {
  const navigate = useNavigate();
const logAuditEvent = useLogAuditEvent();
  const updateReviewMutation = useUpdateReview();
  const createDecisionMutation = useCreateDecision();

  const [scores, setScores] = useState<Record<string, number | null>>(
    review.scores ?? {},
  );

  const [reviewerComment, setReviewerComment] = useState(
    review.reviewerComment ?? "",
  );

  const [decision, setDecision] = useState<DecisionChoice | null>(
    null,
  );

  const [decisionReason, setDecisionReason] = useState("");

  const handleScoreChange = (
    criterionId: string,
    value: string,
    maxScore: number,
  ) => {
    if (value === "") {
      setScores((current) => ({
        ...current,
        [criterionId]: null,
      }));

      return;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return;
    }

    const clampedValue = Math.min(
      Math.max(numericValue, 0),
      maxScore,
    );

    setScores((current) => ({
      ...current,
      [criterionId]: clampedValue,
    }));
  };

  const totalScore = rubric.criteria.reduce((total, criterion) => {
    return total + (scores[criterion.id] ?? 0);
  }, 0);

  const completedCriteria = rubric.criteria.filter(
    (criterion) =>
      scores[criterion.id] !== null &&
      scores[criterion.id] !== undefined,
  ).length;

  const canComplete = rubric.criteria
    .filter((criterion) => criterion.required)
    .every(
      (criterion) =>
        scores[criterion.id] !== null &&
        scores[criterion.id] !== undefined,
    );

  const progressPercentage =
    rubric.criteria.length > 0
      ? (completedCriteria / rubric.criteria.length) * 100
      : 0;

  const isReviewComplete = review.status === "COMPLETE";

  const handleSaveDraft = () => {
    updateReviewMutation.mutate(
      {
        id: review.id,
        data: {
          scores,
          reviewerComment,
          totalScore,
          status: "IN_PROGRESS",
          updatedAt: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Review draft saved");
        },
        onError: () => {
          toast.error("Failed to save review draft");
        },
      },
    );
  };

  const handleCompleteReview = () => {
    if (!canComplete) {
      toast.error(
        "Complete all required criteria before submitting",
      );
      return;
    }

    updateReviewMutation.mutate(
      {
        id: review.id,
        data: {
          scores,
          reviewerComment,
          totalScore,
          status: "COMPLETE",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
        toast.success("Review completed successfully");

        logAuditEvent.mutate({
          applicationId: review.applicationId,
          actorId: review.reviewerId,
          action: "REVIEW_COMPLETED",
          description: "Reviewer completed the screening rubric.",
          metadata: { score: totalScore },
          createdAt: new Date().toISOString(),
        });

        window.location.reload();
      },
      onError: () => toast.error("Failed to complete review"),
    },
  );
};

  const handleDecision = () => {
    if (!decision) {
      toast.error("Select a decision");
      return;
    }

    if (!decisionReason.trim()) {
      toast.error("Please provide a reason for this decision");
      return;
    }

    if (!isReviewComplete) {
      toast.error("Complete the review before making a decision");
      return;
    }

    createDecisionMutation.mutate(
      {
        applicationId: review.applicationId,
        decision,
        decidedBy: review.reviewerId,
        reason: decisionReason.trim(),
        decidedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast.success(
            decision === "SHORTLISTED"
              ? "Applicant shortlisted successfully"
              : "Applicant rejected successfully",
          );

          navigate("/reviews");
        },
        onError: () => {
          toast.error("Failed to record decision");
        },
      },
    );
  };

  return (
    <main className="space-y-6 p-6">
      {/* Back navigation */}
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
        onClick={() => navigate("/reviews")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reviews
      </button>

      {/* Page header */}
      <header>
        <p className="text-sm font-medium text-indigo-600">
          Review Workspace
        </p>

        <h1 className="mt-1 text-2xl font-semibold">
          Application Review
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {application.program} · {application.intake}
        </p>
      </header>

      {/* Review metadata */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">
              Review ID
            </p>

            <p className="mt-1 font-medium">
              {review.id}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Rubric
            </p>

            <p className="mt-1 font-medium">
              {rubric.name}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Review Status
            </p>

            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                isReviewComplete
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isReviewComplete
                ? "Completed"
                : "In progress"}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* LEFT */}
        <section className="space-y-6">
          {/* Applicant information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Applicant
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Application information
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                {application.status.replace("_", " ")}
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">
                  Applicant ID
                </p>

                <p className="mt-1 font-medium">
                  {application.applicantId}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  GPA
                </p>

                <p className="mt-1 font-medium">
                  {application.gpa} / {application.gpaScale}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Assessment Score
                </p>

                <p className="mt-1 font-medium">
                  {application.testScore}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Program
                </p>

                <p className="mt-1 font-medium">
                  {application.program}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Intake
                </p>

                <p className="mt-1 font-medium">
                  {application.intake}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Recommendation
                </p>

                <p className="mt-1 font-medium capitalize">
                  {application.recommendationStatus}
                </p>
              </div>
            </div>
          </div>

          {/* AI Screening Assistant */} 
          <AIScreeningAssistant
          applicationId={application.id}
          application={{
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            program: application.program,
            gpa: application.gpa,
            gpaScale: application.gpaScale,
            testScore: application.testScore,
            essay: application.essay,
            activities: application.activities,
            achievements: application.achievements,
            recommendationStatus: application.recommendationStatus,
          }}
          review={review}
          rubric={rubric}
        />

          {/* Personal statement */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Personal Statement
            </h2>

            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
              {application.essay}
            </p>
          </div>

          {/* Activities */}
          {application.activities.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">
                Activities
              </h2>

              <ul className="mt-4 space-y-2">
                {application.activities.map((activity) => (
                  <li
                    key={activity}
                    className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    {activity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements */}
          {application.achievements.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">
                Achievements
              </h2>

              <ul className="mt-4 space-y-2">
                {application.achievements.map((achievement) => (
                  <li
                    key={achievement}
                    className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rubric */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">
                {rubric.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Score each required criterion before completing
                the review.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {rubric.criteria.map((criterion) => {
                const score = scores[criterion.id];

                return (
                  <div
                    key={criterion.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {criterion.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {criterion.description}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-medium text-slate-500">
                        {criterion.weight}%
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        max={criterion.maxScore}
                        value={score ?? ""}
                        disabled={isReviewComplete}
                        onChange={(event) =>
                          handleScoreChange(
                            criterion.id,
                            event.target.value,
                            criterion.maxScore,
                          )
                        }
                        className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        placeholder="Score"
                      />

                      <span className="text-sm text-slate-500">
                        / {criterion.maxScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside className="space-y-6">
          {/* Review summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Review Summary
            </h2>

            <div className="mt-6">
              <p className="text-sm text-slate-500">
                Current score
              </p>

              <p className="mt-1 text-4xl font-semibold">
                {totalScore}
                <span className="text-lg font-normal text-slate-400">
                  /100
                </span>
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Progress
                </span>

                <span className="font-medium">
                  {completedCriteria} / {rubric.criteria.length}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                {canComplete || isReviewComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <CircleAlert className="h-5 w-5 text-amber-600" />
                )}

                <span className="text-sm font-medium">
                  {isReviewComplete
                    ? "Review completed"
                    : canComplete
                      ? "Ready to complete"
                      : "Review incomplete"}
                </span>
              </div>

              {!canComplete && !isReviewComplete && (
                <p className="mt-2 text-xs text-slate-500">
                  Complete all required criteria before submitting.
                </p>
              )}
            </div>
          </div>

          {/* Reviewer comments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Reviewer Comments
            </h2>

            <textarea
              value={reviewerComment}
              disabled={isReviewComplete}
              onChange={(event) =>
                setReviewerComment(event.target.value)
              }
              rows={6}
              placeholder="Add your review comments..."
              className="mt-4 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
           {/* Activity & Comments */}
          <ActivityPanel
            applicationId={application.id}
            reviewerId={review.reviewerId}
          />

          {/* Review actions */}
          {!isReviewComplete && (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={updateReviewMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateReviewMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Draft
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCompleteReview}
                disabled={
                  !canComplete ||
                  updateReviewMutation.isPending
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateReviewMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Review
                  </>
                )}
              </button>
            </>
          )}

          {/* Decision */}
          {isReviewComplete && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold">
                  Decision
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Make the final screening decision for this
                  application.
                </p>
              </div>

              {/* Threshold information */}
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Final Score
                  </span>

                  <span className="font-semibold text-slate-900">
                    {totalScore}/100
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Shortlist Threshold
                  </span>

                  <span className="font-medium text-slate-900">
                    {rubric.shortlistThreshold}/100
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Reject Threshold
                  </span>

                  <span className="font-medium text-slate-900">
                    {rubric.rejectThreshold}/100
                  </span>
                </div>
              </div>

              {/* Decision buttons */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setDecision("SHORTLISTED")
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    decision === "SHORTLISTED"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Shortlist
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDecision("REJECTED")
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    decision === "REJECTED"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>

              {/* Decision reason */}
              <div className="mt-5">
                <label
                  htmlFor="decision-reason"
                  className="text-sm font-medium text-slate-700"
                >
                  Decision Reason
                </label>

                <textarea
                  id="decision-reason"
                  value={decisionReason}
                  onChange={(event) =>
                    setDecisionReason(event.target.value)
                  }
                  rows={5}
                  placeholder="Explain the reason for this decision..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Confirm decision */}
              <button
                type="button"
                onClick={handleDecision}
                disabled={
                  !decision ||
                  !decisionReason.trim() ||
                  createDecisionMutation.isPending
                }
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  decision === "REJECTED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {createDecisionMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Recording Decision...
                  </>
                ) : decision === "REJECTED" ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Confirm Rejection
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm Shortlist
                  </>
                )}
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

export default ReviewWorkspacePage;