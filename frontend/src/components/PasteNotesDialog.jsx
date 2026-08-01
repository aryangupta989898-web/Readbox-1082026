import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ClipboardText, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";

/**
 * PasteNotesDialog — lets the user paste their own notes for a reading.
 * Two states:
 *  - No existing notes: straightforward paste-and-save.
 *  - Existing notes: shows a warning banner that saving will REPLACE them.
 */
export const PasteNotesDialog = ({ open, onOpenChange, hasExisting, onSave }) => {
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        if (open) { setText(""); setConfirmed(false); }
    }, [open]);

    const submit = async () => {
        const value = text.trim();
        if (!value) { toast.error("Paste your notes first"); return; }
        if (hasExisting && !confirmed) { setConfirmed(true); return; }
        setSaving(true);
        try {
            await onSave(value);
            toast.success("Notes saved");
            onOpenChange(false);
        } catch {
            toast.error("Failed to save notes");
        } finally { setSaving(false); }
    };

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1B2228] border-[#2C3440] text-white max-w-2xl" data-testid="paste-notes-dialog">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl flex items-center gap-2">
                        <ClipboardText size={22} color="#00E054" weight="fill" /> Paste Your Own Notes
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#99AABB]">
                        Skip the AI. Paste notes you've written or summarize the reading in your own words.
                    </DialogDescription>
                </DialogHeader>

                {hasExisting && (
                    <div className="flex gap-2 items-start p-3 border border-[#FF8000]/40 bg-[#FF8000]/10 rounded" data-testid="notes-replace-warning">
                        <Warning size={18} color="#FF8000" weight="fill" className="mt-0.5 shrink-0" />
                        <div className="text-xs text-[#e8c99e] leading-relaxed">
                            You already have notes for this reading. Saving will <strong className="text-[#FF8000]">replace</strong> them completely.
                            {confirmed && <div className="mt-1 text-[#FFB800]">Click Save again to confirm.</div>}
                        </div>
                    </div>
                )}

                <Textarea
                    value={text}
                    onChange={(e) => { setText(e.target.value); setConfirmed(false); }}
                    placeholder="Paste your notes here…"
                    rows={12}
                    className="bg-[#14181C] border-[#2C3440] leading-relaxed text-[15px]"
                    autoFocus
                    data-testid="paste-notes-input"
                />
                <div className="text-[10px] uppercase tracking-widest text-[#667788]">{wordCount} words</div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]"
                        data-testid="paste-notes-cancel"
                    >Cancel</Button>
                    <Button
                        onClick={submit}
                        disabled={saving}
                        className={`font-semibold ${hasExisting && confirmed ? "bg-[#FF8000] text-white hover:bg-[#e67300]" : "bg-[#00E054] text-[#14181C] hover:bg-[#00c94a]"}`}
                        data-testid="paste-notes-save"
                    >
                        {saving ? "Saving…" : hasExisting && confirmed ? "Confirm Replace" : hasExisting ? "Replace Notes" : "Save Notes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PasteNotesDialog;
