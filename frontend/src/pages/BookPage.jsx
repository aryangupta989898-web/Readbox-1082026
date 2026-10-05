import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, BookmarkSimple, BookOpen, ArrowSquareOut, CheckCircle } from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import { BookThumb } from "../components/BookSearch";
import { createWishlist, fetchBook } from "../lib/api";
import { toast } from "sonner";

/**
 * Catalog preview for a book the user hasn't necessarily logged.
 * Every book renders in the same template — only structured fields (cover, title, author,
 * year, pages, subjects) plus a cleaned, length-capped blurb — so inconsistent source
 * descriptions don't break the look.
 */
export const BookPage = ({ onLog }) => {
    const { bookId } = useParams();
    const [book, setBook] = useState(null);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setBook(null); setError(""); setExpanded(false);
        fetchBook(bookId).then(setBook).catch((e) => setError(e?.response?.data?.detail || "Couldn't load this book"));
    }, [bookId]);

    const addToWishlist = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("book_id", book.id);
            const item = await createWishlist(fd);
            setBook({ ...book, library: { ...(book.library || {}), wishlist_id: item.id } });
            toast.success("Added to Wishlist");
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Failed to add");
        } finally {
            setSaving(false);
        }
    };

    if (error) return <div className="max-w-4xl mx-auto px-6 py-24 text-center text-[#99AABB]">{error}</div>;
    if (!book) return <div className="max-w-4xl mx-auto px-6 py-24 text-center text-[#667788]">Loading…</div>;

    const lib = book.library || {};
    const hasMore = book.description && book.description.length > (book.blurb || "").length + 20;

    return (
        <div className="max-w-4xl mx-auto px-6 py-12" data-testid="book-page">
            <div className="flex flex-col sm:flex-row gap-8">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-44 flex-shrink-0 mx-auto sm:mx-0">
                    <BookThumb book={book} className="w-44 h-auto aspect-[2/3] shadow-2xl" />
                </motion.div>
                <div className="flex-1 min-w-0">
                    <div className="label-tag mb-2">{book.year || "Book"}{book.page_count ? ` · ${book.page_count} pages` : ""}</div>
                    <h1 className="font-heading text-3xl sm:text-4xl font-bold leading-tight" data-testid="book-title">{book.title}</h1>
                    {book.authors?.length > 0 && (
                        <div className="mt-2 text-lg text-[#99AABB] italic" style={{ fontFamily: "Cormorant Garamond, serif" }}>
                            by {book.authors.map((a, i) => (
                                <React.Fragment key={a}>
                                    {i > 0 && ", "}
                                    <Link to={`/author/${encodeURIComponent(a)}`} className="hover:text-white">{a}</Link>
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-6">
                        {lib.reading_id ? (
                            <Link to={`/readings/${lib.reading_id}`}>
                                <Button className="rounded-full bg-[#00E054] text-[#14181C] hover:bg-[#00c94a] font-semibold" data-testid="book-open-reading-btn">
                                    <CheckCircle size={15} weight="fill" className="mr-1" /> In your library
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Button onClick={() => onLog({ book, status: "completed" })} className="rounded-full bg-[#00E054] text-[#14181C] hover:bg-[#00c94a] font-semibold" data-testid="book-log-btn">
                                    <Plus size={15} weight="bold" className="mr-1" /> Log it
                                </Button>
                                <Button onClick={() => onLog({ book, status: "reading" })} variant="outline" className="rounded-full border-[#FF8000]/60 bg-transparent text-[#FF8000] hover:bg-[#FF8000]/10" data-testid="book-start-btn">
                                    <BookOpen size={15} weight="fill" className="mr-1" /> Start reading
                                </Button>
                            </>
                        )}
                        {!lib.reading_id && (lib.wishlist_id ? (
                            <Link to="/wishlist">
                                <Button variant="outline" className="rounded-full border-[#40BCF4]/60 bg-transparent text-[#40BCF4] hover:bg-[#40BCF4]/10">
                                    <BookmarkSimple size={15} weight="fill" className="mr-1" /> On your Wishlist
                                </Button>
                            </Link>
                        ) : (
                            <Button onClick={addToWishlist} disabled={saving} variant="outline" className="rounded-full border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="book-wishlist-btn">
                                <BookmarkSimple size={15} className="mr-1" /> Want to read
                            </Button>
                        ))}
                    </div>

                    <section className="mt-8">
                        <div className="label-tag mb-2">About</div>
                        {book.description ? (
                            <>
                                <p className="text-[15px] leading-relaxed text-[#C8D2DC] whitespace-pre-line" data-testid="book-description">
                                    {expanded ? book.description : book.blurb || book.description}
                                </p>
                                {hasMore && (
                                    <button type="button" onClick={() => setExpanded(!expanded)} className="mt-2 text-xs uppercase tracking-widest text-[#40BCF4] hover:text-white">
                                        {expanded ? "Show less" : "Read more"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-[#667788] italic">No description in the catalog. Log it with a PDF or your own notes to get an AI synopsis.</p>
                        )}
                    </section>

                    {book.subjects?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {book.subjects.map((s) => (
                                <span key={s} className="text-[11px] px-2.5 py-1 rounded-full border border-[#2C3440] text-[#99AABB]">{s}</span>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 text-[10px] uppercase tracking-widest text-[#667788] flex items-center gap-3">
                        <span>Source: {book.source}</span>
                        {book.info_url && (
                            <a href={book.info_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                                View <ArrowSquareOut size={11} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
