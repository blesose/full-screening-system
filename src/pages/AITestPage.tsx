import { useState } from "react";
import { useApplications } from "../features/applications/hooks/useApplications";
import { useApplicants } from "../features/applicants/hooks/useApplicants";
import { useReviews } from "../features/reviews/hooks/useReviews";
import { useRubric } from "../features/rubrics/hooks/useRubric";
import { analyzeApplication, type AIScreeningResult } from "../features/ai/aiScreening";

function AITestPage() {
  const [result, setResult] = useState<AIScreeningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("");

  const {
    data: applications = [],
    isLoading: appsLoading,
    isError: appsError,
  } = useApplications();

  const {
    data: applicants = [],
    isLoading: applicantsLoading,
    isError: applicantsError,
  } = useApplicants();

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useReviews();

  const {
    data: rubric,
    isLoading: rubricLoading,
    isError: rubricError,
  } = useRubric();

  const isLoading = appsLoading || applicantsLoading || reviewsLoading || rubricLoading;
  const isError = appsError || applicantsError || reviewsError || rubricError;

  const handleTest = async () => {
    if (!selectedApplicationId) {
      setError("Please select an application");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const application = applications.find(app => app.id === selectedApplicationId);
      if (!application) {
        throw new Error("Application not found");
      }

      const applicant = applicants.find(a => a.id === application.applicantId);
      if (!applicant) {
        throw new Error("Applicant not found");
      }

      const review = reviews.find(r => r.applicationId === application.id);
      if (!review) {
        throw new Error("Review not found for this application");
      }

      if (!rubric) {
        throw new Error("Rubric not found");
      }

      const aiApplicant = {
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
      };

      const aiReview = {
        totalScore: review.totalScore,
        status: review.status,
        scores: review.scores,
      };

      const aiRubric = {
        shortlistThreshold: rubric.shortlistThreshold,
        rejectThreshold: rubric.rejectThreshold,
      };

      console.log("Sending to AI:", { aiApplicant, aiReview, aiRubric });

      const response = await analyzeApplication(aiApplicant, aiReview, aiRubric);
      setResult(response);
      
      console.log("AI Response:", response);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-foreground">AI Test with Real Data</h1>
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-foreground">AI Test with Real Data</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
          Failed to load data. Please make sure the API server is running.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-foreground">AI Test with Real Data</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Application
        </label>
        <select
          value={selectedApplicationId}
          onChange={(e) => setSelectedApplicationId(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select an application...</option>
          {applications.map((app) => {
            const applicant = applicants.find(a => a.id === app.applicantId);
            const review = reviews.find(r => r.applicationId === app.id);
            return (
              <option key={app.id} value={app.id}>
                {applicant ? `${applicant.firstName} ${applicant.lastName}` : app.applicantId} - {app.program} 
                {review ? ` (Score: ${review.totalScore ?? 'N/A'})` : ' (No review)'}
              </option>
            );
          })}
        </select>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={handleTest}
          disabled={loading || !selectedApplicationId}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {loading ? "Analyzing..." : "Analyze Applicant"}
        </button>

        {result && (
          <button
            onClick={() => setResult(null)}
            className="bg-muted text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition"
          >
            Clear Results
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {selectedApplicationId && !loading && !result && !error && (
        <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
          <p className="text-muted-foreground">
            Select an application and click "Analyze Applicant" to see the AI screening results.
          </p>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-950/30 dark:border-emerald-800">
            <h2 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">AI Response:</h2>
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-foreground">Recommendation:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.recommendation === 'SHORTLIST' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : result.recommendation === 'REJECT'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                }`}>
                  {result.recommendation}
                </span>
                <span className="text-sm text-muted-foreground">
                  Confidence: {result.confidence}%
                </span>
                <span className="text-sm text-muted-foreground">
                  Score: {result.score}/100
                </span>
              </div>

              <div>
                <p className="font-medium text-foreground">Summary:</p>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </div>

              {result.strengths && result.strengths.length > 0 && (
                <div>
                  <p className="font-medium text-foreground">Strengths:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {result.strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.concerns && result.concerns.length > 0 && (
                <div>
                  <p className="font-medium text-foreground">Concerns:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {result.concerns.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.evidence && result.evidence.length > 0 && (
                <div>
                  <p className="font-medium text-foreground">Evidence:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {result.evidence.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AITestPage;