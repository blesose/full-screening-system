import { Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navigationItems } from "./navigation";

interface SidebarProps {
    onNavigate?: () => void; 
}
function Sidebar ({onNavigate}: SidebarProps) {

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border px-5">
        <div>
          <p className="text-sm font-semibold tracking-tight">
            Screening System
          </p>

          <p className="text-xs text-muted-foreground">
            Admissions Workspace
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-2 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>

        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                ].join(" ")
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
            ].join(" ")
          }
        >
          <Settings size={18} strokeWidth={1.8} />
          <span>Settings</span>
        </NavLink>

        <div className="mt-3 rounded-lg bg-secondary p-3">
          <p className="text-sm font-medium text-secondary-foreground">
            Reviewer
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Admissions Team
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;