// Readbox content script
// - Exposes window.__readboxExtract() → uses Mozilla Readability to pull clean article content
// - Watches text selections and shows a floating "+ H" button to save as highlight

(function () {
    if (window.__readboxLoaded) return;
    window.__readboxLoaded = true;

    // --- Readability lazy loader ---
    let readabilityPromise = null;
    function loadReadability() {
        if (window.Readability) return Promise.resolve(window.Readability);
        if (readabilityPromise) return readabilityPromise;
        readabilityPromise = new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = chrome.runtime.getURL("Readability.js");
            s.onload = () => resolve(window.Readability);
            s.onerror = () => reject(new Error("Failed to load Readability"));
            (document.head || document.documentElement).appendChild(s);
        });
        return readabilityPromise;
    }

    async function extractArticle() {
        try {
            await loadReadability();
            // Clone so Readability doesn't mutate the live DOM
            const doc = document.cloneNode(true);
            const article = new window.Readability(doc).parse();
            if (!article) throw new Error("no-article");
            return {
                title: article.title || document.title,
                author: article.byline || "",
                text: article.textContent || "",
                site_name: article.siteName || document.querySelector('meta[property="og:site_name"]')?.content || location.hostname,
            };
        } catch {
            // Fallback: just grab document text
            return {
                title: document.title,
                author: "",
                text: (document.body?.innerText || "").slice(0, 100000),
                site_name: location.hostname,
            };
        }
    }
    window.__readboxExtract = extractArticle;

    // --- Floating highlight button ---
    let btn = null;
    let lastSelectionText = "";

    function ensureBtn() {
        if (btn) return btn;
        btn = document.createElement("div");
        btn.id = "readbox-hl-btn";
        btn.setAttribute("data-testid", "readbox-hl-btn");
        btn.innerHTML = `<span class="readbox-hl-icon">＋</span><span class="readbox-hl-label">Save to Readbox</span>`;
        btn.addEventListener("mousedown", (e) => e.preventDefault()); // don't clear selection
        btn.addEventListener("click", saveSelection);
        document.body.appendChild(btn);
        return btn;
    }

    function hideBtn() {
        if (btn) btn.classList.remove("visible");
    }

    function showBtnNear(rect) {
        ensureBtn();
        const top = window.scrollY + rect.top - 44;
        const left = window.scrollX + rect.left + rect.width / 2;
        btn.style.top = `${Math.max(4, top)}px`;
        btn.style.left = `${left}px`;
        btn.classList.remove("saving", "saved");
        btn.querySelector(".readbox-hl-label").textContent = "Save to Readbox";
        btn.classList.add("visible");
    }

    function onSelectionChange() {
        // Debounce via microtask; check final selection on mouseup/keyup
    }

    function onMouseUp() {
        setTimeout(() => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) { hideBtn(); return; }
            const text = sel.toString().trim();
            if (text.length < 4) { hideBtn(); return; }
            // Ignore selections inside inputs/textareas
            const anchor = sel.anchorNode;
            const el = anchor && (anchor.nodeType === 1 ? anchor : anchor.parentElement);
            if (el && el.closest("input, textarea, [contenteditable='true']")) { hideBtn(); return; }
            // Ignore selections inside the button itself
            if (el && el.closest("#readbox-hl-btn")) return;
            lastSelectionText = text;
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) { hideBtn(); return; }
            showBtnNear(rect);
        }, 10);
    }

    function onScrollOrResize() {
        if (btn && btn.classList.contains("visible")) hideBtn();
    }

    async function saveSelection(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!lastSelectionText || !btn) return;
        btn.classList.add("saving");
        btn.querySelector(".readbox-hl-label").textContent = "Saving…";
        try {
            const article = await extractArticle();
            const resp = await chrome.runtime.sendMessage({
                type: "save-highlight",
                payload: {
                    url: location.href,
                    title: article.title,
                    text: lastSelectionText,
                    site_name: article.site_name,
                },
            });
            if (!resp || !resp.ok) throw new Error(resp?.error || "Save failed");
            btn.classList.remove("saving");
            btn.classList.add("saved");
            btn.querySelector(".readbox-hl-label").textContent = "✓ Saved";
            setTimeout(hideBtn, 1400);
            window.getSelection()?.removeAllRanges();
        } catch (err) {
            btn.classList.remove("saving");
            btn.querySelector(".readbox-hl-label").textContent = "Try again";
            console.warn("Readbox save error", err);
            setTimeout(hideBtn, 2200);
        }
    }

    document.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("keyup", (e) => { if (["Shift", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) onMouseUp(); });
    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("mousedown", (e) => {
        if (btn && btn.classList.contains("visible") && !btn.contains(e.target)) hideBtn();
    }, true);
})();
