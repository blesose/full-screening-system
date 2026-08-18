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
        <p className="text-sm font-medium text-muted-foreground">
          Admissions Workspace
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage screening preferences, AI assistance, notifications,
          and workspace settings.
        </p>
      </section>

      {/* AI Settings */}
      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Sparkles size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-foreground">
                AI Screening Assistant
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Use AI to assist reviewers with application screening,
                summaries, and recommendations.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
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
          <div className="m-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex gap-3">
              <Sparkles
                size={18}
                className="mt-0.5 shrink-0 text-primary"
              />

              <div>
                <p className="text-sm font-medium text-foreground">
                  AI assistance is enabled
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
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
      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2.5 text-muted-foreground">
              <SlidersHorizontal size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-foreground">
                Screening Preferences
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure how the admissions workspace behaves.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
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
      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-start gap-3 p-5">
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Shield size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-foreground">
              Review & Privacy
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
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
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
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
        <div className="mt-0.5 text-muted-foreground">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
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
            ? "bg-primary"
            : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-surface transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default SettingsPage;