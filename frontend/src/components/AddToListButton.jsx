import React, { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { fetchLists, addReadingToList, createList } from "../lib/api";
import { Stack, Plus, Check } from "@phosphor-icons/react";
import { toast } from "sonner";

export const AddToListButton = ({ readingId, testId = "add-to-list-btn" }) => {
    const [open, setOpen] = useState(false);
    const [lists, setLists] = useState([]);
    const [pendingIds, setPendingIds] = useState(new Set());
    const [newTitle, setNewTitle] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (open) fetchLists().then(setLists).catch(() => {});
    }, [open]);

    const inList = (l) => (l.reading_ids || []).includes(readingId) || pendingIds.has(l.id);

    const addTo = async (l) => {
        if (inList(l)) return;
        setPendingIds(new Set([...pendingIds, l.id]));
        try {
            await addReadingToList(l.id, readingId);
            toast.success(`Added to "${l.title}"`);
        } catch { toast.error("Failed"); setPendingIds((p) => { const n = new Set(p); n.delete(l.id); return n; }); }
    };

    const quickCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const list = await createList({ title: newTitle.trim(), reading_ids: [readingId] });
            setLists([{ ...list, count: 1, preview: [] }, ...lists]);
            setPendingIds(new Set([...pendingIds, list.id]));
            setNewTitle("");
            toast.success(`Created "${list.title}"`);
        } catch { toast.error("Failed"); }
        finally { setCreating(false); }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440] text-xs" data-testid={testId}>
                    <Stack size={14} className="mr-1" /> Add to List
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-[#1B2228] border-[#2C3440] text-white p-3" align="end" data-testid="add-to-list-popover">
                <div className="label-tag mb-2">Your Lists</div>
                <div className="max-h-56 overflow-y-auto space-y-1 mb-3">
                    {lists.length === 0 && <div className="text-xs text-[#667788] italic">No lists yet — create one below.</div>}
                    {lists.map((l) => (
                        <button
                            key={l.id}
                            onClick={() => addTo(l)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-left text-sm hover:bg-[#2C3440] transition ${inList(l) ? "opacity-50" : ""}`}
                            data-testid={`add-to-list-item-${l.id}`}
                            disabled={inList(l)}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: l.cover_color }} />
                                <span className="truncate">{l.title}</span>
                            </div>
                            {inList(l) && <Check size={14} color="#00E054" weight="bold" />}
                        </button>
                    ))}
                </div>
                <div className="border-t border-[#2C3440] pt-3">
                    <div className="label-tag mb-2">Create new list</div>
                    <div className="flex gap-2">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && quickCreate()}
                            placeholder="List name"
                            className="bg-[#14181C] border-[#2C3440] text-sm h-8"
                            data-testid="quick-list-title-input"
                        />
                        <Button size="sm" onClick={quickCreate} disabled={!newTitle.trim() || creating} className="bg-[#c8ae7d] text-[#14181C] hover:bg-[#d9c298] h-8" data-testid="quick-create-list-btn">
                            <Plus size={12} weight="bold" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
