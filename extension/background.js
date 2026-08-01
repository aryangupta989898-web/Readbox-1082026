// Readbox background service worker (Manifest V3)
// Handles: context menu, extension-icon click routing, backend API calls.

const DEFAULT_BACKEND = "https://readbox-preview.preview.emergentagent.com";

async function getConfig() {
    const { readbox_token, readbox_backend } = await chrome.storage.sync.get(["readbox_token", "readbox_backend"]);
    return { token: readbox_token || "", backend: (readbox_backend || DEFAULT_BACKEND).replace(/\/$/, "") };
}

async function api(path, body) {
    const { token, backend } = await getConfig();
    if (!token) throw new Error("Readbox not connected — open the extension options and paste your token.");
    const res = await fetch(`${backend}/api${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Readbox-Token": token },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Readbox: ${res.status} ${t.slice(0, 120)}`);
    }
    return res.json();
}

async function apiMultipart(path, formData) {
    const { token, backend } = await getConfig();
    if (!token) throw new Error("Readbox not connected — open the extension options and paste your token.");
    const res = await fetch(`${backend}/api${path}`, {
        method: "POST",
        headers: { "X-Readbox-Token": token },
        body: formData,
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Readbox: ${res.status} ${t.slice(0, 120)}`);
    }
    return res.json();
}

function base64ToBlob(b64, mime) {
    const byteChars = atob(b64);
    const arr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) arr[i] = byteChars.charCodeAt(i);
    return new Blob([arr], { type: mime });
}

async function printTabToPdf(tabId) {
    const target = { tabId };
    await chrome.debugger.attach(target, "1.3");
    try {
        const result = await chrome.debugger.sendCommand(target, "Page.printToPDF", {
            printBackground: true,
            preferCSSPageSize: true,
            marginTop: 0.4,
            marginBottom: 0.4,
            marginLeft: 0.4,
            marginRight: 0.4,
        });
        return result.data; // base64
    } finally {
        try { await chrome.debugger.detach(target); } catch (_) {}
    }
}

function notify(message, isError = false) {
    chrome.notifications?.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: isError ? "Readbox — Error" : "Readbox",
        message: message.slice(0, 200),
        priority: 1,
    });
}

// Context menu: right-click any selected text → Save to Readbox
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "readbox-save-selection",
        title: "Save selection as Readbox highlight",
        contexts: ["selection"],
    });
    chrome.contextMenus.create({
        id: "readbox-save-page",
        title: "Save this page to Readbox",
        contexts: ["page"],
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab || !tab.url) return;
    try {
        if (info.menuItemId === "readbox-save-selection" && info.selectionText) {
            await api("/extension/save-highlight", {
                url: tab.url,
                title: tab.title || "",
                text: info.selectionText,
            });
            notify(`Highlight saved from "${tab.title || tab.url}"`);
        } else if (info.menuItemId === "readbox-save-page") {
            // Ask the content script to extract article text via Readability
            const [extracted] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => window.__readboxExtract && window.__readboxExtract(),
            });
            const payload = extracted?.result || { title: tab.title, text: "", author: "", site_name: "" };
            const r = await api("/extension/save-page", {
                url: tab.url,
                title: payload.title || tab.title || "",
                author: payload.author || "",
                text: payload.text || "",
                site_name: payload.site_name || "",
            });
            notify(r.created ? `Saved "${r.reading.title}" to Readbox` : `Already in Readbox — updated`);
        }
    } catch (e) {
        notify(e.message || "Failed", true);
    }
});

// Message handler from popup and content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
        try {
            if (msg.type === "save-page") {
                const r = await api("/extension/save-page", msg.payload);
                sendResponse({ ok: true, data: r });
            } else if (msg.type === "save-page-pdf") {
                // Snapshot rendered tab as PDF via CDP, then upload as multipart.
                const { tabId, url, title, author, text, site_name } = msg.payload;
                const b64 = await printTabToPdf(tabId);
                const blob = base64ToBlob(b64, "application/pdf");
                const fd = new FormData();
                fd.append("file", blob, `${(title || "page").replace(/[^\w\-]+/g, "_").slice(0, 80)}.pdf`);
                fd.append("url", url || "");
                fd.append("title", title || "");
                fd.append("author", author || "");
                fd.append("text", text || "");
                fd.append("site_name", site_name || "");
                const r = await apiMultipart("/extension/save-page-pdf", fd);
                sendResponse({ ok: true, data: r });
            } else if (msg.type === "save-highlight") {
                const r = await api("/extension/save-highlight", msg.payload);
                sendResponse({ ok: true, data: r });
            } else if (msg.type === "get-config") {
                sendResponse(await getConfig());
            }
        } catch (e) {
            sendResponse({ ok: false, error: e.message });
        }
    })();
    return true; // async response
});
