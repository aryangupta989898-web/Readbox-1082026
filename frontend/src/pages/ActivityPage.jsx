import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchActivity, fetchReadings } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { TagChip } from "../components/TagsPicker";
import { BookOpen, Highlighter, Clock, Sparkle } from "@phosphor-icons/react";

const WELCOMES = [
    { pre: "Nice to see", ink: "you back." },
    { pre: "Fresh page,", ink: "fresh you." },
    { pre: "Take your", ink: "time today." },
    { pre: "The shelf is", ink: "always waiting." },
    { pre: "A quiet corner", ink: "for you." },
    { pre: "Some pages", ink: "found you." },
    { pre: "Glad you", ink: "wandered in." },
    { pre: "The margin is", ink: "yours to fill." },
    { pre: "Curl up.", ink: "Stay a while." },
    { pre: "Something", ink: "worth reading." },
];

const AVG_PAGES = 15;

const Sparkline = ({ data }) => {
    const max = Math.max(1, ...data);
    const w = 64, h = 14;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`).join(" ");
    return (
        <svg width={w} height={h} className="opacity-80">
            <polyline points={pts} fill="none" stroke="#00E054" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export const ActivityPage = ({ onLog }) => {
    const [data, setData] = useState(null);
    const [readings, setReadings] = useState([]);
    const [welcome] = useState(() => WELCOMES[Math.floor(Math.random() * WELCOMES.length)]);
    const nav = useNavigate();

    useEffect(() => {
        fetchActivity().then(setData).catch(() => {});
        fetchReadings().then(setReadings).catch(() => {});
    }, []);

    const { weekReadings, weekDays, weekPages, topTags, staleReading } = useMemo(() => {
        const now = new Date();
        const dow = now.getDay();
        const monday = new Date(now); monday.setDate(now.getDate() - ((dow + 6) % 7)); monday.setHours(0,0,0,0);
        const daily = [0,0,0,0,0,0,0];
        let count = 0;
        const tagFreq = {};
        readings.forEach((r) => {
            const d = new Date(r.read_date);
            if (d >= monday) {
                const idx = (d.getDay() + 6) % 7;
                daily[idx] += 1; count += 1;
            }
            (r.tags || []).forEach((t) => { tagFreq[t.name] = (tagFreq[t.name] || 0) + 1; });
        });
        // stalest: oldest read_date reading (that has one)
        const sorted = [...readings].sort((a,b) => (a.read_date||"").localeCompare(b.read_date||""));
        return {
            weekReadings: count,
            weekDays: daily,
            weekPages: count * AVG_PAGES,
            topTags: Object.entries(tagFreq).sort((a,b) => b[1]-a[1]).slice(0,5).map(([n,c]) => ({ name: n, count: c, ...(readings.flatMap(r => r.tags || []).find(t => t.name === n) || {}) })),
            staleReading: sorted[0],
        };
    }, [readings]);

    return (
        <div className="max-w-6xl mx-auto px-6 py-12" data-testid="activity-page">
            {/* Top row: label + weekly pages counter */}
            <div className="flex items-start justify-between mb-8">
                <div className="label-tag">Your Archive</div>
                <div className="text-right" data-testid="weekly-counter">
                    <div className="flex items-baseline gap-1 justify-end">
                        <span className="font-heading text-2xl font-bold text-white">{weekPages}</span>
                        <span className="text-xs uppercase tracking-widest text-[#99AABB]">pages</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-[#667788]">this week</div>
                    <div className="mt-1 flex justify-end"><Sparkline data={weekDays} /></div>
                </div>
            </div>

            {/* Hero welcome — ink-bleed animation on the italic phrase, matching brand */}
            <div className="mb-14">
                <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight leading-tight" data-testid="welcome-heading">
                    <span className="text-white">{welcome.pre}</span>{" "}
                    <InkBleed text={welcome.ink} />
                </h1>
                <p className="text-[#99AABB] mt-4 text-sm max-w-xl leading-relaxed">
                    Log articles, PDFs and papers. Let AI extract topics, generate essay-form notes, and drill your highlights via spaced repetition.
                </p>
            </div>

            {/* Stats — same treatment as before */}
            <div className="grid grid-cols-3 gap-4 mb-14">
                <StatCard icon={<BookOpen size={20} color="#00E054" weight="fill" />} label="Readings" value={data?.total_readings ?? 0} testId="stat-readings" />
                <StatCard icon={<Highlighter size={20} color="#FF8000" weight="fill" />} label="Highlights" value={data?.total_highlights ?? 0} testId="stat-highlights" />
                <StatCard icon={<Clock size={20} color="#40BCF4" weight="fill" />} label="Due for revision" value={data?.due_reviews ?? 0} testId="stat-due" />
            </div>

            {/* Themes / tags — subtle inline, no forced trivia */}
            {topTags.length > 0 && (
                <section className="mb-14" data-testid="themes-row">
                    <div className="label-tag mb-3">Themes you're reading</div>
                    <div className="flex flex-wrap gap-2">
                        {topTags.map((t) => (
                            <div key={t.name} className="flex items-center gap-1.5">
                                <TagChip tag={t} />
                                <span className="text-xs text-[#667788]">× {t.count}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* "Haven't touched in a while" — a gentle, non-guilty resurface */}
            {staleReading && data?.total_readings > 3 && (
                <section className="mb-14" data-testid="stale-block">
                    <div className="label-tag mb-3">Might be worth a revisit</div>
                    <div
                        className="flex items-center gap-4 p-4 rounded-lg bg-[#1B2228] border border-[#2C3440] hover:border-[#00E054]/40 cursor-pointer transition"
                        onClick={() => nav(`/readings/${staleReading.id}`)}
                    >
                        <Cover reading={staleReading} title={staleReading.title} color={staleReading.cover_color} size="sm" />
                        <div className="flex-1 min-w-0">
                            <div className="font-heading font-bold truncate">{staleReading.title}</div>
                            <div className="text-xs text-[#99AABB]">Last opened {staleReading.read_date}</div>
                        </div>
                        <Sparkle size={16} color="#00E054" weight="fill" />
                    </div>
                </section>
            )}

            {/* Rating distribution — subtle bar to fill space */}
            {data?.total_readings > 0 && (
                <section className="mb-14" data-testid="rating-distribution">
                    <div className="label-tag mb-3">Your ratings</div>
                    <div className="flex items-end gap-2 h-16">
                        {[5,4,3,2,1].map((star) => {
                            const count = readings.filter((r) => Math.round(r.rating || 0) === star).length;
                            const max = Math.max(1, ...[5,4,3,2,1].map((s) => readings.filter((r) => Math.round(r.rating || 0) === s).length));
                            const h = (count / max) * 100;
                            return (
                                <div key={star} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex flex-col justify-end h-12">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(4, h)}%` }}
                                            transition={{ delay: star * 0.05, duration: 0.5 }}
                                            className="w-full rounded-t"
                                            style={{ background: `linear-gradient(180deg, #00E054 0%, #007a2f 100%)`, opacity: count ? 1 : 0.2 }}
                                        />
                                    </div>
                                    <div className="text-[10px] text-[#667788]">{star}★</div>
                                    <div className="text-[10px] text-white font-heading">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Recent readings */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl">Recent Readings</h2>
                <button className="text-xs uppercase tracking-widest text-[#99AABB] hover:text-white" onClick={() => nav('/readings')} data-testid="see-all-link">See all</button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {(data?.recent || []).map((r, i) => (
                    <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.35 }}
                        whileHover={{ y: -8, scale: 1.05, transition: { duration: 0.2 } }}
                        className="cursor-pointer group"
                        onClick={() => nav(`/readings/${r.id}`)}
                        data-testid={`recent-reading-${r.id}`}
                    >
                        <div className="cover-hover shadow-lg group-hover:shadow-[0_20px_50px_-20px_rgba(0,224,84,0.5)] transition-shadow">
                            <Cover reading={r} title={r.title} color={r.cover_color} size="md" className="w-full h-auto aspect-[2/3]" />
                        </div>
                        <div className="mt-2 flex justify-center">
                            <StarRating value={r.rating || 0} readOnly size={10} testId={`recent-rating-${r.id}`} />
                        </div>
                    </motion.div>
                ))}
                {data && data.recent.length === 0 && (
                    <div className="col-span-full text-center py-12 border border-dashed border-[#2C3440] rounded-lg">
                        <div className="text-[#99AABB] mb-4">Nothing logged yet.</div>
                        <button onClick={onLog} className="px-6 py-2 rounded-full bg-[#00E054] text-[#14181C] font-semibold hover:bg-[#00c94a]" data-testid="empty-log-btn">Log your first reading</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const InkBleed = ({ text }) => (
    <span className="inline-block">
        {text.split("").map((c, i) => (
            <motion.span
                key={i}
                initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block italic"
                style={{ color: "#00E054" }}
            >
                {c === " " ? "\u00A0" : c}
            </motion.span>
        ))}
    </span>
);

const StatCard = ({ icon, label, value, testId }) => (
    <div className="bg-[#1B2228] border border-[#2C3440] rounded-lg p-5" data-testid={testId}>
        <div className="flex items-center gap-2 mb-3">{icon}<span className="label-tag">{label}</span></div>
        <div className="font-heading text-4xl font-bold">{value}</div>
    </div>
);
