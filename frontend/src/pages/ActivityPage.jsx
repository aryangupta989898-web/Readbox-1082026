import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchActivity, fetchReadings, toggleLike, updateStatus } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { TagChip } from "../components/TagsPicker";
import { ProgressRing } from "../components/ProgressRing";
import { Sparkle, BookOpen, Heart } from "@phosphor-icons/react";
import { toast } from "sonner";

const WELCOMES = [
    { pre: "Nice to see", ink: "you back." }, { pre: "Fresh page,", ink: "fresh you." },
    { pre: "Take your", ink: "time today." }, { pre: "The shelf is", ink: "always waiting." },
    { pre: "A quiet corner", ink: "for you." }, { pre: "Some pages", ink: "found you." },
    { pre: "Glad you", ink: "wandered in." }, { pre: "Curl up.", ink: "Stay a while." },
];

const ICONIC = [
    "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/cpw7foj2_4375b7d9bf24b88aa53744b417227485.jpg",
    "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/wz8qil8k_17a4ae76d33654afe5ed9bbaa36f2561.jpg",
    "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/l7b9t6et_0405c45d7c0f56c39dc4baaaca482a71.jpg",
    "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/9cv31w7o_d20b291bd20bf99262d4dbdc41ded105.jpg",
    "https://customer-assets.emergentagent.com/job_highlightloop/artifacts/a2xxq01x_image.webp",
];

const QUOTES = [
    { t: "It was the best of times, it was the worst of times.", a: "Charles Dickens" },
    { t: "Not all those who wander are lost.", a: "J.R.R. Tolkien" },
    { t: "We accept the love we think we deserve.", a: "Stephen Chbosky" },
    { t: "So it goes.", a: "Kurt Vonnegut" },
    { t: "The only way out of the labyrinth of suffering is to forgive.", a: "John Green" },
];

const GOODREADS = [
    { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", color: "#40BCF4" },
    { title: "Fourth Wing", author: "Rebecca Yarros", color: "#FF2A79" },
    { title: "The Covenant of Water", author: "Abraham Verghese", color: "#9D4EDD" },
    { title: "Iron Flame", author: "Rebecca Yarros", color: "#FF8000" },
];

const InkBleed = ({ text }) => (
    <span>{text.split("").map((c, i) => (
        <motion.span key={i} initial={{ opacity: 0, filter: "blur(4px)", y: 4 }} animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block italic" style={{ color: "#00E054" }}>{c === " " ? "\u00A0" : c}</motion.span>
    ))}</span>
);

const InkQuote = ({ text }) => (
    <span>{text.split("").map((c, i) => (
        <motion.span key={i} initial={{ opacity: 0, filter: "blur(5px)" }} whileInView={{ opacity: 1, filter: "blur(0)" }} viewport={{ once: true }}
            transition={{ delay: i * 0.025, duration: 0.4 }} className="inline-block" style={{ fontFamily: "Cormorant Garamond, serif" }}>{c === " " ? "\u00A0" : c}</motion.span>
    ))}</span>
);

const TileCover = ({ children }) => <div className="w-full aspect-[2/3]">{children}</div>;

export const ActivityPage = ({ onLog }) => {
    const [data, setData] = useState(null);
    const [readings, setReadings] = useState([]);
    const [welcome] = useState(() => WELCOMES[Math.floor(Math.random() * WELCOMES.length)]);
    const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const nav = useNavigate();

    useEffect(() => {
        fetchActivity().then(setData).catch(() => {});
        fetchReadings().then(setReadings).catch(() => {});
    }, []);

    const { topTags, staleReading, avg, timeline, currentlyReading } = useMemo(() => {
        const tagFreq = {};
        readings.forEach((r) => (r.tags || []).forEach((t) => { tagFreq[t.name] = (tagFreq[t.name] || 0) + 1; }));
        const sorted = [...readings].sort((a,b) => (a.read_date||"").localeCompare(b.read_date||""));
        const rated = readings.filter((r) => r.rating);
        const avg = rated.length ? rated.reduce((s,r) => s + r.rating, 0) / rated.length : 0;
        const timeline = [...readings].sort((a,b) => (b.read_date||"").localeCompare(a.read_date||"")).slice(0,4).reverse();
        const currentlyReading = readings
            .filter((r) => r.status === "reading")
            .sort((a,b) => (b.updated_at || b.read_date || "").localeCompare(a.updated_at || a.read_date || ""));
        return {
            topTags: Object.entries(tagFreq).sort((a,b) => b[1]-a[1]).slice(0,3).map(([n,c]) => ({ name: n, count: c, ...(readings.flatMap(r => r.tags || []).find(t => t.name === n) || {}) })),
            staleReading: sorted[0], avg, timeline, currentlyReading,
        };
    }, [readings]);

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 relative" data-testid="activity-page">
            {/* Hero */}
            <div className="mb-14">
                <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight leading-tight" data-testid="welcome-heading">
                    <span className="text-white">{welcome.pre}</span>{" "}<InkBleed text={welcome.ink} />
                </h1>
                <p className="text-[#99AABB] mt-4 text-sm max-w-xl leading-relaxed">
                    Log articles, PDFs and papers. Let AI extract topics, generate essay-form notes, and drill your highlights via spaced repetition.
                </p>
            </div>

            {/* Best Cover Pages */}
            <section className="mb-14" data-testid="iconic-shelf">
                <div className="label-tag mb-3">Best Cover Pages</div>
                <div className="relative overflow-hidden" style={{maskImage:'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)'}}>
                    <motion.div className="flex gap-4 py-2" animate={{ x: [0, -1200] }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} style={{ width: "max-content" }}>
                        {[...ICONIC, ...ICONIC, ...ICONIC].map((url, i) => (
                            <motion.div key={i} whileHover={{ y: -6, scale: 1.05 }} className="w-32 aspect-[2/3] flex-shrink-0 rounded overflow-hidden border border-[#2C3440] shadow-2xl cursor-pointer">
                                <img src={url} className="w-full h-full object-cover" loading="lazy" alt="" />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Continue Reading — currently reading strip */}
            {currentlyReading.length > 0 && (
                <section className="mb-14" data-testid="continue-reading">
                    <div className="flex items-center justify-between mb-4">
                        <div className="label-tag flex items-center gap-2 text-[#FF8000]">
                            <BookOpen size={12} weight="fill" /> Continue Reading · {currentlyReading.length}
                        </div>
                        <button className="text-xs uppercase tracking-widest text-[#99AABB] hover:text-white" onClick={() => nav('/readings')}>See all</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {currentlyReading.slice(0, 3).map((r, i) => {
                            const pct = r.total_pages > 0 ? Math.round(((r.pages_read || 0) / r.total_pages) * 100) : 0;
                            return (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    whileHover={{ y: -4 }}
                                    onClick={() => nav(`/readings/${r.id}`)}
                                    className="cursor-pointer flex gap-4 p-4 rounded-lg bg-gradient-to-br from-[#1B2228] to-[#14181C] border border-[#2C3440] hover:border-[#FF8000]/60 transition"
                                    data-testid={`continue-card-${r.id}`}
                                >
                                    <div className="w-16 flex-shrink-0">
                                        <Cover reading={r} title={r.title} color={r.cover_color} className="w-full h-auto aspect-[2/3]" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="font-heading font-bold truncate">{r.title}</div>
                                            {r.author && <div className="text-xs text-[#99AABB] truncate">{r.author}</div>}
                                        </div>
                                        <div className="mt-2">
                                            {r.total_pages > 0 ? (
                                                <>
                                                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#c8ae7d] mb-1">
                                                        <span>{r.pages_read || 0} / {r.total_pages} pages</span>
                                                        <span>{pct}%</span>
                                                    </div>
                                                    <div className="h-1 rounded-full bg-[#2C3440] overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                                            className="h-full bg-gradient-to-r from-[#FF8000] to-[#FFB800]"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-[10px] uppercase tracking-widest text-[#667788]">In progress · set pages to track</div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Recent Reads — horizontal timeline */}
            <section className="mb-14" data-testid="recent-timeline">
                <div className="flex items-center justify-between mb-4">
                    <div className="label-tag">Recent Reads · Timeline</div>
                    <button className="text-xs uppercase tracking-widest text-[#99AABB] hover:text-white" onClick={() => nav('/readings')}>See all</button>
                </div>
                <div className="relative pt-4">
                    <div className="absolute left-0 right-0 top-[calc(50%-20px)] h-px bg-gradient-to-r from-transparent via-[#c8ae7d]/40 to-transparent" />
                    <div className="grid grid-cols-4 gap-6 relative">
                        {timeline.map((r, i) => (
                            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -6, scale: 1.05 }} className="cursor-pointer flex flex-col items-center" onClick={() => nav(`/readings/${r.id}`)}>
                                <TileCover><Cover reading={r} title={r.title} color={r.cover_color} size="md" className="w-full h-full" /></TileCover>
                                <div className="w-2 h-2 rounded-full bg-[#00E054] mt-3 ring-4 ring-[#14181C]" />
                                <div className="mt-2 text-[10px] uppercase tracking-widest text-[#c8ae7d]">{r.read_date}</div>
                            </motion.div>
                        ))}
                        {timeline.length === 0 && <div className="col-span-4 text-center py-12 text-[#99AABB] border border-dashed border-[#2C3440] rounded-lg">No readings yet.</div>}
                    </div>
                </div>
            </section>

            {/* Famous quote + stats sidebar */}
            <section className="mb-14 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 items-center">
                <div className="text-2xl md:text-3xl italic leading-relaxed text-[#c8ae7d]" data-testid="famous-quote">
                    "<InkQuote text={quote.t} />"
                    <div className="mt-3 text-xs uppercase tracking-[0.25em] text-[#667788] not-italic" style={{fontFamily:'IBM Plex Sans'}}>— {quote.a}</div>
                </div>
                <div className="border-l border-[#2C3440] pl-6 space-y-4" data-testid="mini-stats">
                    <div className="flex items-baseline justify-between"><span className="text-xs uppercase tracking-widest text-[#667788]">Avg ★</span><span className="font-heading text-2xl">{avg.toFixed(1)}</span></div>
                    <div className="flex items-baseline justify-between"><span className="text-xs uppercase tracking-widest text-[#667788]">Readings</span><span className="font-heading text-2xl">{data?.total_readings ?? 0}</span></div>
                    <div className="flex items-baseline justify-between"><span className="text-xs uppercase tracking-widest text-[#667788]">Highlights</span><span className="font-heading text-2xl">{data?.total_highlights ?? 0}</span></div>
                    <div className="flex items-baseline justify-between"><span className="text-xs uppercase tracking-widest text-[#667788]">Due</span><span className="font-heading text-2xl">{data?.due_reviews ?? 0}</span></div>
                    {topTags.length > 0 && <div className="pt-2"><div className="text-[10px] uppercase tracking-widest text-[#667788] mb-2">Themes</div><div className="flex flex-wrap gap-1">{topTags.map((t) => <TagChip key={t.name} tag={t} />)}</div></div>}
                </div>
            </section>

            {/* Might be worth a revisit */}
            {staleReading && data?.total_readings > 3 && (
                <section className="mb-14" data-testid="stale-block">
                    <div className="label-tag mb-3">Might be worth a revisit</div>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-[#1B2228] border border-[#2C3440] hover:border-[#00E054]/40 cursor-pointer transition" onClick={() => nav(`/readings/${staleReading.id}`)}>
                        <div className="w-16"><TileCover><Cover reading={staleReading} title={staleReading.title} color={staleReading.cover_color} className="w-full h-full" /></TileCover></div>
                        <div className="flex-1 min-w-0"><div className="font-heading font-bold truncate">{staleReading.title}</div><div className="text-xs text-[#99AABB]">Last opened {staleReading.read_date}</div></div>
                        <Sparkle size={16} color="#00E054" weight="fill" />
                    </div>
                </section>
            )}

            {/* Goodreads recommendations */}
            <section className="mb-14" data-testid="goodreads-shelf">
                <div className="label-tag mb-3">Popular on Goodreads</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {GOODREADS.map((b, i) => (
                        <motion.div key={i} whileHover={{ y: -6, scale: 1.05 }} className="cursor-pointer group">
                            <TileCover><Cover title={b.title} color={b.color} className="w-full h-full" /></TileCover>
                            <div className="mt-2 font-heading text-xs font-semibold text-white truncate">{b.title}</div>
                            <div className="text-[10px] text-[#667788] truncate">{b.author}</div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
};
