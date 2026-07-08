import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

const PALETTE = ["#D9C7A0", "#C9B8E6", "#A8C5B5", "#E8B4A0", "#B5C7DE", "#E6C9A0", "#C7DEBB", "#DEB5C0"];

export const CreateListDialog = ({ open, onOpenChange, onSubmit }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(PALETTE[0]);

    const reset = () => { setTitle(""); setDescription(""); setColor(PALETTE[0]); };

    const submit = () => {
        if (!title.trim()) return;
        onSubmit({ title: title.trim(), description: description.trim(), cover_color: color });
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
            <DialogContent className="bg-[#1B2228] border-[#2C3440] text-white max-w-md" data-testid="create-list-dialog">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl">New List</DialogTitle>
                    <DialogDescription className="text-xs text-[#99AABB]">Give this collection a name and mood. You can add readings after.</DialogDescription>
                </DialogHeader>

                <div>
                    <div className="label-tag mb-1">Title</div>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Startup Founding Wisdom" className="bg-[#14181C] border-[#2C3440]" autoFocus data-testid="list-title-input-dialog" />
                </div>

                <div>
                    <div className="label-tag mb-1">Description</div>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional. What ties these readings together?" rows={2} className="bg-[#14181C] border-[#2C3440]" data-testid="list-desc-input-dialog" />
                </div>

                <div>
                    <div className="label-tag mb-2">Cover Palette</div>
                    <div className="flex gap-2 flex-wrap" data-testid="list-color-picker">
                        {PALETTE.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full transition-transform ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1B2228] scale-110" : "hover:scale-105"}`}
                                style={{ background: c }}
                                data-testid={`color-${c}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="cancel-list-btn">Cancel</Button>
                    <Button onClick={submit} disabled={!title.trim()} className="bg-[#c8ae7d] text-[#14181C] hover:bg-[#d9c298] font-semibold" data-testid="submit-list-btn">Create List</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
