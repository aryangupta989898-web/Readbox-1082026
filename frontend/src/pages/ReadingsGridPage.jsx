import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchReadings, toggleLike } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { FilterBar, applyFilter } from "../components/FilterBar";
import { ProgressRing } from "../components/ProgressRing";
import { Heart, BookOpen } from "@phosphor-icons/react";
import { toast } from "sonner";

const SORTS = {
    latest: { label: "Latest read", fn: (a,b) => (b.read_date||"").localeCompare(a.read_date||"") },
    oldest: { label: "Oldest read", fn: (a,b) => (a.read_date||"").localeCompare(b.read_date||"") },
    rating_desc: { label: "Highest rated", fn: (a,b) => (b.rating||0) - (a.rating||0) },
    rating_asc: { label: "Lowest rated", fn: (a,b) => (a.rating||0) - (b.rating||0) },
    title: { label: "Title A→Z", fn: (a,b) => (a.title||"").localeCompare(b.title||"") },
};

export const ReadingsGridPage = () => {
    const [readings, setReadings] = useState([]);
    const [search, setSearch] = useState("");
    const [tag, setTag] = useState(null);
    const [sort, setSort] = useState("latest");
    const nav = useNavigate();

    useEffect(() => { fetchReadings().then(setReadings).catch(() => {}); }, []);

    const flipLike = async (e, r) => {
        e.stopPropagation();
        const next = !r.liked;
        setReadings((prev) => prev.map((x) => x.id === r.id ? { ...x, liked: next } : x));
        try { await toggleLike(r.id, next); }
        catch { toast.error("Failed to update like"); setReadings((prev) => prev.map((x) => x.id === r.id ? { ...x, liked: !next } : x)); }
    };

    const filteredAll = [...applyFilter(readings, search, tag)].sort(SORTS[sort].fn);
    const currentlyReading = filteredAll.filter((r) => r.status === "reading");
    const completed = filteredAll.filter((r) => r.status !== "reading");

    const renderTile = (r, i, keyPrefix) => (
        <motion.div
            key={r.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.4 }}
            whileHover={{ y: -8, scale: 1.05, transition: { duration: 0.2 } }}
            className="cursor-pointer group relative"
            onClick={() => nav(`/readings/${r.id}`)}
            data-testid={`${keyPrefix}-reading-${r.id}`}
        >
            <div className="cover-hover shadow-lg group-hover:shadow-[0_20px_50px_-20px_rgba(0,224,84,0.5)] transition-shadow relative">
                <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" size="md" />
                <button
                    onClick={(e) => flipLike(e, r)}
                    className={`absolute top-1.5 right-1.5 bg-black/60 backdrop-blur rounded-full p-1.5 transition ${r.liked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    data-testid={`grid-like-${r.id}`}
                    title={r.liked ? "Unlike" : "Like"}
                >
                    <Heart size={12} weight={r.liked ? "fill" : "regular"} color={r.liked ? "#FF2A79" : "#ffffff"} />
                </button>
                {r.status === "reading" && r.total_pages > 0 && (
                    <div className="absolute bottom-1.5 left-1.5" data-testid={`grid-progress-${r.id}`}>
                        <ProgressRing value={((r.pages_read || 0) / r.total_pages) * 100} size={30} stroke={3} color="#FF8000" track="#ffffff33" />
                    </div>
                )}
            </div>
            <div className="mt-2 flex justify-center">
                <StarRating value={r.rating || 0} readOnly size={12} testId={`grid-rating-${r.id}`} />
            </div>
        </motion.div>
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-12" data-testid="readings-page">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <div className="label-tag mb-1">Watched · Read</div>
                    <h1 className="font-heading text-4xl font-bold">{filteredAll.length} Readings</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="label-tag">Sort</span>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="bg-[#1B2228] border border-[#2C3440] rounded px-3 py-1.5 text-xs uppercase tracking-widest text-white focus:outline-none focus:border-[#00E054]"
                        data-testid="sort-select"
                    >
                        {Object.entries(SORTS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <FilterBar search={search} setSearch={setSearch} tag={tag} setTag={setTag} readings={readings} />

            {currentlyReading.length > 0 && (
                <section className="mb-10" data-testid="currently-reading-section">
                    <div className="flex items-center gap-3 mb-4">
                        <BookOpen size={14} color="#FF8000" weight="fill" />
                        <div className="label-tag text-[#FF8000]">Currently Reading · {currentlyReading.length}</div>
                        <div className="flex-1 h-px bg-[#2C3440]" />
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                        {currentlyReading.map((r, i) => renderTile(r, i, "reading"))}
                    </div>
                </section>
            )}

            <section data-testid="completed-section">
                {currentlyReading.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                        <div className="label-tag">Completed · {completed.length}</div>
                        <div className="flex-1 h-px bg-[#2C3440]" />
                    </div>
                )}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                    {completed.map((r, i) => renderTile(r, i, "grid"))}
                    {filteredAll.length === 0 && (
                        <div className="col-span-full py-24 text-center border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]">
                            {readings.length ? "No matches." : "No readings yet. Log your first one!"}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
