import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchWishlist, deleteWishlist, convertWishlistToReading } from "../lib/api";
import { WishlistDialog } from "../components/WishlistDialog";
import { Button } from "../components/ui/button";
import { BookmarkSimple, Plus, Trash, ArrowRight, FilePdf } from "@phosphor-icons/react";
import { toast } from "sonner";

export const WishlistPage = () => {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const nav = useNavigate();

    const load = () => fetchWishlist().then(setItems).catch(() => {});
    useEffect(() => { load(); }, []);

    const remove = async (item) => {
        if (!confirm(`Remove "${item.title}" from wishlist?`)) return;
        await deleteWishlist(item.id);
        setItems(items.filter((x) => x.id !== item.id));
        toast.success("Removed");
    };

    const startReading = async (item) => {
        try {
            const reading = await convertWishlistToReading(item.id, "reading");
            setItems(items.filter((x) => x.id !== item.id));
            toast.success(`"${reading.title}" moved to Currently Reading`);
            nav(`/readings/${reading.id}`);
        } catch { toast.error("Failed to move"); }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12" data-testid="wishlist-page">
            <div className="flex items-end justify-between mb-10">
                <div>
                    <div className="label-tag mb-1 flex items-center gap-2"><BookmarkSimple size={12} weight="fill" color="#40BCF4" /> Future Reading</div>
                    <h1 className="font-heading text-4xl font-bold flex items-baseline gap-3">
                        <span>Wishlist</span>
                        <span className="text-[#40BCF4] text-2xl">{items.length}</span>
                    </h1>
                    <p className="text-[#99AABB] mt-2 text-sm max-w-xl">A quiet shelf for things you want to read next. Upload a PDF now or just jot down the title — promote it later when you're ready.</p>
                </div>
                <Button onClick={() => setOpen(true)} className="bg-[#40BCF4] text-[#14181C] hover:bg-[#2eabe4] rounded-full font-semibold" data-testid="new-wishlist-btn">
                    <Plus size={14} className="mr-1" weight="bold" /> Add to Wishlist
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]">
                    Nothing here yet. Add your first future read.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group flex items-center gap-4 p-4 rounded-lg border border-[#2C3440] bg-[#1B2228] hover:border-[#40BCF4]/50 transition"
                            data-testid={`wishlist-item-${item.id}`}
                        >
                            <div
                                className="w-12 h-16 rounded-sm flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${item.cover_color} 0%, ${item.cover_color}66 100%)` }}
                            >
                                <div className="absolute inset-0 grain" />
                                <BookmarkSimple size={18} color="#14181C" weight="fill" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-heading font-bold truncate" data-testid={`wishlist-title-${item.id}`}>{item.title}</div>
                                {item.author && <div className="text-xs text-[#99AABB] truncate italic" style={{ fontFamily: "Cormorant Garamond, serif" }}>by {item.author}</div>}
                                {item.notes && <div className="text-xs text-[#667788] mt-1 line-clamp-2">{item.notes}</div>}
                                {item.storage_path && (
                                    <div className="flex items-center gap-1 mt-1 text-[10px] uppercase tracking-widest text-[#FF8000]">
                                        <FilePdf size={10} weight="fill" /> PDF attached
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition">
                                <Button
                                    size="sm"
                                    onClick={() => startReading(item)}
                                    className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a]"
                                    data-testid={`start-reading-${item.id}`}
                                >
                                    Start Reading <ArrowRight size={12} className="ml-1" />
                                </Button>
                                <button
                                    onClick={() => remove(item)}
                                    className="text-[#667788] hover:text-red-400 transition p-2"
                                    data-testid={`delete-wishlist-${item.id}`}
                                    title="Remove"
                                >
                                    <Trash size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <WishlistDialog open={open} onOpenChange={setOpen} onCreated={(item) => setItems([item, ...items])} />
        </div>
    );
};
