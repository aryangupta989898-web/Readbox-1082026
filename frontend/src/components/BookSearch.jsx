import React, { useEffect, useRef, useState } from "react";
import { MagnifyingGlass, CircleNotch, CheckCircle, BookmarkSimple } from "@phosphor-icons/react";
import { Input } from "./ui/input";
import { searchBooks } from "../lib/api";

/** Debounced catalog search. Calls onPick(book) when a result is chosen. */
export const useBookSearch = (query, { delay = 350, limit = 12 } = {}) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const seq = useRef(0);

    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) { setResults([]); setError(""); setLoading(false); return; }
        const id = ++seq.current;
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const data = await searchBooks(q, limit);
                if (id !== seq.current) return;
                setResults(data); setError("");
            } catch (e) {
                if (id !== seq.current) return;
                setResults([]); setError(e?.response?.data?.detail || "Search failed");
            } finally {
                if (id === seq.current) setLoading(false);
            }
        }, delay);
        return () => clearTimeout(t);
    }, [query, delay, limit]);

    return { results, loading, error };
};

export const BookThumb = ({ book, className = "w-10 h-14" }) => {
    const [err, setErr] = useState(false);
    if (book.cover_url && !err) {
        return <img src={book.cover_url} alt="" onError={() => setErr(true)} className={`${className} object-cover rounded-sm border border-[#2C3440] flex-shrink-0 bg-[#14181C]`} loading="lazy" />;
    }
    return (
        <div className={`${className} rounded-sm border border-[#2C3440] flex-shrink-0 bg-gradient-to-br from-[#2C3440] to-[#14181C] flex items-end p-1`}>
            <span className="text-[8px] uppercase tracking-widest text-white/60 line-clamp-3">{book.title}</span>
        </div>
    );
};

export const LibraryBadge = ({ library }) => {
    if (!library) return null;
    if (library.reading_id) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#00E054]">
                <CheckCircle size={11} weight="fill" /> {library.status === "reading" ? "Reading" : "Logged"}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#40BCF4]">
            <BookmarkSimple size={11} weight="fill" /> Wishlist
        </span>
    );
};

export const BookResultRow = ({ book, onClick, active, testId }) => (
    <button
        type="button"
        onClick={() => onClick(book)}
        className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition border ${active ? "border-[#00E054] bg-[#00E054]/5" : "border-transparent hover:bg-[#2C3440]/50"}`}
        data-testid={testId}
    >
        <BookThumb book={book} />
        <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{book.title}</div>
            <div className="text-xs text-[#99AABB] truncate">
                {(book.authors || []).slice(0, 2).join(", ") || "Unknown author"}
                {book.year ? ` · ${book.year}` : ""}
            </div>
            <LibraryBadge library={book.library} />
        </div>
    </button>
);

export const BookSearch = ({ onPick, selectedId, autoFocus = false }) => {
    const [query, setQuery] = useState("");
    const { results, loading, error } = useBookSearch(query, { limit: 8 });

    return (
        <div data-testid="book-search">
            <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667788]" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus={autoFocus}
                    placeholder="Search any book — e.g. Sapiens, How to Lie with Statistics"
                    className="pl-9 bg-[#14181C] border-[#2C3440]"
                    data-testid="book-search-input"
                />
                {loading && <CircleNotch size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#667788]" />}
            </div>
            {error && <div className="text-xs text-[#FF8000] mt-2">{error}</div>}
            {results.length > 0 && (
                <div className="mt-2 max-h-64 overflow-y-auto space-y-1 pr-1" data-testid="book-search-results">
                    {results.map((b) => (
                        <BookResultRow key={b.id} book={b} onClick={onPick} active={b.id === selectedId} testId={`book-result-${b.id}`} />
                    ))}
                </div>
            )}
            {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
                <div className="text-xs text-[#667788] mt-2">No matches. Try the author's name too, or log it manually.</div>
            )}
        </div>
    );
};
