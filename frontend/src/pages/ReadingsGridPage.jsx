import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchReadings } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { FilterBar, applyFilter } from "../components/FilterBar";

export const ReadingsGridPage = () => {
    const [readings, setReadings] = useState([]);
    const [search, setSearch] = useState("");
    const [tag, setTag] = useState(null);
    const nav = useNavigate();

    useEffect(() => { fetchReadings().then(setReadings).catch(() => {}); }, []);

    const filtered = applyFilter(readings, search, tag);

    return (
        <div className="max-w-6xl mx-auto px-6 py-12" data-testid="readings-page">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <div className="label-tag mb-1">Watched · Read</div>
                    <h1 className="font-heading text-4xl font-bold">{filtered.length} Readings</h1>
                </div>
                <div className="label-tag">Sort by · Latest</div>
            </div>

            <FilterBar search={search} setSearch={setSearch} tag={tag} setTag={setTag} readings={readings} />

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {filtered.map((r, i) => (
                    <motion.div
                        key={r.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.4 }}
                        whileHover={{ y: -6 }}
                        className="cursor-pointer group"
                        onClick={() => nav(`/readings/${r.id}`)}
                        data-testid={`grid-reading-${r.id}`}
                    >
                        <div className="cover-hover">
                            <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" size="md" />
                        </div>
                        <div className="mt-2 flex justify-center">
                            <StarRating value={r.rating || 0} readOnly size={12} testId={`grid-rating-${r.id}`} />
                        </div>
                    </motion.div>
                ))}
                {filtered.length === 0 && (
                    <div className="col-span-6 py-24 text-center border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]">
                        {readings.length ? "No matches." : "No readings yet. Log your first one!"}
                    </div>
                )}
            </div>
        </div>
    );
};
