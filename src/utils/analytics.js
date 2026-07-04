// Custom 100% Free Google Sheets Analytics Tracker
// To activate, replace the URL below with your deployed Google Apps Script Web App URL.
const ANALYTICS_URL = "https://script.google.com/macros/s/AKfycby86NpHp2K8wJZ-YB4hu_60mrtHgxYQL_BOcJ3HjKgqr_45wSmeCdFjppRvA6id2RZi5g/exec";

export const trackEvent = (eventName, eventData = {}) => {
  if (!ANALYTICS_URL || ANALYTICS_URL.includes("REPLACE_WITH_YOUR_WEB_APP_URL")) {
    console.log(`[Analytics Simulation] Event: ${eventName}`, eventData);
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    event: eventName,
    referrer: document.referrer || "direct",
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent,
    ...eventData
  };

  try {
    fetch(ANALYTICS_URL, {
      method: "POST",
      mode: "no-cors", // Bypasses CORS blocks since Apps Script does redirects
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Failed to send analytics:", e);
  }
};
