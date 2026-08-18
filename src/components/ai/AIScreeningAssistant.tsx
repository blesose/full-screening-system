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
import {
  useLatestAIAnalysis,
  useSaveAIAnalysis,
} from "../../features/ai/hooks/useAIAnalyses";

interface AIScreeningAssistantProps {
  applicationId: string;
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
  applicationId,
  application,
  review,
  rubric,
}: AIScreeningAssistantProps) {
  const { data: storedAnalysis, isLoading: isLoadingStored } =
    useLatestAIAnalysis(applicationId);

  const saveAnalysisMutation = useSaveAIAnalysis();

  const [analysis, setAnalysis] = useState<AIScreeningResult | null>(storedAnalysis || null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(storedAnalysis?.createdAt || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeApplication(
        application,
        review,
        rubric,
      );

      const createdAt = new Date().toISOString();

      setAnalysis(result);
      setAnalyzedAt(createdAt);

      saveAnalysisMutation.mutate({
        id: `AI-${applicationId}-${Date.now()}`,
        applicationId,
        ...result,
        provider: "Google",
        model: "gemini-3.6-flash",
        createdAt,
      });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        setError(
          "The AI service is rate-limited right now. Please wait a minute and try again.",
        );
      } else if (isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(
          "Something went wrong while analyzing this applicant. Please try again.",
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
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    REJECT: {
      label: "Recommend Reject",
      icon: XCircle,
      classes:
        "border-red-200 bg-red-50 text-red-700",
    },
    MANUAL_REVIEW: {
      label: "Recommend Manual Review",
      icon: AlertTriangle,
      classes:
        "border-amber-200 bg-amber-50 text-amber-700",
    },
  };

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              AI Screening Assistant
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Analyze this applicant's profile and receive
              an evidence-based screening recommendation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runAnalysis}
          disabled={isAnalyzing || isLoadingStored}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {analysis ? "Re-analyze" : "Analyze Applicant"}
            </>
          )}
        </button>
      </div>

      {analyzedAt && !isAnalyzing && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock3 className="h-3.5 w-3.5" />
          Last analyzed {new Date(analyzedAt).toLocaleString()}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Analysis failed
              </p>
              <p className="mt-1 text-xs leading-5 text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {!analysis && !isAnalyzing && !error && !isLoadingStored && (
        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

            <div>
              <p className="text-sm font-medium text-indigo-900">
                AI assistance is ready
              </p>

              <p className="mt-1 text-xs leading-5 text-indigo-700">
                The assistant considers academic performance,
                assessment results, personal statement, activities,
                achievements, recommendations, and review scores.
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-5">
          <div
            className={`rounded-xl border p-4 ${
              recommendationConfig[analysis.recommendation]
                .classes
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon =
                    recommendationConfig[
                      analysis.recommendation
                    ].icon;

                  return <Icon className="h-5 w-5" />;
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Screening Score
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {analysis.score}
                <span className="text-sm font-normal text-slate-400">
                  /100
                </span>
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Shortlist Threshold
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {rubric.shortlistThreshold}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Reject Threshold
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {rubric.rejectThreshold}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Screening Summary
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {analysis.summary}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-emerald-700">
                Strengths
              </h3>

              <ul className="mt-3 space-y-2">
                {analysis.strengths.map((strength) => (
                  <li
                    key={strength}
                    className="flex gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-amber-700">
                Areas to Review
              </h3>

              <ul className="mt-3 space-y-2">
                {analysis.concerns.length > 0 ? (
                  analysis.concerns.map((concern) => (
                    <li
                      key={concern}
                      className="flex gap-2 text-sm text-slate-600"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>{concern}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">
                    No major concerns identified from the
                    available application data.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Evidence Considered
            </h3>

            <div className="mt-3 space-y-2">
              {analysis.evidence.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs leading-5 text-indigo-700">
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