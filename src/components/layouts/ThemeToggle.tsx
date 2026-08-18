import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "../../hooks/useTheme";

const themeOptions: {
  value: Theme;
  label: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex items-center rounded-lg border border-border bg-secondary p-1"
      aria-label="Theme selection"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-label={`Use ${option.label.toLowerCase()} theme`}
            aria-pressed={isActive}
            className={[
              "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <Icon size={15} strokeWidth={1.8} />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;