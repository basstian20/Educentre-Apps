import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import { useLang } from "../lib/i18n";

export default function Layout({ title, subtitle, actions, children }) {
  const { t } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef(null);
  const canvasRef = useRef(null);

  // Gelembung latar bergeser halus mengikuti kursor (parallax). Mati bila sistem meminta gerak hemat.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--px", (e.clientX / window.innerWidth - 0.5).toFixed(3));
        el.style.setProperty("--py", (e.clientY / window.innerHeight - 0.5).toFixed(3));
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  // On phones, tables marked .rtable turn into stacked cards. Each cell gets the text of its
  // column header as data-label so the card can show "Status: Active" style rows.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return undefined;
    const label = () => {
      main.querySelectorAll("table.rtable").forEach((table) => {
        const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent.trim());
        table.querySelectorAll("tbody tr").forEach((tr) => {
          [...tr.children].forEach((td, i) => {
            if (td.getAttribute("data-label") !== (heads[i] || "")) td.setAttribute("data-label", heads[i] || "");
          });
        });
      });
    };
    label();
    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(label);
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="app-canvas min-h-screen overflow-x-hidden" ref={canvasRef}>
      <a href="#main-content" className="skip-link">{t.skipToContent}</a>
      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-content min-w-0 md:pl-[248px]">
          <Topbar title={title} subtitle={subtitle} actions={actions} onMenuClick={() => setSidebarOpen(true)} />
          <main id="main-content" tabIndex={-1} ref={mainRef} className="animate-fadeUp px-4 pb-28 sm:px-6 md:pb-20 lg:px-8" data-testid="main-content">
            {children}
          </main>
        </div>
        <BottomNav onMore={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
