import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchLists, createList, deleteList } from "../lib/api";
import { CreateListDialog } from "../components/CreateListDialog";
import { Cover } from "../components/Cover";
import { Plus, Trash, Stack } from "@phosphor-icons/react";
import { toast } from "sonner";

// Dune-style pastel mosaic tile — shows up to 4 preview covers as a 2x2 grid
const ListCard = ({ list, onOpen, onDelete }) => {
    const previews = list.preview || [];
    return (
        <motion.div
            layout
            whileHover={{ y: -6, rotate: -0.4 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={onOpen}
            className="relative cursor-pointer group rounded-xl overflow-hidden shadow-xl"
            style={{ background: `linear-gradient(155deg, ${list.cover_color} 0%, ${list.cover_color}CC 55%, #14181C 100%)` }}
            data-testid={`list-card-${list.id}`}
        >
            {/* grain overlay */}
            <div className="absolute inset-0 grain opacity-30 pointer-events-none" />
            <div className="p-5 flex flex-col gap-4 h-full">
                <div className="flex items-start justify-between">
                    <Stack size={22} weight="fill" color="#14181C" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(list); }}
                        className="opacity-0 group-hover:opacity-100 text-[#14181C]/60 hover:text-red-600 transition"
                        data-testid={`delete-list-${list.id}`}
                    >
                        <Trash size={16} />
                    </button>
                </div>
                <div className="mt-auto">
                    <div className="grid grid-cols-4 gap-1.5 mb-4 h-24">
                        {previews.length > 0 ? previews.map((r, i) => (
                            <div key={r.id} className="rounded-sm overflow-hidden shadow-md" style={{ transform: `rotate(${(i - 1.5) * 2}deg)` }}>
                                <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-full" showFallback />
                            </div>
                        )) : (
                            <div className="col-span-4 flex items-center justify-center text-[#14181C]/50 text-xs italic border border-dashed border-[#14181C]/30 rounded">Empty list</div>
                        )}
                    </div>
                    <div className="font-heading font-bold text-xl text-[#14181C] leading-tight tracking-tight" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                        {list.title}
                    </div>
                    {list.description && (
                        <div className="text-xs text-[#14181C]/70 line-clamp-2 mt-1">{list.description}</div>
                    )}
                    <div className="mt-2 text-[10px] uppercase tracking-widest text-[#14181C]/60">{list.count || 0} {list.count === 1 ? "reading" : "readings"}</div>
                </div>
            </div>
        </motion.div>
    );
};

export const ListsPage = () => {
    const [lists, setLists] = useState([]);
    const [open, setOpen] = useState(false);
    const nav = useNavigate();

    const load = () => fetchLists().then(setLists).catch(() => {});
    useEffect(() => { load(); }, []);

    const create = async (payload) => {
        try {
            const created = await createList(payload);
            setLists([{ ...created, preview: [], count: (payload.reading_ids || []).length }, ...lists]);
            toast.success("List created");
            setOpen(false);
        } catch { toast.error("Failed to create list"); }
    };

    const remove = async (list) => {
        if (!confirm(`Delete "${list.title}"?`)) return;
        await deleteList(list.id);
        setLists(lists.filter((l) => l.id !== list.id));
        toast.success("List deleted");
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-12" data-testid="lists-page">
            <div className="flex items-end justify-between mb-10">
                <div>
                    <div className="label-tag mb-1">Curated · Yours</div>
                    <h1 className="font-heading text-4xl font-bold flex items-baseline gap-3">
                        <span>Lists</span>
                        <span className="text-[#c8ae7d] text-2xl">{lists.length}</span>
                    </h1>
                    <p className="text-[#99AABB] mt-2 text-sm max-w-xl">Curate your readings into constellations — thematic collections, syllabi, canonical works. Give each list a soul.</p>
                </div>
                <button
                    onClick={() => setOpen(true)}
                    className="rounded-full bg-[#c8ae7d] text-[#14181C] hover:bg-[#d9c298] font-semibold px-4 py-2 text-sm flex items-center gap-2 transition"
                    data-testid="new-list-btn"
                >
                    <Plus size={14} weight="bold" /> New List
                </button>
            </div>

            {lists.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]">
                    No lists yet. Create your first curated shelf.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {lists.map((l, i) => (
                        <motion.div
                            key={l.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <ListCard list={l} onOpen={() => nav(`/lists/${l.id}`)} onDelete={remove} />
                        </motion.div>
                    ))}
                </div>
            )}

            <CreateListDialog open={open} onOpenChange={setOpen} onSubmit={create} />
        </div>
    );
};
