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
  Download,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
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
import { exportToCSV } from "../utils/export";
import { useKeyboardShortcuts, useShortcutDescriptions } from "../hooks/useKeyboardShortcuts";
import { PDFExportButton } from "../components/ui/PDFExportButton";

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
  // ===== STATE =====
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DecisionFilter>("ALL");
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ===== DATA FETCHING =====
  const {
    data: applications = [],
    isLoading: applicationsLoading,
    isError: applicationsError,
    refetch: refetchApplications,
  } = useApplications();

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
    refetch: refetchReviews,
  } = useReviews();

  const {
    data: decisions = [],
    isLoading: decisionsLoading,
    isError: decisionsError,
    refetch: refetchDecisions,
  } = useDecisions();

  const {
    data: rubric,
    isLoading: rubricLoading,
    isError: rubricError,
  } = useRubric();

  const createDecisionMutation = useCreateDecision();
  const logAuditEvent = useLogAuditEvent();

  // ===== LOADING & ERROR STATES =====
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

  // ===== MEMOIZED DATA =====
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

  // ===== STATISTICS =====
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

  // ===== FILTERED APPLICATIONS =====
  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

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

  // ===== TOGGLE EXPAND ROW (Mobile) =====
  const toggleRowExpand = useCallback((id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // ===== INDIVIDUAL DECISION HANDLER =====
  const handleDecision = useCallback((
    applicationId: string,
    decision: "SHORTLISTED" | "REJECTED",
  ) => {
    return new Promise<void>((resolve, reject) => {
      const review = reviewMap.get(applicationId);

      if (!review || review.status !== "COMPLETE") {
        const error = `Application ${applicationId} has no completed review`;
        toast.error(error);
        reject(new Error(error));
        return;
      }

      if (review.totalScore === null) {
        const error = `Application ${applicationId} has no total score`;
        toast.error(error);
        reject(new Error(error));
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
            resolve();
          },
          onError: (error) => {
            reject(error);
          },
        },
      );
    });
  }, [reviewMap, rubric, createDecisionMutation, logAuditEvent]);

  // ===== BATCH SELECTION =====
  const toggleSelection = useCallback((id: string) => {
    setSelectedApplications(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = filteredApplications.map(app => app.id);
    const allSelected = allIds.every(id => selectedApplications.has(id));
    setSelectedApplications(allSelected ? new Set() : new Set(allIds));
  }, [filteredApplications, selectedApplications]);

  // ===== BATCH DECISION HANDLER =====
  const handleBatchDecision = useCallback(async (
    decision: "SHORTLISTED" | "REJECTED"
  ) => {
    if (isProcessing) return;

    if (selectedApplications.size === 0) {
      toast.error("Select at least one application");
      return;
    }

    const actionLabel = decision === "SHORTLISTED" ? "shortlist" : "reject";
    
    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${selectedApplications.size} application(s)?`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      const appIds = Array.from(selectedApplications);
      
      const chunkSize = 5;
      const chunks = [];
      for (let i = 0; i < appIds.length; i += chunkSize) {
        chunks.push(appIds.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map(appId => handleDecision(appId, decision))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Application ${chunk[index]}: ${result.reason}`);
          }
        });
      }

      if (successCount > 0) {
        toast.success(`${successCount} application(s) ${actionLabel}ed successfully`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} application(s) failed to ${actionLabel}`);
        console.error('Batch decision errors:', errors);
      }

      setSelectedApplications(new Set());

      await Promise.all([
        refetchApplications(),
        refetchReviews(),
        refetchDecisions(),
      ]);

    } catch (error) {
      toast.error("Batch operation failed. Please try again.");
      console.error('Batch decision error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedApplications, isProcessing, handleDecision, refetchApplications, refetchReviews, refetchDecisions]);

  // ===== EXPORT FUNCTIONS =====
  const handleExportCSV = useCallback(() => {
    const exportData = filteredApplications.map(app => ({
      'Application ID': app.id,
      'Applicant ID': app.applicantId,
      'Program': app.program,
      'Program Code': app.programCode,
      'Intake': app.intake,
      'GPA': app.gpa,
      'Test Score': app.testScore,
      'Review Score': reviewMap.get(app.id)?.totalScore ?? 'N/A',
      'Status': app.status,
      'Recommendation': getRecommendation(app.id),
      'Decision': decisionMap.get(app.id)?.decision ?? 'Pending',
      'Decision Reason': decisionMap.get(app.id)?.reason ?? 'N/A'
    }));
    exportToCSV(exportData, `shortlist_export_${new Date().toISOString().split('T')[0]}`);
    toast.success(`Exported ${exportData.length} applications to CSV`);
  }, [filteredApplications, reviewMap, decisionMap, getRecommendation]);

  // ===== KEYBOARD SHORTCUTS =====
  const shortcuts = useMemo(() => [
    {
      key: 'a',
      ctrl: true,
      action: () => selectAll(),
      description: 'Select all applications',
    },
    {
      key: 'Escape',
      action: () => setSelectedApplications(new Set()),
      description: 'Clear selection',
    },
    {
      key: 's',
      ctrl: true,
      shift: true,
      action: () => handleBatchDecision("SHORTLISTED"),
      description: 'Batch shortlist',
    },
    {
      key: 'r',
      ctrl: true,
      shift: true,
      action: () => handleBatchDecision("REJECTED"),
      description: 'Batch reject',
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: 'Focus search',
    },
    {
      key: 'e',
      ctrl: true,
      shift: true,
      action: () => handleExportCSV(),
      description: 'Export CSV',
    },
  ], [selectAll, handleBatchDecision, handleExportCSV]);

  useKeyboardShortcuts(shortcuts);
  const shortcutDescriptions = useShortcutDescriptions(shortcuts);

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading decision workspace...
        </div>
      </main>
    );
  }

  // ===== ERROR STATE =====
  if (isError || !rubric) {
    return (
      <main className="space-y-6 p-4 sm:p-6">
        <section>
          <p className="text-sm text-muted-foreground">
            Admissions Workspace
          </p>

          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-foreground">
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

  // ===== MAIN RENDER =====
  return (
    <main className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <section>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Admissions Workspace
        </p>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-3xl font-semibold text-foreground">
            Decision & Shortlisting
          </h1>
        </div>

        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
          Review completed applications and make final admissions decisions.
        </p>

        {/* Keyboard Shortcuts Help - Collapsible on mobile */}
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">
            Keyboard shortcuts
          </summary>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 rounded-lg bg-muted p-3">
            {shortcutDescriptions.map(({ key, description }) => (
              <div key={key} className="flex justify-between gap-4 text-xs">
                <span className="text-muted-foreground">{description}</span>
                <kbd className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* Statistics - Responsive grid */}
      <section className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total"
          value={applications.length}
          icon={<FileText size={16} className="sm:w-[18px] sm:h-[18px]" />}
          iconClassName="bg-primary/10 text-primary"
        />

        <StatCard
          label="Ready"
          value={readyForDecisionCount}
          icon={<AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
          iconClassName="bg-primary/10 text-primary"
        />

        <StatCard
          label="Shortlisted"
          value={shortlistedCount}
          icon={<CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />}
          iconClassName="bg-primary/10 text-primary"
        />

        <StatCard
          label="Rejected"
          value={rejectedCount}
          icon={<XCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
          iconClassName="bg-primary/10 text-primary"
        />
      </section>

      {/* Active rules - Responsive */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">
              Active Decision Rules
            </h2>

            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
              Recommendations are based on the active rubric.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Shortlist ≥ {rubric.shortlistThreshold}
            </span>

            <span className="rounded-full bg-red-100 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Reject ≤ {rubric.rejectThreshold}
            </span>
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        {/* Search + filter - Responsive */}
        <div className="border-b border-border p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search applications..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as DecisionFilter,
                )
              }
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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

          {/* Batch Actions Bar - Responsive */}
          {filteredApplications.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {selectedApplications.size} selected
              </span>
              
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handleBatchDecision("SHORTLISTED")}
                  disabled={isProcessing || selectedApplications.size === 0}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} className="sm:h-[14px] sm:w-[14px]" />
                  )}
                  <span className="hidden xs:inline">Batch</span> Shortlist
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchDecision("REJECTED")}
                  disabled={isProcessing || selectedApplications.size === 0}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle size={12} className="sm:h-[14px] sm:w-[14px]" />
                  )}
                  <span className="hidden xs:inline">Batch</span> Reject
                </button>

                <PDFExportButton
                  data={filteredApplications.map(app => ({
                    'Application ID': app.id || 'N/A',
                    'Applicant ID': app.applicantId || 'N/A',
                    'Program': app.program || 'N/A',
                    'Program Code': app.programCode || 'N/A',
                    'Intake': app.intake || 'N/A',
                    'GPA': app.gpa?.toString() || 'N/A',
                    'Test Score': app.testScore?.toString() || 'N/A',
                    'Review Score': reviewMap.get(app.id)?.totalScore?.toString() ?? 'N/A',
                    'Status': app.status || 'N/A',
                    'Recommendation': getRecommendation(app.id) || 'N/A',
                    'Decision': decisionMap.get(app.id)?.decision ?? 'Pending',
                  }))}
                  columns={[
                    { header: 'Application ID', accessor: 'Application ID', width: 12 },
                    { header: 'Applicant ID', accessor: 'Applicant ID', width: 12 },
                    { header: 'Program', accessor: 'Program', width: 15 },
                    { header: 'Program Code', accessor: 'Program Code', width: 10 },
                    { header: 'Intake', accessor: 'Intake', width: 10 },
                    { header: 'GPA', accessor: 'GPA', width: 8 },
                    { header: 'Test Score', accessor: 'Test Score', width: 10 },
                    { header: 'Review Score', accessor: 'Review Score', width: 10 },
                    { header: 'Status', accessor: 'Status', width: 12 },
                    { header: 'Recommendation', accessor: 'Recommendation', width: 12 },
                    { header: 'Decision', accessor: 'Decision', width: 10 },
                  ]}
                  filename={`shortlist_${new Date().toISOString().split('T')[0]}`}
                  label="Export PDF"
                  variant="purple"
                  className="text-xs"
                />

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <FileSpreadsheet size={12} className="sm:h-[14px] sm:w-[14px]" />
                  <span className="hidden xs:inline">Export</span> CSV
                </button>
              </div>

              {selectedApplications.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedApplications(new Set())}
                  className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table - Responsive with card view on mobile */}
        {filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 text-center">
            <ListChecks
              size={32}
              className="text-muted-foreground"
            />

            <h2 className="mt-4 text-base font-semibold text-foreground">
              No applications found
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Try adjusting your search or decision filter.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View - hidden on small screens */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[800px]" id="shortlist-table">
                <thead>
                  <tr className="border-b border-border bg-muted text-left">
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                        onChange={selectAll}
                        className="rounded border-border text-primary focus:ring-primary"
                        aria-label="Select all applications"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Application
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Program
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Score
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Recommendation
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((application) => {
                    const review = reviewMap.get(application.id);
                    const decision = decisionMap.get(application.id);
                    const recommendation = getRecommendation(application.id);
                    const reviewComplete =
                      review?.status === "COMPLETE" &&
                      review.totalScore !== null;

                    return (
                      <tr
                        key={application.id}
                        className={`border-b border-border last:border-0 hover:bg-muted/50 ${
                          selectedApplications.has(application.id) 
                            ? 'bg-primary/5' 
                            : ''
                        }`}
                      >
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selectedApplications.has(application.id)}
                            onChange={() => toggleSelection(application.id)}
                            className="rounded border-border text-primary focus:ring-primary"
                            aria-label={`Select application ${application.id}`}
                          />
                        </td>

                        <td className="px-4 py-4">
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

                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-foreground">
                            {application.program}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {application.programCode} · {application.intake}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-sm font-semibold text-foreground">
                            {review?.totalScore !== null &&
                            review?.totalScore !== undefined
                              ? `${review.totalScore}/100`
                              : "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
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

                        <td className="px-4 py-4">
                          {decision?.decision === "SHORTLISTED" ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Shortlisted
                            </span>
                          ) : decision?.decision === "REJECTED" ? (
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

                        <td className="px-4 py-4">
                          {decision ? (
                            <span className="text-xs text-muted-foreground">
                              Decision recorded
                            </span>
                          ) : !reviewComplete ? (
                            <Link
                              to={
                                review
                                  ? `/reviews/${review.id}`
                                  : `/applicants/${application.id}`
                              }
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            >
                              <Clock3 size={14} />
                              Review incomplete
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={createDecisionMutation.isPending}
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
                                disabled={createDecisionMutation.isPending}
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

            {/* Mobile Card View - visible only on small screens */}
            <div className="sm:hidden divide-y divide-border">
              {filteredApplications.map((application) => {
                const review = reviewMap.get(application.id);
                const decision = decisionMap.get(application.id);
                const recommendation = getRecommendation(application.id);
                const reviewComplete =
                  review?.status === "COMPLETE" &&
                  review.totalScore !== null;
                const isExpanded = expandedRows.has(application.id);

                return (
                  <div
                    key={application.id}
                    className={`p-4 ${
                      selectedApplications.has(application.id) 
                        ? 'bg-primary/5' 
                        : ''
                    }`}
                  >
                    {/* Mobile Row Header */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedApplications.has(application.id)}
                        onChange={() => toggleSelection(application.id)}
                        className="mt-1 rounded border-border text-primary focus:ring-primary"
                        aria-label={`Select application ${application.id}`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/applicants/${application.id}`}
                            className="font-medium text-primary hover:underline truncate"
                          >
                            {application.id}
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(application.id)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{application.program}</span>
                          <span>·</span>
                          <span>{application.programCode}</span>
                          <span>·</span>
                          <span className="font-medium text-foreground">
                            {review?.totalScore !== null && review?.totalScore !== undefined
                              ? `${review.totalScore}/100`
                              : "—"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {recommendation === "SHORTLIST" ||
                          recommendation === "SHORTLISTED" ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Shortlist
                            </span>
                          ) : recommendation === "REJECT" ||
                            recommendation === "REJECTED" ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                              Reject
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              Manual review
                            </span>
                          )}

                          {decision?.decision === "SHORTLISTED" ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Shortlisted
                            </span>
                          ) : decision?.decision === "REJECTED" ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                              Rejected
                            </span>
                          ) : reviewComplete ? (
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              In review
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-3 pl-8 space-y-2 border-t border-border pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Applicant</span>
                          <span className="font-medium text-foreground">{application.applicantId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Intake</span>
                          <span className="font-medium text-foreground">{application.intake}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">GPA</span>
                          <span className="font-medium text-foreground">{application.gpa}</span>
                        </div>

                        {decision ? (
                          <div className="text-xs text-muted-foreground pt-2">
                            Decision recorded
                          </div>
                        ) : !reviewComplete ? (
                          <Link
                            to={
                              review
                                ? `/reviews/${review.id}`
                                : `/applicants/${application.id}`
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                          >
                            <Clock3 size={14} />
                            Review incomplete
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={createDecisionMutation.isPending}
                              onClick={() =>
                                handleDecision(
                                  application.id,
                                  "SHORTLISTED",
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              Shortlist
                            </button>

                            <button
                              type="button"
                              disabled={createDecisionMutation.isPending}
                              onClick={() =>
                                handleDecision(
                                  application.id,
                                  "REJECTED",
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer - Responsive */}
        <div className="border-t border-border px-3 sm:px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Showing {filteredApplications.length} of {applications.length} applications
            </p>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Download size={12} className="sm:h-[14px] sm:w-[14px]" />
              <span className="hidden xs:inline">Export</span> CSV
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

// ===== STAT CARD COMPONENT - Responsive =====
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
    <div className="rounded-xl border border-border bg-surface p-3 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-sm text-muted-foreground">
          {label}
        </p>
        <div className={`rounded-lg p-1.5 sm:p-2 ${iconClassName}`}>
          {icon}
        </div>
      </div>
      <p className="mt-1 sm:mt-4 text-lg sm:text-3xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

export default ShortlistPage;