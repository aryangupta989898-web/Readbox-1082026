// Readbox popup
async function currentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function extractOnPage(tab) {
    if (!tab || !tab.id) return null;
    try {
        const [res] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.__readboxExtract && window.__readboxExtract(),
        });
        return res?.result || null;
    } catch {
        return null;
    }
}

async function getSelectionOnPage(tab) {
    if (!tab || !tab.id) return "";
    try {
        const [res] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => window.getSelection ? window.getSelection().toString().trim() : "",
        });
        return res?.result || "";
    } catch {
        return "";
    }
}

async function checkConnected() {
    const cfg = await chrome.runtime.sendMessage({ type: "get-config" });
    return Boolean(cfg && cfg.token);
}

function setStatus(text, kind) {
    const el = document.getElementById("status");
    el.textContent = text || "";
    el.className = "status " + (kind || "");
}

function disableAll(disabled) {
    document.getElementById("save-pdf-btn").disabled = disabled;
    document.getElementById("save-page-text-btn").disabled = disabled;
    document.getElementById("save-selection-btn").disabled = disabled;
}

async function init() {
    const manifest = chrome.runtime.getManifest();
    document.getElementById("version").textContent = "v" + manifest.version;

    const tab = await currentTab();
    document.getElementById("page-title").textContent = tab?.title || "(no title)";
    document.getElementById("page-url").textContent = tab?.url || "";

    const connected = await checkConnected();
    if (!connected) {
        document.getElementById("not-connected").style.display = "block";
        document.getElementById("save-pdf-btn").disabled = true;
        document.getElementById("save-page-text-btn").disabled = true;
    }

    const selection = await getSelectionOnPage(tab);
    if (selection && selection.length >= 4) {
        document.getElementById("save-selection-btn").disabled = false;
        document.getElementById("save-selection-btn").textContent = `Save Selection (${selection.length}c)`;
    }

    // Guard: refuse to save chrome:// / new tab
    if (!tab?.url || /^(chrome|chrome-extension|about|edge|brave|file):\/\//.test(tab.url)) {
        disableAll(true);
        setStatus("Can't save this page (internal URL)", "err");
        return;
    }

    document.getElementById("save-pdf-btn").addEventListener("click", async () => {
        setStatus("Extracting article & printing PDF… hold on");
        disableAll(true);
        const article = await extractOnPage(tab);
        const resp = await chrome.runtime.sendMessage({
            type: "save-page-pdf",
            payload: {
                tabId: tab.id,
                url: tab.url,
                title: article?.title || tab.title || "",
                author: article?.author || "",
                text: article?.text || "",
                site_name: article?.site_name || new URL(tab.url).hostname,
            },
        });
        if (resp?.ok) {
            setStatus(resp.data.created ? "✓ Saved as PDF" : "✓ Updated existing reading", "ok");
            setTimeout(() => window.close(), 900);
        } else {
            setStatus(resp?.error || "Failed", "err");
            disableAll(false);
        }
    });

    document.getElementById("save-page-text-btn").addEventListener("click", async () => {
        setStatus("Saving article text…");
        disableAll(true);
        const article = await extractOnPage(tab);
        const resp = await chrome.runtime.sendMessage({
            type: "save-page",
            payload: {
                url: tab.url,
                title: article?.title || tab.title || "",
                author: article?.author || "",
                text: article?.text || "",
                site_name: article?.site_name || new URL(tab.url).hostname,
            },
        });
        if (resp?.ok) {
            setStatus(resp.data.created ? "✓ Text saved" : "✓ Already in Readbox", "ok");
            setTimeout(() => window.close(), 900);
        } else {
            setStatus(resp?.error || "Failed", "err");
            disableAll(false);
        }
    });

    document.getElementById("save-selection-btn").addEventListener("click", async () => {
        setStatus("Saving highlight…");
        document.getElementById("save-selection-btn").disabled = true;
        const resp = await chrome.runtime.sendMessage({
            type: "save-highlight",
            payload: { url: tab.url, title: tab.title || "", text: selection, site_name: new URL(tab.url).hostname },
        });
        if (resp?.ok) {
            setStatus("✓ Highlight saved", "ok");
            setTimeout(() => window.close(), 900);
        } else {
            setStatus(resp?.error || "Failed", "err");
            document.getElementById("save-selection-btn").disabled = false;
        }
    });

    document.getElementById("open-options").addEventListener("click", (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
    document.getElementById("open-options-2").addEventListener("click", (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
    document.getElementById("open-readbox").addEventListener("click", async (e) => {
        e.preventDefault();
        const cfg = await chrome.runtime.sendMessage({ type: "get-config" });
        chrome.tabs.create({ url: cfg?.backend || "https://readbox-preview.preview.emergentagent.com" });
    });
}

init();
