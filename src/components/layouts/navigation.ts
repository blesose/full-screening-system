import {
  Bookmark,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  Users,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Applicants",
    to: "/applicants",
    icon: Users,
  },
  {
    label: "Reviews",
    to: "/reviews",
    icon: ClipboardCheck,
  },
  {
    label: "Shortlist",
    to: "/shortlist",
    icon: ListChecks,
  },
  {
    label: "Saved Views",
    to: "/saved-views",
    icon: Bookmark,
  },
] as const;