import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ title, subtitle, actions, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-canvas min-h-screen overflow-x-hidden">
      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-content min-w-0 md:pl-[236px]">
          <Topbar title={title} subtitle={subtitle} actions={actions} onMenuClick={() => setSidebarOpen(true)} />
          <main className="animate-fadeUp px-4 pb-5 sm:px-6 sm:pb-7 lg:px-8 lg:pb-8" data-testid="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
