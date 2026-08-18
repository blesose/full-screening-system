import { Bell, Menu, Search } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
    onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="mr-3 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            Admissions Workspace
          </p>
          <h1 className="truncate text-base font-semibold text-foreground">
            Screening & Shortlisting
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
        >
          <Search size={19} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell size={19} strokeWidth={1.8} />
        </button>

        <ThemeToggle />

        <div className="ml-1 hidden h-8 w-px bg-border sm:block" />

        <button
          type="button"
          className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary sm:flex"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            AT
          </div>

          <div className="hidden md:block">
            <p className="text-xs font-medium text-foreground">
              Admissions Team
            </p>
            <p className="text-[11px] text-muted-foreground">
              Reviewer
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;