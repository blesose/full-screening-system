import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  CalendarDays,
  Filter,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useDeleteSavedView,
  useSavedViews,
} from "../features/savedViews/hooks/useSavedViews";

import type {
  SavedView,
  SavedViewSortField,
} from "../types/savedView";

import type { ApplicationStatus } from "../types/application";

const statusLabels: Record<
  ApplicationStatus | "ALL",
  string
> = {
  ALL: "All statuses",
  NEW: "New",
  IN_REVIEW: "In Review",
  REVIEW_COMPLETE: "Review Complete",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
};

const sortFieldLabels: Record<
  SavedViewSortField,
  string
> = {
  score: "Review score",
  submittedAt: "Submission date",
  gpa: "GPA",
  testScore: "Test score",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function SavedViewsPage() {
  const navigate = useNavigate();

  const {
    data: savedViews = [],
    isLoading,
    isError,
  } = useSavedViews();

  const deleteSavedViewMutation = useDeleteSavedView();

  const sortedViews = useMemo(() => {
    return [...savedViews].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );
  }, [savedViews]);

  const handleApply = (view: SavedView) => {
    const params = new URLSearchParams();

    params.set("view", view.id);
    params.set("status", view.filters.status);
    params.set("program", view.filters.program);
    params.set("sort", view.sort.field);
    params.set("direction", view.sort.direction);

    if (view.filters.minScore !== null) {
      params.set(
        "minScore",
        String(view.filters.minScore),
      );
    }

    if (view.filters.maxScore !== null) {
      params.set(
        "maxScore",
        String(view.filters.maxScore),
      );
    }

    if (view.filters.search) {
      params.set("search", view.filters.search);
    }

    navigate(`/applicants?${params.toString()}`);

    toast.success(`Applied "${view.name}"`);
  };

  const handleDelete = (view: SavedView) => {
    if (deleteSavedViewMutation.isPending) {
      return;
    }

    toast.warning(`Delete "${view.name}"?`, {
      description:
        "This saved view will be permanently removed.",
      action: {
        label: "Delete",
        onClick: () => {
          deleteSavedViewMutation.mutate(view.id, {
            onSuccess: () => {
              toast.success(
                "Saved view deleted successfully.",
              );
            },
            onError: () => {
              toast.error(
                "Failed to delete saved view.",
              );
            },
          });
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading saved views...
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="space-y-6">
        <section>
          <p className="text-sm text-muted-foreground">
            Admissions Workspace
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-foreground">
            Saved Views
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Save and reuse frequently used applicant filters.
          </p>
        </section>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load saved views.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm text-muted-foreground">
          Admissions Workspace
        </p>

        <h1 className="mt-1 text-3xl font-semibold text-foreground">
          Saved Views
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Save and reuse frequently used applicant filters and
          sorting preferences.
        </p>
      </section>

      {/* Summary */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Bookmark size={20} />
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Saved views
            </p>

            <p className="text-2xl font-semibold text-foreground">
              {savedViews.length}
            </p>
          </div>
        </div>
      </section>

      {/* Saved Views */}
      {sortedViews.length === 0 ? (
        <section className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
          <Bookmark
            size={36}
            className="mx-auto text-muted-foreground"
          />

          <h2 className="mt-4 text-base font-semibold text-foreground">
            No saved views yet
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Saved applicant filters will appear here once you
            create a view.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {sortedViews.map((view) => (
            <SavedViewCard
              key={view.id}
              view={view}
              onApply={() => handleApply(view)}
              onDelete={() => handleDelete(view)}
              deleting={
                deleteSavedViewMutation.isPending &&
                deleteSavedViewMutation.variables === view.id
              }
            />
          ))}
        </section>
      )}
    </main>
  );
}

function SavedViewCard({
  view,
  onApply,
  onDelete,
  deleting,
}: {
  view: SavedView;
  onApply: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { filters, sort } = view;

  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Bookmark size={18} />
          </div>

          <div>
            <h2 className="font-semibold text-foreground">
              {view.name}
            </h2>

            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={13} />

              <span>
                Created {formatDate(view.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          title="Delete saved view"
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          {deleting ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={17} />
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <Filter
            size={15}
            className="text-muted-foreground"
          />

          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filters
          </h3>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <FilterBadge
            label="Status"
            value={statusLabels[filters.status]}
          />

          {filters.program !== "ALL" && (
            <FilterBadge
              label="Program"
              value={filters.program}
            />
          )}

          {filters.minScore !== null && (
            <FilterBadge
              label="Min score"
              value={String(filters.minScore)}
            />
          )}

          {filters.maxScore !== null && (
            <FilterBadge
              label="Max score"
              value={String(filters.maxScore)}
            />
          )}

          {filters.search && (
            <FilterBadge
              label="Search"
              value={`"${filters.search}"`}
            />
          )}

          {filters.program === "ALL" &&
            filters.minScore === null &&
            filters.maxScore === null &&
            !filters.search && (
              <span className="text-sm text-muted-foreground">
                No additional filters
              </span>
            )}
        </div>
      </div>

      {/* Sort */}
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sort
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
          {sort.direction === "asc" ? (
            <ArrowUp size={15} />
          ) : (
            <ArrowDown size={15} />
          )}

          <span>
            {sortFieldLabels[sort.field]}
          </span>

          <span className="text-muted-foreground">
            ·
          </span>

          <span>
            {sort.direction === "asc"
              ? "Ascending"
              : "Descending"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Apply View
        </button>
      </div>
    </article>
  );
}

function FilterBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-foreground">
      <span className="font-medium text-muted-foreground">
        {label}:
      </span>

      <span>{value}</span>
    </span>
  );
}

export default SavedViewsPage;