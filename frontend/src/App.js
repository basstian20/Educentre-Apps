import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";

import { AuthProvider, useAuth } from "@/lib/auth";
import { LangProvider } from "@/lib/i18n";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Educators from "@/pages/Educators";
import Parents from "@/pages/Parents";
import Classes from "@/pages/Classes";
import Enrollment from "@/pages/Enrollment";
import Attendance from "@/pages/Attendance";
import Grades from "@/pages/Grades";
import Results from "@/pages/Results";
import Materials from "@/pages/Materials";
import Invoices from "@/pages/Invoices";
import Announcements from "@/pages/Announcements";
import Reports from "@/pages/Reports";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-sm text-slate-500 font-jakarta">Loading…</div>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  console.log("USER VALUE:", user);
  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/students" element={<Protected><Students /></Protected>} />
            <Route path="/educators" element={<Protected><Educators /></Protected>} />
            <Route path="/parents" element={<Protected><Parents /></Protected>} />
            <Route path="/classes" element={<Protected><Classes /></Protected>} />
            <Route path="/enrollment" element={<Protected><Enrollment /></Protected>} />
            <Route path="/attendance" element={<Protected><Attendance /></Protected>} />
            <Route path="/grades" element={<Protected><Grades /></Protected>} />
            <Route path="/results" element={<Protected><Results /></Protected>} />
            <Route path="/materials" element={<Protected><Materials /></Protected>} />
            <Route path="/invoices" element={<Protected><Invoices /></Protected>} />
            <Route path="/announcements" element={<Protected><Announcements /></Protected>} />
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
