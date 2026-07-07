import React, { useMemo } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { TagChip } from "./TagsPicker";

export const FilterBar = ({ search, setSearch, tag, setTag, readings }) => {
    const allTags = useMemo(() => {
        const map = new Map();
        readings.forEach((r) => (r.tags || []).forEach((t) => {
            if (t?.name && !map.has(t.name)) map.set(t.name, t);
        }));
        return [...map.values()];
    }, [readings]);

    return (
        <div className="mb-6 space-y-3" data-testid="filter-bar">
            <div className="relative">
                <MagnifyingGlass size={16} color="#667788" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Search title, author, review..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#1B2228] border border-[#2C3440] rounded-full pl-9 pr-9 py-2 text-sm text-white placeholder-[#667788] focus:outline-none focus:border-[#00E054]"
                    data-testid="search-input"
                />
                {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667788] hover:text-white" data-testid="clear-search">
                        <X size={14} />
                    </button>
                )}
            </div>
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="label-tag">Filter by tag:</span>
                    <button
                        onClick={() => setTag(null)}
                        className={`text-xs uppercase tracking-widest px-3 py-1 rounded-full border transition ${!tag ? "border-white text-white" : "border-[#2C3440] text-[#667788] hover:text-white"}`}
                        data-testid="tag-filter-all"
                    >All</button>
                    {allTags.map((t) => (
                        <button
                            key={t.name}
                            onClick={() => setTag(t.name === tag ? null : t.name)}
                            className={`transition ${tag === t.name ? "ring-2 ring-white rounded-full" : ""}`}
                            data-testid={`tag-filter-${t.name}`}
                        >
                            <TagChip tag={t} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const applyFilter = (readings, search, tag) => {
    return readings.filter((r) => {
        if (tag && !(r.tags || []).some((t) => t.name === tag)) return false;
        if (search) {
            const q = search.toLowerCase();
            const hay = [r.title, r.author, r.review, r.synopsis, ...(r.tags || []).map((t) => t.name)]
                .filter(Boolean).join(" ").toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
};
