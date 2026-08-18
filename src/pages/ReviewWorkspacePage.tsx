import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Save,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
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
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

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
      <main className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading review workspace...
        </div>
      </main>
    );
  }

  if (isError || !review || !application || !applicant || !rubric) {
    return (
      <main className="p-4 sm:p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6 dark:border-red-900/50 dark:bg-red-950/30">
          <h1 className="text-lg font-semibold text-red-900 dark:text-red-200">
            Unable to load review
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
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
  application: NonNullable<ReturnType<typeof useApplication>["data"]>;
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

  const [decision, setDecision] = useState<DecisionChoice | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for unsaved Changes
  const hasUnsavedChanges = useCallback(() => {
    const scoresChanged = JSON.stringify(scores) !== JSON.stringify(review.scores ?? {});
    const commentChanged = reviewerComment !== (review.reviewerComment ?? "");
    const decisionReasonChanged = decisionReason !== "";
    const decisionChanged = decision !== null;

    return scoresChanged || commentChanged || decisionReasonChanged || decisionChanged;
  }, [scores, reviewerComment, decisionReason, decision, review]);

  // Unsaved HOOk
  const {
    showPrompt,
    confirmDiscard,
    cancelNavigation,
    saveAndProceed,
    triggerPrompt
  } = useUnsavedChanges({
    hasChanges: hasUnsavedChanges(),
    message: "You have unsaved changes in this review. Are you sure you want to leave?",
    onDiscard: () => {
      setScores(review.scores ?? {});
      setReviewerComment(review.reviewerComment ?? "");
      setDecision(null);
      setDecisionReason("");
    },
    onSave: () => {
      handleSaveDraft();
    },
  });

  // Handlers
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

    const clampedValue = Math.min(Math.max(numericValue, 0), maxScore);
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
      scores[criterion.id] !== null && scores[criterion.id] !== undefined,
  ).length;

  const canComplete = rubric.criteria
    .filter((criterion) => criterion.required)
    .every(
      (criterion) =>
        scores[criterion.id] !== null && scores[criterion.id] !== undefined,
    );

  const progressPercentage =
    rubric.criteria.length > 0
      ? (completedCriteria / rubric.criteria.length) * 100
      : 0;

  const isReviewComplete = review.status === "COMPLETE";

  const handleSaveDraft = useCallback(() => {
    if (isReviewComplete) {
      toast.info("This review is already completed");
      return;
    }

    setIsSaving(true);
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
          toast.success("Review draft saved successfully");
          setIsSaving(false);
        },
        onError: () => {
          toast.error("Failed to save review draft");
          setIsSaving(false);
        },
      },
    );
  }, [review.id, scores, reviewerComment, totalScore, updateReviewMutation, isReviewComplete]);

  const handleCompleteReview = useCallback(() => {
    if (!canComplete) {
      toast.error("Complete all required criteria before submitting");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
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

          navigate("/reviews");
        },
        onError: () => {
          toast.error("Failed to complete review");
          setIsSubmitting(false);
        },
      },
    );
  }, [
    review.id,
    review.applicationId,
    review.reviewerId,
    scores,
    reviewerComment,
    totalScore,
    canComplete,
    updateReviewMutation,
    logAuditEvent,
    navigate,
    isSubmitting,
  ]);

  const handleDecisionSubmit = useCallback(() => {
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
  }, [decision, decisionReason, isReviewComplete, review, createDecisionMutation, navigate]);

  // Navigation with Conflict detection
  const handleNavigateBack = useCallback(() => {
    triggerPrompt(() => navigate("/reviews"));
  }, [triggerPrompt, navigate]);

  // Keyboard Shorcuts
  const shortcuts = [
    {
      key: 's',
      ctrl: true,
      action: () => {
        if (!isReviewComplete) {
          handleSaveDraft();
        }
      },
      description: 'Save draft',
    },
    {
      key: 'Enter',
      ctrl: true,
      action: () => {
        if (canComplete && !isReviewComplete) {
          handleCompleteReview();
        }
      },
      description: 'Complete review',
    },
    {
      key: 'Escape',
      action: () => handleNavigateBack(),
      description: 'Go back',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <main className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-full">
      {/* Conflict Detection Modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">
              Unsaved Changes
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You have unsaved changes. What would you like to do?
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelNavigation}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={saveAndProceed}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Save & Leave
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back navigation */}
      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        onClick={handleNavigateBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reviews
      </button>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges() && !isReviewComplete && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 sm:px-4 py-2 text-xs sm:text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <CircleAlert className="h-4 w-4 shrink-0" />
          <span className="truncate">
            You have unsaved changes. Use Ctrl+S to save your draft.
          </span>
        </div>
      )}

      {/* Page header */}
      <header>
        <p className="text-xs sm:text-sm font-medium text-primary">
          Review Workspace
        </p>
        <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-foreground">
          Application Review
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          {application.program} · {application.intake}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] sm:text-xs text-muted-foreground">
          <span>Ctrl+S: Save</span>
          <span>Ctrl+Enter: Complete</span>
          <span>Esc: Back</span>
        </div>
      </header>

      {/* Review metadata - Responsive */}
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Review ID</p>
            <p className="mt-1 font-medium text-sm sm:text-base text-foreground">
              {review.id}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rubric</p>
            <p className="mt-1 font-medium text-sm sm:text-base text-foreground">
              {rubric.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Review Status</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                isReviewComplete
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              {isReviewComplete ? "Completed" : "In progress"}
            </span>
          </div>
        </div>
      </section>

      {/* Main content - Responsive grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* LEFT COLUMN */}
        <section className="space-y-4 sm:space-y-6">
          {/* Applicant information - Responsive */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Applicant
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Application information
                </p>
              </div>
              <span className="self-start rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {application.status.replace("_", " ")}
              </span>
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <p className="text-xs text-muted-foreground">Applicant ID</p>
                <p className="mt-1 font-medium text-sm text-foreground">
                  {application.applicantId}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GPA</p>
                <p className="mt-1 font-medium text-sm text-foreground">
                  {application.gpa} / {application.gpaScale}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assessment Score</p>
                <p className="mt-1 font-medium text-sm text-foreground">
                  {application.testScore}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Program</p>
                <p className="mt-1 font-medium text-sm text-foreground">
                  {application.program}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Intake</p>
                <p className="mt-1 font-medium text-sm text-foreground">
                  {application.intake}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recommendation</p>
                <p className="mt-1 font-medium capitalize text-sm text-foreground">
                  {application.recommendationStatus}
                </p>
              </div>
            </div>
          </div>

          {/* AI Screening Assistant */}
          <AIScreeningAssistant
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
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Personal Statement
            </h2>
            <p className="mt-3 sm:mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {application.essay}
            </p>
          </div>

          {/* Activities */}
          {application.activities.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Activities
              </h2>
              <ul className="mt-3 sm:mt-4 space-y-2">
                {application.activities.map((activity) => (
                  <li
                    key={activity}
                    className="rounded-lg bg-muted px-3 sm:px-4 py-2 sm:py-3 text-sm text-foreground"
                  >
                    {activity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements */}
          {application.achievements.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Achievements
              </h2>
              <ul className="mt-3 sm:mt-4 space-y-2">
                {application.achievements.map((achievement) => (
                  <li
                    key={achievement}
                    className="rounded-lg bg-muted px-3 sm:px-4 py-2 sm:py-3 text-sm text-foreground"
                  >
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rubric - Responsive */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                {rubric.name}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Score each required criterion before completing the review.
              </p>
            </div>

            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-5">
              {rubric.criteria.map((criterion) => {
                const score = scores[criterion.id];

                return (
                  <div
                    key={criterion.id}
                    className="rounded-xl border border-border p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-sm sm:text-base text-foreground">
                          {criterion.name}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                          {criterion.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {criterion.weight}%
                      </span>
                    </div>

                    <div className="mt-3 sm:mt-4 flex items-center gap-3">
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
                        className="w-20 sm:w-28 rounded-lg border border-border bg-background px-2 sm:px-3 py-1.5 sm:py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="Score"
                      />
                      <span className="text-sm text-muted-foreground">
                        / {criterion.maxScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <aside className="space-y-4 sm:space-y-6">
          {/* Review summary - Responsive */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Review Summary
            </h2>

            <div className="mt-4 sm:mt-6">
              <p className="text-sm text-muted-foreground">Current score</p>
              <p className="mt-1 text-3xl sm:text-4xl font-semibold text-foreground">
                {totalScore}
                <span className="text-base sm:text-lg font-normal text-muted-foreground">
                  /100
                </span>
              </p>
            </div>

            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">
                  {completedCriteria} / {rubric.criteria.length}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6 rounded-xl bg-muted p-3 sm:p-4">
              <div className="flex items-center gap-2">
                {canComplete || isReviewComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <CircleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {isReviewComplete
                    ? "Review completed"
                    : canComplete
                      ? "Ready to complete"
                      : "Review incomplete"}
                </span>
              </div>
              {!canComplete && !isReviewComplete && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Complete all required criteria before submitting.
                </p>
              )}
            </div>
          </div>

          {/* Reviewer comments - Responsive */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Reviewer Comments
            </h2>
            <textarea
              value={reviewerComment}
              disabled={isReviewComplete}
              onChange={(event) => setReviewerComment(event.target.value)}
              rows={5}
              placeholder="Add your review comments..."
              className="mt-3 sm:mt-4 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 sm:py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Activity & Comments */}
          <ActivityPanel
            applicationId={application.id}
            reviewerId={review.reviewerId}
          />

          {/* Review actions - Responsive */}
          {!isReviewComplete && (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={updateReviewMutation.isPending || isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 sm:py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateReviewMutation.isPending || isSaving ? (
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
                disabled={!canComplete || updateReviewMutation.isPending || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 sm:py-3 text-sm font-medium text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateReviewMutation.isPending || isSubmitting ? (
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

          {/* Decision - Responsive */}
          {isReviewComplete && (
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Decision
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Make the final screening decision for this application.
                </p>
              </div>

              {/* Threshold information */}
              <div className="mt-4 sm:mt-5 rounded-xl bg-muted p-3 sm:p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Final Score</span>
                  <span className="font-semibold text-foreground">
                    {totalScore}/100
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shortlist Threshold</span>
                  <span className="font-medium text-foreground">
                    {rubric.shortlistThreshold}/100
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reject Threshold</span>
                  <span className="font-medium text-foreground">
                    {rubric.rejectThreshold}/100
                  </span>
                </div>
              </div>

              {/* Decision buttons - Responsive */}
              <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setDecision("SHORTLISTED")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition ${
                    decision === "SHORTLISTED"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Shortlist
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("REJECTED")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition ${
                    decision === "REJECTED"
                      ? "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950/30 dark:text-red-400"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>

              {/* Decision reason */}
              <div className="mt-4 sm:mt-5">
                <label
                  htmlFor="decision-reason"
                  className="text-xs sm:text-sm font-medium text-foreground"
                >
                  Decision Reason
                </label>
                <textarea
                  id="decision-reason"
                  value={decisionReason}
                  onChange={(event) => setDecisionReason(event.target.value)}
                  rows={4}
                  placeholder="Explain the reason for this decision..."
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 sm:py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Confirm decision */}
              <button
                type="button"
                onClick={handleDecisionSubmit}
                disabled={
                  !decision ||
                  !decisionReason.trim() ||
                  createDecisionMutation.isPending
                }
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  decision === "REJECTED"
                    ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                    : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
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