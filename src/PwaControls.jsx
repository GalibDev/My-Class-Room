import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Download,
  WifiOff,
  RefreshCw,
  X,
  Smartphone,
  Share,
  CheckCheck,
} from "lucide-react";
import { registerSW } from "virtual:pwa-register";
import "./pwa.css";
const PwaContext = createContext(null);
export function PwaProvider({ children }) {
  const [installEvent, setInstallEvent] = useState(null),
    [offline, setOffline] = useState(!navigator.onLine),
    [update, setUpdate] = useState(null),
    [installed, setInstalled] = useState(
      matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true,
    ),
    [dismissed, setDismissed] = useState(false),
    [error, setError] = useState(""),
    [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => {
    const before = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const done = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    const online = () => setOffline(false),
      offline = () => setOffline(true);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    let timer;
    let stopped = false;
    const refresh = registerSW({
      immediate: true,
      onOfflineReady() {
        if (!stopped) setOfflineReady(true);
      },
      onNeedRefresh() {
        if (!stopped) setUpdate(() => () => refresh(true));
      },
      onRegisteredSW(url, registration) {
        if (registration?.active && !stopped) setOfflineReady(true);
        if (registration)
          timer = setInterval(
            () => {
              if (navigator.onLine) registration.update().catch(() => {});
            },
            60 * 60 * 1000,
          );
      },
      onRegisterError() {
        if (!stopped)
          setError(
            "Offline setup unavailable. Reload when connected to try again.",
          );
      },
    });
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", done);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);
  async function install() {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } catch {
      setError("Use your browser menu to install My Class Room.");
    }
  }
  return (
    <PwaContext.Provider
      value={{ installEvent, install, offline, installed, error, offlineReady }}
    >
      {children}
      {(offline || update || (!dismissed && installEvent && !installed)) && (
        <aside className="pwa-banner" aria-label="App status" role="status">
          {offline ? (
            <>
              <WifiOff size={21} />
              <div>
                <strong>You’re offline</strong>
                <p>
                  Routine and demo work offline. Connect to update real
                  attendance.
                </p>
              </div>
            </>
          ) : update ? (
            <>
              <RefreshCw size={21} />
              <div>
                <strong>A new version is ready</strong>
                <p>Finish your attendance changes, then update.</p>
              </div>
              <button onClick={() => update()}>Update</button>
            </>
          ) : (
            <>
              <Smartphone size={21} />
              <div>
                <strong>Keep your classroom close</strong>
                <p>Install My Class Room on your home screen.</p>
              </div>
              <button onClick={install}>Install</button>
              <button
                className="pwa-close"
                aria-label="Dismiss install suggestion"
                onClick={() => setDismissed(true)}
              >
                <X size={16} />
              </button>
            </>
          )}
        </aside>
      )}
    </PwaContext.Provider>
  );
}
export function InstallApp() {
  const { installEvent, install, installed, error, offlineReady } =
    useContext(PwaContext);
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return (
    <section className="pwa-install-card">
      <span className="pwa-install-icon">
        {installed ? <CheckCheck size={25} /> : <Smartphone size={25} />}
      </span>
      <h2>
        {installed ? "Your classroom is installed" : "Install My Class Room"}
      </h2>
      <p>
        {installed
          ? "Open it straight from your home screen."
          : "One tap to your attendance and routine. Opens in its own app window."}
      </p>
      {!installed &&
        (installEvent ? (
          <button className="p-primary" onClick={install}>
            <Download size={18} />
            Install App
          </button>
        ) : (
          <div className="pwa-instructions">
            {ios ? (
              <>
                <Share size={17} />
                <span>
                  In Safari, tap <strong>Share</strong>, then{" "}
                  <strong>Add to Home Screen</strong>.
                </span>
              </>
            ) : (
              <>
                <Download size={17} />
                <span>
                  Open your browser menu and choose <strong>Install app</strong>{" "}
                  or <strong>Add to Home screen</strong>. If it is missing,
                  revisit the published HTTPS app.
                </span>
              </>
            )}
          </div>
        ))}
      {error && <p className="pwa-error">{error}</p>}
      {offlineReady && (
        <p className="pwa-ready">
          <CheckCheck size={15} />
          App saved for offline use
        </p>
      )}
      <small>
        Offline access is ready after your first online visit to the published
        app. Real attendance needs an internet connection.
      </small>
    </section>
  );
}
