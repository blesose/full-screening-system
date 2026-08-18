import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { useApplication } from "../features/applications/hooks/useApplication";
import { useApplicants } from "../features/applicants/hooks/useApplicants";

function ApplicationDetailPage() {
  const { applicationId } = useParams();

  const {
    data: application,
    isLoading: applicationLoading,
    isError: applicationError,
  } = useApplication(applicationId);

  const {
    data: applicants,
    isLoading: applicantsLoading,
    isError: applicantsError,
  } = useApplicants();

  const isLoading = applicationLoading || applicantsLoading;
  const isError = applicationError || applicantsError;

  if (isLoading) {
    return (
      <main className="p-6">
        <p className="text-sm text-slate-500">
          Loading application...
        </p>
      </main>
    );
  }

  if (isError || !application) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h1 className="text-base font-semibold text-red-900">
            Unable to load application
          </h1>

          <p className="mt-1 text-sm text-red-700">
            We could not retrieve this application.
          </p>

          <Link
            to="/applicants"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-800"
          >
            <ArrowLeft size={16} />
            Back to applicants
          </Link>
        </div>
      </main>
    );
  }

  const applicant = applicants?.find(
    (item) => item.id === application.applicantId,
  );

  return (
    <main className="space-y-6 p-6">
      <Link
        to="/applicants"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700"
      >
        <ArrowLeft size={16} />
        Back to applicants
      </Link>

      <header>
        <p className="text-sm font-medium text-slate-500">
          Admissions Workspace
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          {applicant
            ? `${applicant.firstName} ${applicant.lastName}`
            : "Application"}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {application.program} · {application.programCode}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Applicant
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="mt-1 font-medium text-slate-900">
                {applicant
                  ? `${applicant.firstName} ${applicant.lastName}`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="mt-1 text-slate-700">
                {applicant?.email ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="mt-1 text-slate-700">
                {applicant?.phone ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Location</p>
              <p className="mt-1 text-slate-700">
                {applicant?.location ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Academic Information
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Program</p>
              <p className="mt-1 font-medium text-slate-900">
                {application.program}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Intake</p>
              <p className="mt-1 font-medium text-slate-900">
                {application.intake}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">GPA</p>
              <p className="mt-1 font-medium text-slate-900">
                {application.gpa.toFixed(2)} / {application.gpaScale}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Test Score</p>
              <p className="mt-1 font-medium text-slate-900">
                {application.testScore}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Application Status
          </h2>

          <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
            {application.status.replace("_", " ")}
          </p>

          <div className="mt-5">
            <p className="text-xs text-slate-500">
              Submitted
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {new Date(application.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Personal Statement
        </h2>

        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
          {application.essay}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-950">
            Activities
          </h2>

          <ul className="mt-4 space-y-2">
            {application.activities.map((activity) => (
              <li
                key={activity}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                {activity}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-950">
            Achievements
          </h2>

          <ul className="mt-4 space-y-2">
            {application.achievements.map((achievement) => (
              <li
                key={achievement}
                className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                {achievement}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

export default ApplicationDetailPage;