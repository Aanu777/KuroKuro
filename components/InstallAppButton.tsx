"use client";

import { useEffect, useState } from "react";
import { Download, MonitorDown, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("KUROKURO service worker registration failed:", error);
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setShowHelp((current) => !current);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  if (installed) return null;

  return (
    <div className="install-app-wrap">
      <button className="install-app-button" type="button" onClick={install} aria-expanded={showHelp}>
        {installPrompt ? <Download size={14} /> : <MonitorDown size={14} />}
        <span>Install app</span>
      </button>
      {showHelp && (
        <div className="install-app-help" role="status">
          <button className="install-app-help-close" type="button" aria-label="Close install instructions" onClick={() => setShowHelp(false)}>
            <X size={14} />
          </button>
          <strong>Install KUROKURO</strong>
          <p>
            In Chrome or Edge, open the browser menu and choose <b>Install KUROKURO</b> or
            <b> Apps → Install this site as an app</b>. If that option is missing, refresh the
            page and try again after a moment.
          </p>
        </div>
      )}
    </div>
  );
}
