import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchActivity } from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { BookOpen, Highlighter, Clock } from "@phosphor-icons/react";

export const ActivityPage = ({ onLog }) => {
    const [data, setData] = useState(null);
    const nav = useNavigate();

    useEffect(() => {
        fetchActivity().then(setData).catch(() => {});
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-6 py-12" data-testid="activity-page">
            <div className="mb-10">
                <div className="label-tag mb-2">Your Archive</div>
                <h1 className="font-heading text-5xl font-bold tracking-tight">A ledger of everything you've read.</h1>
                <p className="text-[#99AABB] mt-3 max-w-xl text-sm leading-relaxed">
                    Log articles, PDFs and papers. Let AI extract topics, generate notes, and drill your highlights via spaced repetition.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-14">
                <StatCard icon={<BookOpen size={22} color="#00E054" weight="fill" />} label="Readings" value={data?.total_readings ?? 0} testId="stat-readings" />
                <StatCard icon={<Highlighter size={22} color="#FF8000" weight="fill" />} label="Highlights" value={data?.total_highlights ?? 0} testId="stat-highlights" />
                <StatCard icon={<Clock size={22} color="#40BCF4" weight="fill" />} label="Due for revision" value={data?.due_reviews ?? 0} testId="stat-due" />
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl">Recent Readings</h2>
                <button className="text-xs uppercase tracking-widest text-[#99AABB] hover:text-white" onClick={() => nav('/readings')} data-testid="see-all-link">See all</button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {(data?.recent || []).map((r) => (
                    <div key={r.id} className="cursor-pointer" onClick={() => nav(`/readings/${r.id}`)} data-testid={`recent-reading-${r.id}`}>
                        <div className="cover-hover">
                            <Cover title={r.title} color={r.cover_color} size="md" className="w-full h-auto aspect-[2/3]" />
                        </div>
                        <div className="mt-2 flex justify-center">
                            <StarRating value={r.rating || 0} readOnly size={12} testId={`recent-rating-${r.id}`} />
                        </div>
                    </div>
                ))}
                {data && data.recent.length === 0 && (
                    <div className="col-span-6 text-center py-12 border border-dashed border-[#2C3440] rounded-lg">
                        <div className="text-[#99AABB] mb-4">Nothing logged yet.</div>
                        <button onClick={onLog} className="px-6 py-2 rounded-full bg-[#00E054] text-[#14181C] font-semibold hover:bg-[#00c94a]" data-testid="empty-log-btn">Log your first reading</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, testId }) => (
    <div className="bg-[#1B2228] border border-[#2C3440] rounded-lg p-5" data-testid={testId}>
        <div className="flex items-center gap-2 mb-3">{icon}<span className="label-tag">{label}</span></div>
        <div className="font-heading text-4xl font-bold">{value}</div>
    </div>
);
