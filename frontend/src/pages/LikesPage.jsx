import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchReadings, toggleLike } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { Heart } from "@phosphor-icons/react";
import { toast } from "sonner";

export const LikesPage = () => {
    const [readings, setReadings] = useState([]);
    const nav = useNavigate();

    useEffect(() => { fetchReadings().then(setReadings).catch(() => {}); }, []);

    const liked = readings.filter((r) => r.liked);

    const unlike = async (e, r) => {
        e.stopPropagation();
        await toggleLike(r.id, false);
        setReadings(readings.map((x) => x.id === r.id ? { ...x, liked: false } : x));
        toast.success("Removed from likes");
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-12" data-testid="likes-page">
            <div className="mb-10">
                <div className="label-tag mb-1 flex items-center gap-2"><Heart size={12} weight="fill" color="#FF2A79" /> Your favorites</div>
                <h1 className="font-heading text-4xl font-bold flex items-baseline gap-3">
                    <span>Liked Readings</span>
                    <span className="text-[#FF2A79] text-2xl">{liked.length}</span>
                </h1>
                <p className="text-[#99AABB] mt-2 text-sm max-w-xl">The ones that stayed with you — a curated shelf of everything you've hearted.</p>
            </div>

            {liked.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]">
                    Nothing hearted yet. Tap the <Heart size={14} className="inline align-middle mx-1" weight="fill" color="#FF2A79" /> on any reading.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {liked.map((r, i) => (
                        <motion.div
                            key={r.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4 }}
                            whileHover={{ y: -8, scale: 1.05 }}
                            className="cursor-pointer group relative"
                            onClick={() => nav(`/readings/${r.id}`)}
                            data-testid={`liked-reading-${r.id}`}
                        >
                            <div className="cover-hover shadow-lg group-hover:shadow-[0_20px_50px_-20px_rgba(255,42,121,0.5)] transition-shadow relative">
                                <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" size="md" />
                                <button
                                    onClick={(e) => unlike(e, r)}
                                    className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
                                    data-testid={`unlike-btn-${r.id}`}
                                    title="Unlike"
                                >
                                    <Heart size={14} weight="fill" color="#FF2A79" />
                                </button>
                            </div>
                            <div className="mt-2 flex justify-center">
                                <StarRating value={r.rating || 0} readOnly size={12} testId={`liked-rating-${r.id}`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
