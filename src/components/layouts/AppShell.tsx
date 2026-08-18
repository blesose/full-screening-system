import { useState } from "react";
import { X } from "lucide-react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

function AppShell() {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const closeMobileNav = () => {
        setIsMobileNavOpen(false);
    }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {isMobileNavOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
                <button
                type="button"
                aria-label="Close naviagtion overlay"
                onClick={closeMobileNav}
                className="absolute inset-0 bg-black/40"
                />
                <aside className="relative z-10 h-full w-72 max-w-[85vw] bg-surface shadow-xl">
                    <div className="flex h-16 items-center justify-end border-b border-border px-3">
                        <button
                        type="button"
                        onClick={closeMobileNav}
                        aria-label="Close naviagtion"
                        className="rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                            <X size={20} strokeWidth={1.8} /> 
                        </button>
                    </div>
                    <Sidebar onNavigate={closeMobileNav}/>
                </aside>
            </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setIsMobileNavOpen(true)}/>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;