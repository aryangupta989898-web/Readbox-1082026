import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchList, updateList, removeReadingFromList, addReadingToList, fetchReadings } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, PencilSimple, X, Plus, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";

export const ListDetailPage = () => {
    const { id } = useParams();
    const nav = useNavigate();
    const [list, setList] = useState(null);
    const [allReadings, setAllReadings] = useState([]);
    const [editing, setEditing] = useState(false);
    const [titleDraft, setTitleDraft] = useState("");
    const [descDraft, setDescDraft] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [addQuery, setAddQuery] = useState("");

    const load = async () => {
        const l = await fetchList(id);
        setList(l);
        setTitleDraft(l.title || "");
        setDescDraft(l.description || "");
    };

    useEffect(() => { load(); fetchReadings().then(setAllReadings).catch(() => {}); /* eslint-disable-next-line */ }, [id]);

    if (!list) return <div className="max-w-4xl mx-auto p-12 text-[#99AABB]" data-testid="list-loading">Loading...</div>;

    const saveMeta = async () => {
        try {
            const updated = await updateList(id, { title: titleDraft.trim(), description: descDraft });
            setList({ ...list, ...updated });
            setEditing(false);
            toast.success("List updated");
        } catch { toast.error("Failed"); }
    };

    const removeReading = async (rid) => {
        await removeReadingFromList(id, rid);
        setList({ ...list, readings: list.readings.filter((r) => r.id !== rid), reading_ids: list.reading_ids.filter((x) => x !== rid) });
    };

    const addReading = async (rid) => {
        await addReadingToList(id, rid);
        const r = allReadings.find((x) => x.id === rid);
        if (r) setList({ ...list, readings: [...list.readings, r], reading_ids: [...list.reading_ids, rid] });
        toast.success("Added");
    };

    const existingIds = new Set(list.reading_ids || []);
    const addable = allReadings.filter((r) => !existingIds.has(r.id) && (
        !addQuery || (r.title || "").toLowerCase().includes(addQuery.toLowerCase()) || (r.author || "").toLowerCase().includes(addQuery.toLowerCase())
    ));

    return (
        <div className="pb-24" data-testid="list-detail-page">
            {/* Hero */}
            <div className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${list.cover_color}55 0%, #14181C 100%)` }}>
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <button onClick={() => nav("/lists")} className="text-xs text-[#99AABB] hover:text-white flex items-center gap-1 mb-6" data-testid="list-back-btn">
                        <ArrowLeft size={14} /> All Lists
                    </button>
                    {editing ? (
                        <div className="space-y-3 max-w-2xl">
                            <Input
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                className="bg-[#1B2228] border-[#2C3440] text-3xl font-heading font-bold"
                                data-testid="list-title-input"
                            />
                            <Textarea
                                value={descDraft}
                                onChange={(e) => setDescDraft(e.target.value)}
                                placeholder="Describe this list..."
                                className="bg-[#1B2228] border-[#2C3440]"
                                data-testid="list-desc-input"
                            />
                            <div className="flex gap-2">
                                <Button onClick={saveMeta} className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a]" data-testid="list-save-btn">Save</Button>
                                <Button variant="outline" onClick={() => { setEditing(false); setTitleDraft(list.title); setDescDraft(list.description || ""); }} className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="list-cancel-btn">Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="group max-w-3xl">
                            <div className="label-tag mb-2">List · {list.readings.length} readings</div>
                            <div className="flex items-start gap-3">
                                <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "Cormorant Garamond, serif", color: list.cover_color }} data-testid="list-title">
                                    {list.title}
                                </h1>
                                <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 text-[#667788] hover:text-white transition mt-3" data-testid="edit-list-btn">
                                    <PencilSimple size={18} />
                                </button>
                            </div>
                            {list.description && <p className="text-[#c8d3de] mt-3 leading-relaxed max-w-2xl">{list.description}</p>}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="label-tag">Readings in this list</div>
                    <Button onClick={() => setAddOpen((v) => !v)} className="bg-[#c8ae7d] text-[#14181C] hover:bg-[#d9c298]" data-testid="toggle-add-panel">
                        <Plus size={14} className="mr-1" /> {addOpen ? "Done" : "Add Readings"}
                    </Button>
                </div>

                {addOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-8 p-4 bg-[#1B2228] border border-[#c8ae7d]/40 rounded-lg" data-testid="add-panel">
                        <div className="relative mb-3">
                            <MagnifyingGlass size={14} color="#667788" className="absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={addQuery}
                                onChange={(e) => setAddQuery(e.target.value)}
                                placeholder="Search your readings to add..."
                                className="w-full bg-[#14181C] border border-[#2C3440] rounded-full pl-9 pr-3 py-2 text-sm text-white placeholder-[#667788] focus:outline-none focus:border-[#c8ae7d]"
                                data-testid="add-search-input"
                            />
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-72 overflow-y-auto">
                            {addable.map((r) => (
                                <button key={r.id} onClick={() => addReading(r.id)} className="group text-left" data-testid={`add-${r.id}`}>
                                    <div className="relative">
                                        <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" />
                                        <div className="absolute inset-0 bg-[#00E054]/0 group-hover:bg-[#00E054]/30 flex items-center justify-center transition">
                                            <Plus size={22} weight="bold" color="#fff" className="opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {addable.length === 0 && <div className="col-span-full text-[#667788] text-sm italic text-center py-6">{addQuery ? "No matches." : "All readings already in this list."}</div>}
                        </div>
                    </motion.div>
                )}

                {list.readings.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]">
                        Empty list. Click "Add Readings" to start curating.
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
                        {list.readings.map((r, i) => (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="relative group"
                                data-testid={`list-item-${r.id}`}
                            >
                                <div className="cursor-pointer" onClick={() => nav(`/readings/${r.id}`)}>
                                    <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" />
                                    <div className="mt-2 flex justify-center"><StarRating value={r.rating || 0} readOnly size={11} testId={`list-rating-${r.id}`} /></div>
                                </div>
                                <button
                                    onClick={() => removeReading(r.id)}
                                    className="absolute top-1 right-1 bg-black/70 backdrop-blur rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition"
                                    data-testid={`remove-list-item-${r.id}`}
                                    title="Remove from list"
                                >
                                    <X size={12} color="#fff" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
