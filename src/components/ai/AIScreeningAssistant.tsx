import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { isAxiosError } from "axios";

import {
  analyzeApplication,
  type AIScreeningResult,
} from "../../features/ai/aiScreening";

interface AIScreeningAssistantProps {
  application: {
    firstName: string;
    lastName: string;
    program: string;
    gpa: number;
    gpaScale: number;
    testScore: number;
    essay: string;
    activities: string[];
    achievements: string[];
    recommendationStatus: string;
  };
  review: {
    totalScore: number | null;
    status: string;
    scores?: Record<string, number | null>;
  };
  rubric: {
    shortlistThreshold: number;
    rejectThreshold: number;
  };
}

function AIScreeningAssistant({
  application,
  review,
  rubric,
}: AIScreeningAssistantProps) {
  const [analysis, setAnalysis] = useState<AIScreeningResult | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    console.log("🔍 Starting AI analysis...");
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeApplication(
        application,
        review,
        rubric,
      );
      
      console.log("✅ AI result:", result);

      const createdAt = new Date().toISOString();

      setAnalysis(result);
      setAnalyzedAt(createdAt);
      
      console.log("✅ Analysis complete!");
    } catch (err) {
      console.error("❌ Error:", err);
      
      if (isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError(
            "AI service is not available. Please make sure the AI server is running.",
          );
        } else if (err.response?.status === 429) {
          setError(
            "Rate limited. Please wait a minute and try again.",
          );
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError(
            "Something went wrong. Please try again.",
          );
        }
      } else {
        setError(
          "Something went wrong. Please try again.",
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recommendationConfig = {
    SHORTLIST: {
      label: "Recommend Shortlist",
      icon: CheckCircle2,
      classes:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
    },
    REJECT: {
      label: "Recommend Reject",
      icon: XCircle,
      classes:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300",
    },
    MANUAL_REVIEW: {
      label: "Recommend Manual Review",
      icon: AlertTriangle,
      classes:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
    },
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm w-full overflow-hidden">
      {/* Header - flex column on mobile, row on larger screens */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-xl bg-primary/10 p-2.5 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-foreground break-words">
              AI Screening Assistant
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
              Analyze this applicant's profile and receive
              an evidence-based screening recommendation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto min-h-[44px]"
        >
          {isAnalyzing ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin shrink-0" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{analysis ? "Re-analyze" : "Analyze Applicant"}</span>
            </>
          )}
        </button>
      </div>

      {analyzedAt && !isAnalyzing && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            Last analyzed {new Date(analyzedAt).toLocaleString()}
          </span>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Analysis failed
              </p>
              <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-300 break-words">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {!analysis && !isAnalyzing && !error && (
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                AI assistance is ready
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground break-words">
                The assistant considers academic performance,
                assessment results, personal statement, activities,
                achievements, recommendations, and review scores.
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-5 w-full">
          <div
            className={`rounded-xl border p-4 ${
              recommendationConfig[analysis.recommendation]
                .classes
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon =
                    recommendationConfig[
                      analysis.recommendation
                    ].icon;

                  return <Icon className="h-5 w-5 shrink-0" />;
                })()}

                <span className="text-sm font-semibold">
                  {
                    recommendationConfig[
                      analysis.recommendation
                    ].label
                  }
                </span>
              </div>

              <span className="text-sm font-medium">
                {analysis.confidence}% confidence
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Screening Score
              </p>

              <p className="mt-1 text-2xl font-semibold text-foreground">
                {analysis.score}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </p>
            </div>

            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Shortlist Threshold
              </p>

              <p className="mt-1 text-2xl font-semibold text-foreground">
                {rubric.shortlistThreshold}
              </p>
            </div>

            <div className="rounded-xl bg-muted p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Reject Threshold
              </p>

              <p className="mt-1 text-2xl font-semibold text-foreground">
                {rubric.rejectThreshold}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Screening Summary
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground break-words">
              {analysis.summary}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Strengths
              </h3>

              <ul className="mt-3 space-y-2">
                {analysis.strengths.map((strength) => (
                  <li
                    key={strength}
                    className="flex gap-2 text-sm text-muted-foreground break-words"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Areas to Review
              </h3>

              <ul className="mt-3 space-y-2">
                {analysis.concerns.length > 0 ? (
                  analysis.concerns.map((concern) => (
                    <li
                      key={concern}
                      className="flex gap-2 text-sm text-muted-foreground break-words"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>{concern}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">
                    No major concerns identified.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Evidence Considered
            </h3>

            <div className="mt-3 space-y-2">
              {analysis.evidence.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground break-words"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs leading-5 text-muted-foreground">
              AI recommendations are intended to support human
              review rather than replace admissions decisions.
              Final decisions remain with authorized reviewers.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default AIScreeningAssistant;