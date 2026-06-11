import { useEffect } from "react";

export default function DeveloperCredit() {
  useEffect(() => {
    document.getElementById("emergent-badge")?.remove();
    document.getElementById("noble-dev-badge")?.remove();
  }, []);

  return (
    <a
      className="developer-credit"
      href="https://nobledevco.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit Noble Dev website"
      data-testid="developer-credit"
    >
      <span className="developer-credit-label">Developed by</span>
      <img
        className="developer-credit-logo"
        src="/noble-dev-logo.png"
        alt="Noble Dev"
      />
    </a>
  );
}
