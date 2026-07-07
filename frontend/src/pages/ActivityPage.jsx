import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchActivity, fetchReadings } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";

const ICONIC_COVERS = [
    { url: "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/cpw7foj2_4375b7d9bf24b88aa53744b417227485.jpg", title: "Interstellar" },
    { url: "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/wz8qil8k_17a4ae76d33654afe5ed9bbaa36f2561.jpg", title: "Peter and the Wolf" },
    { url: "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/l7b9t6et_0405c45d7c0f56c39dc4baaaca482a71.jpg", title: "Life of Pi" },
    { url: "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/9cv31w7o_d20b291bd20bf99262d4dbdc41ded105.jpg", title: "1984" },
    { url: "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/a2xxq01x_image.webp", title: "Maker of Swans" },
];

const WELCOMES = [
    { pre: "Nice to see", ink: "you back." },
    { pre: "Fresh page,", ink: "fresh you." },
    { pre: "Take your", ink: "time today." },
    { pre: "The shelf is", ink: "always waiting." },
    { pre: "A quiet", ink: "corner for you." },
    { pre: "Some pages", ink: "found you." },
    { pre: "Glad you", ink: "wandered in." },
    { pre: "The margin is", ink: "yours to fill." },
    { pre: "Curl up.", ink: "Stay a while." },
    { pre: "Something", ink: "worth reading." },
];

const GENRE_FACTS = {
    Business: "Adam Smith wrote most of Wealth of Nations at a tavern in Kirkcaldy.",
    Startup: "Airbnb once funded itself by selling cereal boxes at the DNC.",
    Philosophy: "Nietzsche's sister forged parts of his 'Will to Power' after his death.",
    Fiction: "Nabokov wrote Lolita on index cards while chasing butterflies in Colorado.",
    Science: "Feynman's lectures were nearly lost — students recorded them on reel-to-reel.",
    History: "Herodotus was called 'father of lies' before he was 'father of history'.",
    default: "Roald Dahl wrote in a garden hut for 30 years, always in yellow pencils.",
};

const Marginalia = () => (
    <>
        <svg className="absolute -left-16 top-24 opacity-40 hidden lg:block" width="60" height="80" viewBox="0 0 60 80" fill="none">
            <path d="M5 40 Q 30 20, 50 40" stroke="#c8ae7d" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M45 35 L50 40 L45 45" stroke="#c8ae7d" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg className="absolute -right-8 top-56 opacity-30 hidden lg:block" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <text x="0" y="18" fill="#c8ae7d" fontFamily="serif" fontSize="22">*</text>
        </svg>
        <svg className="absolute -left-12 top-[500px] opacity-25 hidden lg:block" width="80" height="12" viewBox="0 0 80 12">
            <path d="M2 6 Q 20 2, 40 6 T 78 6" stroke="#c8ae7d" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
        <svg className="absolute right-4 bottom-40 opacity-25 hidden lg:block" width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="14" stroke="#c8ae7d" strokeWidth="1" strokeDasharray="2 3" fill="none" />
        </svg>
    </>
);

const Sparkline = ({ data }) => {
    const max = Math.max(1, ...data);
    const w = 60, h = 16;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
    return (
        <svg width={w} height={h} className="opacity-70">
            <polyline points={pts} fill="none" stroke="#c8ae7d" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
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

    const { weekReadings, weekDays, topGenres } = useMemo(() => {
        const now = new Date();
        const dow = now.getDay(); const monday = new Date(now); monday.setDate(now.getDate() - ((dow + 6) % 7)); monday.setHours(0,0,0,0);
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
        const genres = Object.entries(tagFreq).sort((a,b) => b[1]-a[1]).slice(0,3).map(([n]) => n);
        return { weekReadings: count, weekDays: daily, topGenres: genres };
    }, [readings]);

    return (
        <motion.div
            initial={{ rotateY: -8, opacity: 0, transformOrigin: "left center" }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-6xl mx-auto px-6 py-12"
            data-testid="activity-page"
            style={{ perspective: 1200 }}
        >
            <Marginalia />

            {/* Masthead + weekly counter (top right) */}
            <div className="flex items-start justify-between mb-10">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[#c8ae7d]/70" style={{fontFamily:'Cormorant Garamond, serif'}} data-testid="masthead">
                    READBOX · Vol. I · Issue {String(Math.max(1, Math.floor((Date.now() - new Date(new Date().getFullYear(),0,1)) / (7*86400000)))).padStart(2,'0')}
                </div>
                <div className="text-right" data-testid="weekly-counter">
                    <div className="font-heading text-xl font-bold text-[#c8ae7d]">{weekReadings}</div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#99AABB]">this week</div>
                    <div className="mt-1 flex justify-end"><Sparkline data={weekDays} /></div>
                </div>
            </div>

            {/* Hero welcome with drop cap + ink-bleed on last words */}
            <div className="mb-14">
                <div className="label-tag mb-3">Welcome</div>
                <h1 className="font-heading text-5xl md:text-7xl leading-[1.05] tracking-tight" data-testid="welcome-heading">
                    <span className="float-left mr-3 text-8xl md:text-9xl leading-none text-[#c8ae7d]" style={{fontFamily:'Cormorant Garamond, serif', fontWeight: 500}}>
                        {welcome.pre[0]}
                    </span>
                    <span className="text-white">{welcome.pre.slice(1)}</span>{" "}
                    <InkBleed text={welcome.ink} />
                </h1>
                <div className="clear-both" />
            </div>

            {/* Iconic covers auto-carousel */}
            <section className="mb-16" data-testid="iconic-shelf">
                <div className="flex items-baseline justify-between mb-4">
                    <div>
                        <div className="label-tag mb-1">Your Canon</div>
                        <div className="text-[#99AABB] text-sm">Covers you've kept close.</div>
                    </div>
                </div>
                <div className="relative overflow-hidden group" style={{maskImage:'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)'}}>
                    <motion.div
                        className="flex gap-6 py-2"
                        animate={{ x: [0, -1200] }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        whileHover={{ animationPlayState: "paused" }}
                        style={{ width: "max-content" }}
                    >
                        {[...ICONIC_COVERS, ...ICONIC_COVERS, ...ICONIC_COVERS].map((c, i) => (
                            <div key={i} className="h-56 flex-shrink-0 rounded-sm overflow-hidden border border-[#2C3440] shadow-2xl">
                                <img src={c.url} alt={c.title} className="h-full w-auto object-contain bg-black" loading="lazy" />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-14">
                <StatMini label="Readings" value={data?.total_readings ?? 0} testId="stat-readings" />
                <StatMini label="Highlights" value={data?.total_highlights ?? 0} testId="stat-highlights" />
                <StatMini label="Due for revision" value={data?.due_reviews ?? 0} testId="stat-due" />
            </div>

            {/* Genres this week + did you know */}
            {topGenres.length > 0 && (
                <section className="mb-16" data-testid="genres-week">
                    <div className="label-tag mb-4">This Week's Shelves</div>
                    <div className="space-y-3">
                        {topGenres.map((g) => (
                            <div key={g} className="flex items-baseline gap-4 border-b border-[#2C3440]/60 pb-3">
                                <div className="font-heading text-2xl min-w-[140px]" style={{fontFamily:'Cormorant Garamond, serif'}}>{g}</div>
                                <div className="text-[#99AABB] text-sm italic">
                                    <span className="text-[#c8ae7d]">Did you know · </span>
                                    {GENRE_FACTS[g] || GENRE_FACTS.default}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recent readings */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl">Recent Readings</h2>
                <button className="text-xs uppercase tracking-widest text-[#99AABB] hover:text-white" onClick={() => nav('/readings')} data-testid="see-all-link">See all</button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-16">
                {(data?.recent || []).map((r) => (
                    <div key={r.id} className="cursor-pointer" onClick={() => nav(`/readings/${r.id}`)} data-testid={`recent-reading-${r.id}`}>
                        <div className="cover-hover">
                            <Cover reading={r} title={r.title} color={r.cover_color} size="md" className="w-full h-auto aspect-[2/3]" />
                        </div>
                        <div className="mt-2 flex justify-center">
                            <StarRating value={r.rating || 0} readOnly size={10} testId={`recent-rating-${r.id}`} />
                        </div>
                    </div>
                ))}
                {data && data.recent.length === 0 && (
                    <div className="col-span-full text-center py-12 border border-dashed border-[#2C3440] rounded-lg">
                        <div className="text-[#99AABB] mb-4">Nothing logged yet.</div>
                        <button onClick={onLog} className="px-6 py-2 rounded-full bg-[#00E054] text-[#14181C] font-semibold hover:bg-[#00c94a]" data-testid="empty-log-btn">Log your first reading</button>
                    </div>
                )}
            </div>

            {/* Apple-style weekly pace card */}
            <section className="mb-16" data-testid="pace-card">
                <div className="rounded-2xl border border-[#2C3440] bg-gradient-to-b from-[#1B2228] to-[#14181C] p-8">
                    <div className="flex items-baseline justify-between mb-6">
                        <div>
                            <div className="label-tag mb-1">This Week</div>
                            <div className="flex items-baseline gap-2">
                                <div className="font-heading text-5xl font-bold text-white">{weekReadings}</div>
                                <div className="text-[#99AABB] text-sm">readings logged</div>
                            </div>
                        </div>
                        <div className="text-right text-xs text-[#99AABB]">
                            <div>Daily Average</div>
                            <div className="text-white font-heading text-xl">{(weekReadings/7).toFixed(1)}</div>
                        </div>
                    </div>
                    <div className="flex items-end gap-3 h-32">
                        {weekDays.map((v, i) => {
                            const max = Math.max(1, ...weekDays);
                            const h = (v / max) * 100;
                            const days = ["M","T","W","T","F","S","S"];
                            const today = (new Date().getDay() + 6) % 7;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full flex flex-col justify-end h-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(4, h)}%` }}
                                            transition={{ delay: 0.5 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                                            className="w-full rounded-full"
                                            style={{ background: `linear-gradient(180deg, #c8ae7d 0%, #8a7355 100%)`, opacity: i === today ? 1 : 0.55 }}
                                        />
                                    </div>
                                    <div className={`text-[10px] uppercase tracking-widest ${i === today ? "text-[#c8ae7d]" : "text-[#667788]"}`}>{days[i]}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </motion.div>
    );
};

const InkBleed = ({ text }) => (
    <span className="inline-block">
        {text.split("").map((c, i) => (
            <motion.span
                key={i}
                initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
                style={{ color: "#c8ae7d", fontStyle: "italic" }}
            >
                {c === " " ? "\u00A0" : c}
            </motion.span>
        ))}
    </span>
);

const StatMini = ({ label, value, testId }) => (
    <div className="border-l-2 border-[#c8ae7d]/40 pl-4" data-testid={testId}>
        <div className="font-heading text-4xl font-bold text-white">{value}</div>
        <div className="label-tag mt-1">{label}</div>
    </div>
);
