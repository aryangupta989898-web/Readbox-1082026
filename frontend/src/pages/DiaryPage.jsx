import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchReadings } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { TagChip } from "../components/TagsPicker";
import { FilterBar, applyFilter } from "../components/FilterBar";
import { Heart, PencilSimple } from "@phosphor-icons/react";

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export const DiaryPage = () => {
    const [readings, setReadings] = useState([]);
    const [search, setSearch] = useState("");
    const [tag, setTag] = useState(null);
    const nav = useNavigate();

    useEffect(() => { fetchReadings().then(setReadings).catch(() => {}); }, []);

    const filtered = applyFilter(readings, search, tag);
    const grouped = useMemo(() => {
        const rows = [];
        let lastMonthKey = "";
        [...filtered]
            .sort((a, b) => (b.read_date || "").localeCompare(a.read_date || ""))
            .forEach((r) => {
                const d = new Date(r.read_date || r.created_at);
                const monthKey = `${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
                const showMonth = monthKey !== lastMonthKey;
                lastMonthKey = monthKey;
                rows.push({ ...r, _date: d, _showMonth: showMonth, _monthKey: `${d.getFullYear()}/${d.getMonth() + 1}` });
            });
        return rows;
    }, [filtered]);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12" data-testid="diary-page">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <div className="label-tag mb-1">Diary</div>
                    <h1 className="font-heading text-4xl font-bold">Everything you've read, in order.</h1>
                </div>
                <div className="label-tag hidden md:block">Sort by · Latest</div>
            </div>

            <FilterBar search={search} setSearch={setSearch} tag={tag} setTag={setTag} readings={readings} />

            <div className="border-t border-[#2C3440]">
                <div className="grid grid-cols-[80px_50px_1fr_100px_140px_80px] gap-4 py-3 label-tag border-b border-[#2C3440]">
                    <div>Month</div>
                    <div>Day</div>
                    <div>Reading</div>
                    <div>Year</div>
                    <div>Rating</div>
                    <div>Like</div>
                </div>

                {grouped.length === 0 && (
                    <div className="py-16 text-center text-[#99AABB]">No readings logged yet.</div>
                )}

                {grouped.map((r, i) => (
                    <motion.div
                        key={r.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.35 }}
                        className="grid grid-cols-[80px_50px_1fr_100px_140px_80px] gap-4 py-4 items-center border-b border-[#2C3440] hover:bg-[#1B2228] cursor-pointer transition-colors"
                        onClick={() => nav(`/readings/${r.id}`)}
                        data-testid={`diary-row-${r.id}`}
                    >
                        <div>
                            {r._showMonth ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); nav(`/recap/${r._date.getFullYear()}/${r._date.getMonth() + 1}`); }}
                                    className="bg-[#2C3440] hover:bg-[#3a4552] rounded px-2 py-1 text-center leading-tight w-fit transition"
                                    data-testid={`diary-month-${r.id}`}
                                >
                                    <div className="text-[10px] uppercase tracking-widest text-[#99AABB]">{MONTHS[r._date.getMonth()]}</div>
                                    <div className="text-[10px] text-[#667788]">{r._date.getFullYear()}</div>
                                </button>
                            ) : null}
                        </div>
                        <div className="font-heading text-xl text-[#99AABB]">{String(r._date.getDate()).padStart(2, "0")}</div>
                        <div className="flex items-center gap-3 min-w-0">
                            <Cover reading={r} title={r.title} color={r.cover_color} size="xs" />
                            <div className="min-w-0">
                                <div className="font-heading font-bold truncate">{r.title}</div>
                                {r.author && <div className="text-xs text-[#667788] truncate">{r.author}</div>}
                                {r.tags && r.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {r.tags.slice(0, 3).map((t, i) => <TagChip key={i} tag={t} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-sm text-[#99AABB]">{r._date.getFullYear()}</div>
                        <div><StarRating value={r.rating || 0} readOnly size={14} testId={`diary-rating-${r.id}`} /></div>
                        <div className="flex items-center gap-2 text-[#667788]">
                            <Heart size={16} weight={r.liked ? "fill" : "regular"} color={r.liked ? "#FF8000" : "#667788"} />
                            {r.review && <PencilSimple size={14} color="#40BCF4" />}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
