import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowUpRight, Minus, Plus as PlusIcon, Bookmark, Check } from "@phosphor-icons/react";
import { api, API } from "../lib/api";
import { toast } from "sonner";

/**
 * Reader — full-screen, same-tab reading experience.
 *
 * Behavior split by source:
 *   - PDF readings (has_pdf === true): show the ORIGINAL PDF in an iframe.
 *     Native browser controls (zoom, page nav, print). No prose conversion.
 *     Highlighting-from-selection is NOT supported for PDF (browser plugin
 *     isolates selection); users copy & paste into the detail-page highlight box.
 *   - Text-only readings (no PDF, pasted text): show auto-formatted prose with
 *     select-any-passage → floating "Add as highlight" popup.
 */
export const Reader = ({ readingId, title, author, onClose, onHighlightAdded }) => {
    const [text, setText] = useState("");
    const [sourceType, setSourceType] = useState("manual");
    const [hasPdf, setHasPdf] = useState(false);
    const [fontSize, setFontSize] = useState(18);
    const [loading, setLoading] = useState(true);
    const [selection, setSelection] = useState(null); // { text, x, y }
    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const proseRef = useRef(null);

    const pdfUrl = `${API}/readings/${readingId}/pdf`;

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                const { data } = await api.get(`/readings/${readingId}/content`);
                if (!live) return;
                setText(data.text || "");
                setSourceType(data.source_type || "manual");
                setHasPdf(Boolean(data.has_pdf));
            } catch {
                if (live) toast.error("Failed to load reading content");
            } finally {
                if (live) setLoading(false);
            }
        })();
        return () => { live = false; };
    }, [readingId]);

    // Lock body scroll while open + ESC to close
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const esc = (e) => { if (e.key === "Escape") onClose?.(); };
        window.addEventListener("keydown", esc);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", esc);
        };
    }, [onClose]);

    // Selection handler — only for text mode (no PDF)
    useEffect(() => {
        if (hasPdf) { setSelection(null); return; }
        const handler = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) { setSelection(null); return; }
            const selectedText = sel.toString().trim();
            if (!selectedText || selectedText.length < 4) { setSelection(null); return; }
            if (!proseRef.current) return;
            const range = sel.getRangeAt(0);
            if (!proseRef.current.contains(range.commonAncestorContainer)) { setSelection(null); return; }
            const rect = range.getBoundingClientRect();
            setSelection({
                text: selectedText,
                x: Math.min(window.innerWidth - 200, Math.max(20, rect.left + rect.width / 2)),
                y: Math.max(80, rect.top - 12),
            });
        };
        document.addEventListener("mouseup", handler);
        document.addEventListener("touchend", handler);
        return () => {
            document.removeEventListener("mouseup", handler);
            document.removeEventListener("touchend", handler);
        };
    }, [hasPdf]);

    const saveHighlight = async () => {
        if (!selection?.text) return;
        setSaving(true);
        try {
            const { data } = await api.post(`/readings/${readingId}/highlights`, { text: selection.text });
            onHighlightAdded?.(data);
            setJustSaved(true);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
            toast.success("Highlight added");
            setTimeout(() => setJustSaved(false), 1200);
        } catch {
            toast.error("Failed to save highlight");
        } finally { setSaving(false); }
    };

    // Format text into paragraphs preserving words exactly
    const paragraphs = useMemo(() => {
        if (!text) return [];
        return text
            .split(/\n\s*\n+/)
            .map((p) => p.replace(/[ \t]*\n[ \t]*/g, " ").trim())
            .filter(Boolean);
    }, [text]);

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-[#0F1216] flex flex-col" data-testid="reader-overlay">
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 md:px-8 py-3 border-b border-[#1F262E] bg-[#14181C]/95 backdrop-blur">
                <button
                    onClick={onClose}
                    className="text-[#99AABB] hover:text-white transition p-1.5 rounded hover:bg-[#1B2228]"
                    aria-label="Close reader"
                    data-testid="reader-close-btn"
                >
                    <X size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#667788]">
                        {hasPdf ? "PDF · Native View" : sourceType === "text" ? "Pasted Text" : "Reading"}
                    </div>
                    <div className="text-sm text-white truncate font-medium" data-testid="reader-title">{title}</div>
                    {author && (
                        <div className="text-xs text-[#99AABB] italic truncate" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                            by {author}
                        </div>
                    )}
                </div>

                {/* Font size — only for text mode */}
                {!hasPdf && text && (
                    <div className="hidden md:flex items-center gap-1 bg-[#1B2228] border border-[#2C3440] rounded-full px-2 py-1" data-testid="reader-font-controls">
                        <button
                            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                            className="text-[#99AABB] hover:text-white p-1"
                            aria-label="Decrease font size"
                            data-testid="reader-font-smaller"
                        ><Minus size={12} /></button>
                        <span className="text-[10px] text-[#667788] tabular-nums w-6 text-center">{fontSize}</span>
                        <button
                            onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                            className="text-[#99AABB] hover:text-white p-1"
                            aria-label="Increase font size"
                            data-testid="reader-font-bigger"
                        ><PlusIcon size={12} /></button>
                    </div>
                )}

                {/* Open in new tab — only for PDF */}
                {hasPdf && (
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#40BCF4] hover:text-white transition border border-[#2C3440] px-3 py-1.5 rounded-full hover:bg-[#1B2228]"
                        data-testid="reader-open-new-tab"
                    >
                        <ArrowUpRight size={12} />
                        <span className="hidden sm:inline">New Tab</span>
                    </a>
                )}
            </div>

            {/* PDF hint bar */}
            {hasPdf && (
                <div className="px-4 md:px-8 py-1.5 text-[10px] uppercase tracking-[0.2em] text-[#667788] bg-[#14181C] border-b border-[#1F262E]" data-testid="reader-pdf-hint">
                    Original layout preserved · Copy any passage and paste it into the highlights box on the detail page
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-hidden relative">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-[#667788]" data-testid="reader-loading">Loading…</div>
                ) : hasPdf ? (
                    <iframe
                        src={pdfUrl + "#toolbar=1&view=FitH"}
                        title={title}
                        className="w-full h-full bg-white"
                        data-testid="reader-pdf-iframe"
                    />
                ) : text && text.trim() ? (
                    <div className="h-full overflow-y-auto" data-testid="reader-prose-scroll">
                        <div
                            ref={proseRef}
                            className="max-w-[68ch] mx-auto px-6 md:px-10 py-16 text-[#e5dccb] selection:bg-[#FFB800]/30 selection:text-white"
                            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize, lineHeight: 1.75 }}
                            data-testid="reader-prose"
                        >
                            <div className="mb-10 pb-6 border-b border-[#2C3440]">
                                <div className="text-[10px] uppercase tracking-[0.2em] text-[#667788] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                                    Pasted Text · Select any passage to add as highlight
                                </div>
                                <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight">{title}</h1>
                                {author && <div className="italic text-[#99AABB] mt-2">by {author}</div>}
                            </div>
                            {paragraphs.map((p, i) => (
                                <p key={i} className={`mb-6 ${i === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.9] first-letter:text-[#00E054]" : ""}`}>
                                    {p}
                                </p>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-[#667788] italic px-8 text-center" data-testid="reader-empty">
                        No readable content. Upload a PDF or paste text to enable the in-app reader.
                    </div>
                )}

                {/* Floating selection popup — text mode only */}
                {selection && !hasPdf && (
                    <button
                        onClick={saveHighlight}
                        disabled={saving}
                        className="fixed z-[110] -translate-x-1/2 -translate-y-full flex items-center gap-1.5 bg-[#00E054] text-[#14181C] font-medium text-xs px-3 py-2 rounded-full shadow-lg shadow-black/50 hover:bg-[#00c94a] transition"
                        style={{ left: selection.x, top: selection.y }}
                        data-testid="add-highlight-popup"
                    >
                        {justSaved ? <><Check size={13} weight="bold"/> Saved</> : <><Bookmark size={13} weight="fill"/> Add as highlight</>}
                    </button>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Reader;
