import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MagnifyingGlass, CircleNotch } from "@phosphor-icons/react";
import { Input } from "../components/ui/input";
import { Cover } from "../components/Cover";
import { BookThumb, LibraryBadge, useBookSearch } from "../components/BookSearch";
import { fetchReadings } from "../lib/api";

export const SearchPage = () => {
    const [params, setParams] = useSearchParams();
    const nav = useNavigate();
    const [query, setQuery] = useState(params.get("q") || "");
    const [readings, setReadings] = useState([]);
    const { results, loading, error } = useBookSearch(query, { limit: 20 });

    useEffect(() => { fetchReadings().then(setReadings).catch(() => {}); }, []);
    useEffect(() => { setQuery(params.get("q") || ""); }, [params]);

    const onChange = (v) => {
        setQuery(v);
        setParams(v ? { q: v } : {}, { replace: true });
    };

    const mine = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];
        return readings.filter((r) => `${r.title} ${r.author}`.toLowerCase().includes(q)).slice(0, 8);
    }, [readings, query]);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12" data-testid="search-page">
            <div className="label-tag mb-1">Search</div>
            <h1 className="font-heading text-4xl font-bold mb-6">Find a reading</h1>
            <div className="relative mb-10">
                <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667788]" />
                <Input
                    value={query}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus
                    placeholder="Title, author or ISBN"
                    className="pl-11 h-12 text-base bg-[#1B2228] border-[#2C3440]"
                    data-testid="search-page-input"
                />
                {loading && <CircleNotch size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#667788]" />}
            </div>

            {mine.length > 0 && (
                <section className="mb-12" data-testid="search-library-results">
                    <div className="label-tag mb-3">In your library</div>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {mine.map((r) => (
                            <Link key={r.id} to={`/readings/${r.id}`} className="w-28 flex-shrink-0 group">
                                <Cover reading={r} title={r.title} color={r.cover_color} className="w-28 h-40" size="md" />
                                <div className="text-xs mt-2 truncate group-hover:text-[#00E054]">{r.title}</div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {error && <div className="text-sm text-[#FF8000] mb-6">{error}</div>}

            {results.length > 0 && (
                <section data-testid="search-catalog-results">
                    <div className="label-tag mb-3">Books</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-5 gap-y-8">
                        {results.map((b) => (
                            <button key={b.id} type="button" onClick={() => nav(`/book/${encodeURIComponent(b.id)}`)} className="text-left group" data-testid={`search-book-${b.id}`}>
                                <BookThumb book={b} className="w-full aspect-[2/3] h-auto group-hover:border-[#00E054] transition" />
                                <div className="mt-2 text-sm font-medium leading-tight line-clamp-2 group-hover:text-[#00E054]">{b.title}</div>
                                <div className="text-xs text-[#99AABB] truncate">{(b.authors || [])[0] || "Unknown"}{b.year ? ` · ${b.year}` : ""}</div>
                                <LibraryBadge library={b.library} />
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {!loading && !error && query.trim().length >= 2 && results.length === 0 && mine.length === 0 && (
                <div className="py-16 text-center text-[#99AABB] border border-dashed border-[#2C3440] rounded-lg">No books found for "{query}".</div>
            )}
        </div>
    );
};
