import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Copy, ArrowsClockwise, Download, Check, PuzzlePiece, Warning } from "@phosphor-icons/react";
import { api, API } from "../lib/api";
import { toast } from "sonner";

export const ExtensionDialog = ({ open, onOpenChange }) => {
    const [token, setToken] = useState("");
    const [backendUrl, setBackendUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [rotating, setRotating] = useState(false);
    const [showConfirmRotate, setShowConfirmRotate] = useState(false);

    useEffect(() => {
        if (!open) { setShowConfirmRotate(false); setCopied(false); return; }
        setLoading(true);
        api.get("/extension/setup")
            .then(({ data }) => {
                setToken(data.token);
                setBackendUrl(process.env.REACT_APP_BACKEND_URL || data.backend_url || "");
            })
            .catch(() => toast.error("Failed to load extension setup"))
            .finally(() => setLoading(false));
    }, [open]);

    const copy = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(`${label} copied`);
            setTimeout(() => setCopied(false), 1400);
        } catch { toast.error("Copy failed"); }
    };

    const rotate = async () => {
        if (!showConfirmRotate) { setShowConfirmRotate(true); return; }
        setRotating(true);
        try {
            const { data } = await api.post("/extension/setup/rotate");
            setToken(data.token);
            setShowConfirmRotate(false);
            toast.success("New token generated. Update your extension settings.");
        } catch { toast.error("Rotate failed"); }
        finally { setRotating(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1B2228] border-[#2C3440] text-white max-w-xl max-h-[90vh] overflow-y-auto" data-testid="extension-dialog">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl flex items-center gap-2">
                        <PuzzlePiece size={22} color="#00E054" weight="fill" /> Chrome Extension
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#99AABB]">
                        Save any article, essay, or PDF to Readbox with one click. Highlight passages from anywhere on the web.
                    </DialogDescription>
                </DialogHeader>

                {/* Download */}
                <div className="border border-[#2C3440] rounded-lg p-4">
                    <div className="label-tag mb-1">Step 1 — Download the extension</div>
                    <p className="text-xs text-[#99AABB] mb-3">Unpack the folder anywhere on your computer. It doesn't need updates while your Readbox is running.</p>
                    <a
                        href={`${API}/extension/download`}
                        className="inline-flex items-center gap-2 bg-[#00E054] text-[#14181C] hover:bg-[#00c94a] font-semibold text-sm px-4 py-2 rounded"
                        data-testid="extension-download-btn"
                        download
                    >
                        <Download size={14} weight="bold" /> Download readbox-extension.zip
                    </a>
                </div>

                {/* Install */}
                <div className="border border-[#2C3440] rounded-lg p-4">
                    <div className="label-tag mb-2">Step 2 — Load into Chrome / Edge / Brave</div>
                    <ol className="text-xs text-[#c8d3de] space-y-1 list-decimal pl-4 leading-relaxed">
                        <li>Unzip the file.</li>
                        <li>Open <code className="bg-[#14181C] px-1 rounded text-[#40BCF4]">chrome://extensions</code></li>
                        <li>Toggle <strong>Developer mode</strong> on (top-right).</li>
                        <li>Click <strong>Load unpacked</strong> and choose the unzipped folder.</li>
                        <li>The Readbox icon appears in your toolbar. Pin it for quick access.</li>
                    </ol>
                </div>

                {/* Token */}
                <div className="border border-[#2C3440] rounded-lg p-4">
                    <div className="label-tag mb-2">Step 3 — Paste this into the extension's Options</div>
                    <div className="space-y-2">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-[#667788] mb-1">Backend URL</div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={backendUrl}
                                    className="flex-1 bg-[#14181C] border border-[#2C3440] rounded px-3 py-2 text-xs font-mono text-[#40BCF4]"
                                    data-testid="extension-backend-url"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copy(backendUrl, "Backend URL")}
                                    className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]"
                                    data-testid="extension-copy-url"
                                ><Copy size={13} /></Button>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-[#667788] mb-1">Personal Token</div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={loading ? "Loading…" : token}
                                    className="flex-1 bg-[#14181C] border border-[#2C3440] rounded px-3 py-2 text-xs font-mono text-[#00E054]"
                                    data-testid="extension-token"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copy(token, "Token")}
                                    disabled={loading}
                                    className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]"
                                    data-testid="extension-copy-token"
                                >
                                    {copied ? <Check size={13} color="#00E054" weight="bold" /> : <Copy size={13} />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    {showConfirmRotate && (
                        <div className="mt-3 flex gap-2 items-start p-2 border border-[#FF8000]/40 bg-[#FF8000]/10 rounded text-xs text-[#e8c99e]" data-testid="rotate-warn">
                            <Warning size={14} color="#FF8000" weight="fill" className="mt-0.5 shrink-0" />
                            <span>Rotating replaces your current token. Any device using the old one will need the new value.</span>
                        </div>
                    )}
                    <div className="mt-3 flex justify-between items-center">
                        <button
                            onClick={rotate}
                            disabled={rotating || loading}
                            className="text-xs text-[#99AABB] hover:text-white flex items-center gap-1 transition"
                            data-testid="rotate-token-btn"
                        >
                            <ArrowsClockwise size={12} />
                            {rotating ? "Rotating…" : showConfirmRotate ? "Confirm rotate" : "Rotate token"}
                        </button>
                    </div>
                </div>

                {/* How it feels */}
                <div className="border border-[#2C3440] rounded-lg p-4 bg-[#14181C]/40">
                    <div className="label-tag mb-2">Once connected you can</div>
                    <ul className="text-xs text-[#c8d3de] space-y-1 list-disc pl-4 leading-relaxed">
                        <li>Click the toolbar icon on any article → <strong className="text-[#00E054]">Save Reading</strong>. Text is auto-extracted.</li>
                        <li>Select any passage on any webpage → a floating <strong className="text-[#00E054]">Save to Readbox</strong> button appears. One click.</li>
                        <li>Right-click any selection → <strong>Save selection as Readbox highlight</strong>.</li>
                    </ul>
                </div>

                <div className="text-[10px] text-[#667788] leading-relaxed">
                    Works offline of the LLM budget — the extension only calls Readbox's own CRUD API. AI synopsis and quiz features are only triggered inside the web app when you click Generate.
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ExtensionDialog;
