import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ClipboardText } from "@phosphor-icons/react";
import { toast } from "sonner";

export const PasteSummaryDialog = ({ open, onOpenChange, currentSynopsis, onSave }) => {
    const [text, setText] = useState(currentSynopsis || "");
    const [saving, setSaving] = useState(false);

    React.useEffect(() => { if (open) setText(currentSynopsis || ""); }, [open, currentSynopsis]);

    const submit = async () => {
        const value = text.trim();
        if (!value) { toast.error("Paste your summary first"); return; }
        setSaving(true);
        try {
            await onSave(value);
            toast.success("Summary saved");
            onOpenChange(false);
        } catch {
            toast.error("Failed to save summary");
        } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1B2228] border-[#2C3440] text-white max-w-2xl" data-testid="paste-summary-dialog">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl flex items-center gap-2">
                        <ClipboardText size={22} color="#00E054" weight="fill" /> Paste Your Own Summary
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#99AABB]">
                        Skip the AI. Paste a summary you've written or copied. It replaces the current synopsis for this reading.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your summary here…"
                    rows={12}
                    className="bg-[#14181C] border-[#2C3440] leading-relaxed text-[15px]"
                    autoFocus
                    data-testid="paste-summary-input"
                />
                <div className="text-[10px] uppercase tracking-widest text-[#667788]">
                    {text.trim().split(/\s+/).filter(Boolean).length} words
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="paste-summary-cancel">Cancel</Button>
                    <Button onClick={submit} disabled={saving} className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a] font-semibold" data-testid="paste-summary-save">
                        {saving ? "Saving…" : "Save Summary"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PasteSummaryDialog;
