import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchReadings } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { ArrowLeft } from "@phosphor-icons/react";

export const AuthorPage = () => {
    const { name } = useParams();
    const nav = useNavigate();
    const [readings, setReadings] = useState([]);
    const authorName = decodeURIComponent(name || "");

    useEffect(() => { fetchReadings().then(setReadings).catch(() => {}); }, []);

    const authorReadings = useMemo(
        () => readings
            .filter((r) => (r.author || "").trim().toLowerCase() === authorName.trim().toLowerCase())
            .sort((a, b) => (b.read_date || "").localeCompare(a.read_date || "")),
        [readings, authorName],
    );

    const ratedCount = authorReadings.filter((r) => r.rating).length;
    const avg = ratedCount ? authorReadings.reduce((s, r) => s + (r.rating || 0), 0) / ratedCount : 0;
    const liked = authorReadings.filter((r) => r.liked).length;

    return (
        <div className="max-w-5xl mx-auto px-6 py-12" data-testid="author-page">
            <button onClick={() => nav(-1)} className="text-xs text-[#99AABB] hover:text-white flex items-center gap-1 mb-6" data-testid="author-back-btn">
                <ArrowLeft size={14}/> Back
            </button>

            <div className="mb-10 border-b border-[#2C3440] pb-8">
                <div className="label-tag mb-2">Author</div>
                <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight" data-testid="author-name" style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>
                    {authorName}
                </h1>
                <div className="mt-6 flex gap-8 text-sm">
                    <div><span className="text-[#667788] uppercase tracking-widest text-[10px] block">Readings</span><span className="font-heading text-2xl">{authorReadings.length}</span></div>
                    <div><span className="text-[#667788] uppercase tracking-widest text-[10px] block">Avg Rating</span><span className="font-heading text-2xl">{avg.toFixed(1)}</span></div>
                    <div><span className="text-[#667788] uppercase tracking-widest text-[10px] block">Liked</span><span className="font-heading text-2xl">{liked}</span></div>
                </div>
            </div>

            {authorReadings.length === 0 ? (
                <div className="py-16 text-center text-[#99AABB]">No readings from this author yet.</div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
                    {authorReadings.map((r, i) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -6, scale: 1.04 }}
                            className="cursor-pointer group"
                            onClick={() => nav(`/readings/${r.id}`)}
                            data-testid={`author-reading-${r.id}`}
                        >
                            <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" size="md" />
                            <div className="mt-2 text-xs font-heading font-semibold text-white truncate">{r.title}</div>
                            <div className="mt-1 flex justify-center"><StarRating value={r.rating || 0} readOnly size={10} testId={`author-rating-${r.id}`} /></div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
