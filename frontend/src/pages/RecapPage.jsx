import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchRecap, fetchRecapMonths } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { TagChip } from "../components/TagsPicker";
import { Button } from "../components/ui/button";
import { CaretLeft, CaretRight, Share, TwitterLogo, LinkedinLogo, Quotes, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const RecapPage = () => {
    const { year, month } = useParams();
    const nav = useNavigate();
    const [data, setData] = useState(null);
    const [months, setMonths] = useState([]);
    const y = parseInt(year); const m = parseInt(month);

    useEffect(() => {
        fetchRecap(y, m).then(setData);
        fetchRecapMonths().then(setMonths);
    }, [y, m]);

    const prevMonth = () => {
        const d = new Date(y, m - 2, 1);
        nav(`/recap/${d.getFullYear()}/${d.getMonth() + 1}`);
    };
    const nextMonth = () => {
        const d = new Date(y, m, 1);
        nav(`/recap/${d.getFullYear()}/${d.getMonth() + 1}`);
    };

    const share = (platform) => {
        const text = `In ${MONTH_NAMES[m-1]} ${y} I read ${data?.total_readings || 0} pieces & saved ${data?.total_highlights || 0} highlights on Readbox 📚`;
        const url = window.location.href;
        const links = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            copy: null,
        };
        if (platform === "copy") {
            navigator.clipboard.writeText(`${text} ${url}`);
            toast.success("Copied!");
        } else {
            window.open(links[platform], "_blank");
        }
    };

    if (!data) return <div className="max-w-4xl mx-auto p-12 text-[#99AABB]">Loading recap...</div>;

    const monthName = MONTH_NAMES[m - 1];

    return (
        <div className="relative overflow-hidden" data-testid="recap-page">
            {/* Ambient gradient orbs */}
            <motion.div
                className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, #00E05433 0%, transparent 70%)", filter: "blur(60px)" }}
                animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-40 right-1/4 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, #FF800033 0%, transparent 70%)", filter: "blur(60px)" }}
                animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative max-w-4xl mx-auto px-6 py-16">
                {/* Header + month nav */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-2">
                    <button onClick={prevMonth} className="text-[#99AABB] hover:text-white p-2" data-testid="prev-month-btn"><CaretLeft size={22} /></button>
                    <div className="label-tag" data-testid="recap-label">Reading Recap</div>
                    <button onClick={nextMonth} className="text-[#99AABB] hover:text-white p-2" data-testid="next-month-btn"><CaretRight size={22} /></button>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30, letterSpacing: "0.1em" }}
                    animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="font-heading text-7xl md:text-8xl font-bold text-center mb-2"
                    data-testid="recap-heading"
                >
                    {monthName}
                </motion.h1>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="text-center label-tag text-[#00E054] mb-16"
                >
                    · {y} ·
                </motion.div>

                {/* Big stats */}
                <div className="grid grid-cols-3 gap-6 mb-16">
                    <StatReveal label="Readings" value={data.total_readings} color="#00E054" delay={0.5} />
                    <StatReveal label="Highlights" value={data.total_highlights} color="#FF8000" delay={0.7} />
                    <StatReveal label="Reading Days" value={data.unique_days} color="#40BCF4" delay={0.9} />
                </div>

                {data.total_readings === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-center py-16 border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]" data-testid="recap-empty">
                        No readings this month. Time to log some!
                    </motion.div>
                ) : (
                    <>
                        {/* Top rated */}
                        {data.top_readings.length > 0 && (
                            <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
                                <h2 className="font-heading text-2xl mb-6">Standouts</h2>
                                <div className="grid grid-cols-3 gap-6">
                                    {data.top_readings.map((r, i) => (
                                        <motion.div
                                            key={r.id}
                                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                            whileHover={{ y: -6 }}
                                            className="cursor-pointer"
                                            onClick={() => nav(`/readings/${r.id}`)}
                                            data-testid={`recap-top-${r.id}`}
                                        >
                                            <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" size="lg" />
                                            <div className="mt-3 font-heading font-bold truncate">{r.title}</div>
                                            <div className="mt-1"><StarRating value={r.rating} readOnly size={12} testId={`recap-star-${r.id}`} /></div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Top tags */}
                        {data.top_tags.length > 0 && (
                            <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
                                <h2 className="font-heading text-2xl mb-6">Themes</h2>
                                <div className="flex flex-wrap gap-3">
                                    {data.top_tags.map((t, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <TagChip tag={t} size="lg" />
                                                <span className="text-xs text-[#667788]">× {t.count}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Highlights carousel */}
                        {data.top_highlights.length > 0 && (
                            <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
                                <h2 className="font-heading text-2xl mb-6">Quoted this month</h2>
                                <div className="space-y-4">
                                    {data.top_highlights.map((h, i) => (
                                        <motion.div
                                            key={h.id}
                                            initial={{ opacity: 0, x: -30 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.15, duration: 0.6 }}
                                            className="relative p-6 rounded-lg border border-[#2C3440] bg-[#1B2228]/50"
                                            data-testid={`recap-highlight-${h.id}`}
                                        >
                                            <Quotes size={28} color="#FF8000" weight="fill" className="absolute -top-3 -left-3 bg-[#14181C] rounded-full p-1" />
                                            <p className="font-heading text-lg text-[#c8d3de] italic leading-relaxed">{h.text}</p>
                                            <div className="mt-3 label-tag text-[#00E054]">— {h.reading_title}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* All readings mosaic */}
                        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16">
                            <h2 className="font-heading text-2xl mb-6">Everything ({data.readings.length})</h2>
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {data.readings.map((r, i) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: Math.min(i * 0.03, 0.6), duration: 0.4 }}
                                        whileHover={{ y: -4, rotate: [-2, 2, 0][i % 3] }}
                                        className="cursor-pointer"
                                        onClick={() => nav(`/readings/${r.id}`)}
                                    >
                                        <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" size="sm" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>

                        {/* Share */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center py-8 border-t border-[#2C3440]" data-testid="share-block">
                            <Sparkle size={20} color="#00E054" weight="fill" className="mx-auto mb-3" />
                            <div className="font-heading text-2xl mb-1">Share your month</div>
                            <div className="text-sm text-[#99AABB] mb-6">Let people see what you've been reading.</div>
                            <div className="flex justify-center gap-3">
                                <Button onClick={() => share("twitter")} className="bg-[#40BCF4] text-[#14181C] hover:bg-[#2eabe4] font-semibold" data-testid="share-twitter"><TwitterLogo size={16} weight="fill" className="mr-2" />Twitter</Button>
                                <Button onClick={() => share("linkedin")} className="bg-[#0A66C2] text-white hover:bg-[#0952a0] font-semibold" data-testid="share-linkedin"><LinkedinLogo size={16} weight="fill" className="mr-2" />LinkedIn</Button>
                                <Button onClick={() => share("copy")} variant="outline" className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="share-copy"><Share size={16} className="mr-2" />Copy Link</Button>
                            </div>
                        </motion.div>
                    </>
                )}

                {/* Available months chips */}
                {months.length > 0 && (
                    <div className="mt-16">
                        <div className="label-tag mb-3">Available Months</div>
                        <div className="flex flex-wrap gap-2">
                            {months.map((mo) => {
                                const [yy, mm] = mo.split("-");
                                const isActive = parseInt(yy) === y && parseInt(mm) === m;
                                return (
                                    <button
                                        key={mo}
                                        onClick={() => nav(`/recap/${yy}/${parseInt(mm)}`)}
                                        className={`text-xs uppercase tracking-widest px-3 py-1 rounded-full border transition ${isActive ? "border-[#00E054] text-[#00E054]" : "border-[#2C3440] text-[#99AABB] hover:text-white"}`}
                                        data-testid={`month-${mo}`}
                                    >
                                        {MONTH_NAMES[parseInt(mm) - 1].slice(0,3)} {yy}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatReveal = ({ label, value, color, delay }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        const start = performance.now() + delay * 1000;
        let raf;
        const tick = (t) => {
            if (t < start) { raf = requestAnimationFrame(tick); return; }
            const p = Math.min(1, (t - start) / 900);
            setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, delay]);
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.7 }}
            className="text-center"
            data-testid={`stat-${label.toLowerCase()}`}
        >
            <div className="font-heading font-bold text-6xl md:text-7xl" style={{ color }}>{display}</div>
            <div className="label-tag mt-2">{label}</div>
        </motion.div>
    );
};
