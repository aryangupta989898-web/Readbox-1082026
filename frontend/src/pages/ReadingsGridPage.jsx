import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchReadings } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { FilterBar, applyFilter } from "../components/FilterBar";

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

    const filtered = [...applyFilter(readings, search, tag)].sort(SORTS[sort].fn);

    return (
        <div className="max-w-6xl mx-auto px-6 py-12" data-testid="readings-page">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <div className="label-tag mb-1">Watched · Read</div>
                    <h1 className="font-heading text-4xl font-bold">{filtered.length} Readings</h1>
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

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                {filtered.map((r, i) => (
                    <motion.div
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.4 }}
                        whileHover={{ y: -8, scale: 1.05, transition: { duration: 0.2 } }}
                        className="cursor-pointer group"
                        onClick={() => nav(`/readings/${r.id}`)}
                        data-testid={`grid-reading-${r.id}`}
                    >
                        <div className="cover-hover shadow-lg group-hover:shadow-[0_20px_50px_-20px_rgba(0,224,84,0.5)] transition-shadow">
                            <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" size="md" />
                        </div>
                        <div className="mt-2 flex justify-center">
                            <StarRating value={r.rating || 0} readOnly size={12} testId={`grid-rating-${r.id}`} />
                        </div>
                    </motion.div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-full py-24 text-center border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]">
                        {readings.length ? "No matches." : "No readings yet. Log your first one!"}
                    </div>
                )}
            </div>
        </div>
    );
};
