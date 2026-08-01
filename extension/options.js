const DEFAULT_BACKEND = "https://readbox-preview.preview.emergentagent.com";

function setStatus(text, kind) {
    const el = document.getElementById("status");
    el.textContent = text || "";
    el.className = "status " + (kind || "");
}

async function load() {
    const { readbox_token, readbox_backend } = await chrome.storage.sync.get(["readbox_token", "readbox_backend"]);
    document.getElementById("backend").value = readbox_backend || DEFAULT_BACKEND;
    document.getElementById("token").value = readbox_token || "";
}

async function save() {
    const backend = (document.getElementById("backend").value || DEFAULT_BACKEND).replace(/\/$/, "");
    const token = document.getElementById("token").value.trim();
    if (!token) { setStatus("Paste your token first.", "err"); return; }
    setStatus("Testing…");
    try {
        // Verify token by attempting a lightweight ping-like call
        const res = await fetch(`${backend}/api/extension/setup`);
        if (!res.ok) throw new Error(`Backend not reachable (${res.status})`);
        const data = await res.json();
        if (data.token !== token) throw new Error("Token doesn't match Readbox's current token. Regenerate in Readbox and paste again.");
        await chrome.storage.sync.set({ readbox_token: token, readbox_backend: backend });
        setStatus("✓ Connected. You're ready to save pages and highlights.", "ok");
    } catch (e) {
        setStatus(e.message || "Failed to connect", "err");
    }
}

document.getElementById("save-btn").addEventListener("click", save);
document.getElementById("show-btn").addEventListener("click", () => {
    const input = document.getElementById("token");
    input.type = input.type === "password" ? "text" : "password";
});

load();
