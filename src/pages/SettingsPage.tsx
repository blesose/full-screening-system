import { useState } from "react";
import {
  Bot,
  Bell,
  Check,
  Moon,
  Shield,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

function SettingsPage() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoReview, setAutoReview] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved successfully.");
  };

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-slate-500">
          Admissions Workspace
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage screening preferences, AI assistance, notifications,
          and workspace settings.
        </p>
      </section>

      {/* AI Settings */}
      <section className="rounded-xl border border-indigo-200 bg-white dark:border-indigo-900/50 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Sparkles size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                AI Screening Assistant
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Use AI to assist reviewers with application screening,
                summaries, and recommendations.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingRow
            icon={<Bot size={18} />}
            title="Enable AI assistance"
            description="Allow AI-powered screening and applicant analysis."
            enabled={aiEnabled}
            onChange={setAiEnabled}
          />

          <SettingRow
            icon={<Sparkles size={18} />}
            title="Automatic screening suggestions"
            description="Generate screening suggestions when applications are reviewed."
            enabled={autoReview}
            onChange={setAutoReview}
          />
        </div>

        {aiEnabled && (
          <div className="m-5 rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex gap-3">
              <Sparkles
                size={18}
                className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400"
              />

              <div>
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                  AI assistance is enabled
                </p>

                <p className="mt-1 text-xs leading-5 text-indigo-700 dark:text-indigo-300">
                  AI recommendations should support human review rather
                  than replace admissions decisions. Final decisions
                  remain with authorized reviewers.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Screening Preferences */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <SlidersHorizontal size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">
                Screening Preferences
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure how the admissions workspace behaves.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <SettingRow
            icon={<Bell size={18} />}
            title="Application notifications"
            description="Receive notifications for new applications and review activity."
            enabled={notifications}
            onChange={setNotifications}
          />

          <SettingRow
            icon={<Moon size={18} />}
            title="Compact workspace"
            description="Use a more compact layout when viewing application lists."
            enabled={compactMode}
            onChange={setCompactMode}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3 p-5">
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Shield size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">
              Review & Privacy
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              AI-generated recommendations are intended to assist
              authorized admissions reviewers. Applicant information
              should only be accessed and processed according to your
              institution's policies.
            </p>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Check size={17} />
          Save Settings
        </button>
      </div>
    </main>
  );
}

function SettingRow({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-400">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-indigo-600"
            : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default SettingsPage;