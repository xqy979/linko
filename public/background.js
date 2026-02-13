/**
 * Background Service Worker for Linko Extension.
 * Proxies cross-origin API requests to bypass CORS restrictions.
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "FETCH_URL") {
    const url = message.url;
    const headers = message.headers || {};

    fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json, text/plain, */*",
        ...headers,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.text();
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);
          sendResponse({ success: true, data });
        } catch {
          sendResponse({ success: false, error: "Invalid JSON response" });
        }
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message || "Fetch failed" });
      });

    // Return true to keep the message channel open for async sendResponse
    return true;
  }
});
