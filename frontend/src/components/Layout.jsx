import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="pl-64">
        <Topbar title={title} subtitle={subtitle} actions={actions} />
        <main className="p-6 md:p-8 pt-18 animate-fadeUp" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
