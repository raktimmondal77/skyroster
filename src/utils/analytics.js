// Custom Free Google Sheets Analytics Tracker
const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL || "https://script.google.com/macros/s/AKfycby86NpHp2K8wJZ-YB4hu_60mrtHgxYQL_BOcJ3HjKgqr_45wSmeCdFjppRvA6id2RZi5g/exec";

export const trackEvent = (eventName, eventData = {}) => {
  if (typeof window !== "undefined" && window.localStorage?.getItem("skyroster-analytics-optout") === "true") {
    return;
  }

  if (!ANALYTICS_URL || ANALYTICS_URL.includes("REPLACE_WITH_YOUR_WEB_APP_URL")) {
    if (import.meta.env.DEV) {
      console.log(`[Analytics Simulation] Event: ${eventName}`, eventData);
    }
    return;
  }

  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    event: String(eventName).slice(0, 50),
    referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
    screenSize: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    ...eventData
  });

  // Try sendBeacon first for unloads and page exits
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    if (navigator.sendBeacon(ANALYTICS_URL, blob)) return;
  }

  // Fallback to fetch with timeout and error suppression
  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 4000) : null;

    fetch(ANALYTICS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: payload,
      signal: controller?.signal
    })
      .catch(() => {
        // Suppress ad-blocker or offline network drops silently
      })
      .finally(() => {
        if (timeout) clearTimeout(timeout);
      });
  } catch (e) {
    console.error("Failed to send analytics:", e);
  }
};
