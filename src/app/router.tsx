import { createBrowserRouter, Navigate } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import ApplicantsPage from "../pages/ApplicantsPage";
import ApplicationDetailPage from "../pages/ApplicationDetailPage";
import ReviewsPage from "../pages/ReviewsPage";
import ReviewWorkspacePage from "../pages/ReviewWorkspacePage";
import ShortlistPage from "../pages/ShortlistPage";
import SavedViewsPage from "../pages/SavedViewsPage";
import SettingsPage from "../pages/SettingsPage";
import ApplicantPortal from "../pages/ApplicantPortal";

import AppShell from "../components/layouts/AppShell";
import AITestPage from "../pages/AITestPage";
export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/dashboard" replace />
    },
    {
        element: <AppShell />,
        children: [
            {
        path: "/dashboard",
        element: <DashboardPage />
    },
    {
        path: "/applicants",
        element: <ApplicantsPage />,
    },
    {
        path: "/applicants/:applicationId",
        element: <ApplicationDetailPage />,
    },
    {
        path: "/reviews",
        element: <ReviewsPage />,
    },
    {
        path: "/reviews/:reviewId",
        element: <ReviewWorkspacePage />,
    },
    {
        path: "/shortlist",
        element: <ShortlistPage />,
    },
    {
        path: "/saved-views",
        element: <SavedViewsPage />,
    },
    {
        path: "settings",
        element: <SettingsPage />,
    },
    {
        path: "/applicant/:applicantId",
        element: <ApplicantPortal />,
    },
    {
  path: "/ai-test",
  element: <AITestPage />,
},
        ]
    }
    
]);