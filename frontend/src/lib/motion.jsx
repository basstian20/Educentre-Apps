import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Mode gerak: "full" (penuh) atau "lite" (hemat). Bila sistem meminta gerak dikurangi
// (prefers-reduced-motion), hasil akhirnya selalu hemat, apa pun pilihan tersimpan.
const MotionContext = createContext({ motion: "full", stored: "full", setMotion: () => {}, systemReduced: false });

const readStored = () => {
  try {
    return localStorage.getItem("ec_motion") === "lite" ? "lite" : "full";
  } catch {
    return "full";
  }
};

const mql = () => window.matchMedia?.("(prefers-reduced-motion: reduce)");

// Dipanggil sebelum render pertama agar tidak ada kedipan gerak penuh.
export function applyMotion(mode) {
  document.documentElement.dataset.motion = mode;
}

export function MotionProvider({ children }) {
  const [stored, setStored] = useState(readStored);
  const [systemReduced, setSystemReduced] = useState(() => !!mql()?.matches);

  useEffect(() => {
    const m = mql();
    if (!m) return undefined;
    const on = (e) => setSystemReduced(e.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);

  const motion = systemReduced ? "lite" : stored;
  useEffect(() => {
    applyMotion(motion);
  }, [motion]);

  const setMotion = useCallback((mode) => {
    const next = mode === "lite" ? "lite" : "full";
    setStored(next);
    try {
      localStorage.setItem("ec_motion", next);
    } catch {
      /* pilihan tidak diingat */
    }
  }, []);

  return <MotionContext.Provider value={{ motion, stored, setMotion, systemReduced }}>{children}</MotionContext.Provider>;
}

export const useMotion = () => useContext(MotionContext);
