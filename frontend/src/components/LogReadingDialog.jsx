import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { StarRating } from "./StarRating";
import { UploadSimple, FilePdf, BookOpen, CheckCircle, TextAlignLeft, Books, LinkSimple, CircleNotch, Warning, X } from "@phosphor-icons/react";
import { createReading, previewUrl } from "../lib/api";
import { BookSearch, BookThumb, LibraryBadge } from "./BookSearch";
import { useNavigate } from "react-router-dom";

const MODES = [
    { id: "book", label: "Find Book", icon: Books },
    { id: "link", label: "From Link", icon: LinkSimple },
    { id: "pdf", label: "Upload PDF", icon: FilePdf },
    { id: "text", label: "Paste Text", icon: TextAlignLeft },
];
import { toast } from "sonner";

export const LogReadingDialog = ({ open, onOpenChange, onCreated, prefill }) => {
    const nav = useNavigate();
    const [mode, setMode] = useState("book"); // "book" | "link" | "pdf" | "text"
    const [book, setBook] = useState(null);
    const [url, setUrl] = useState("");
    const [preview, setPreview] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [file, setFile] = useState(null);
    const [textContent, setTextContent] = useState("");
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [readDate, setReadDate] = useState(new Date().toISOString().slice(0, 10));
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [status, setStatus] = useState("completed"); // "reading" | "completed"
    const [totalPages, setTotalPages] = useState("");
    const [pagesRead, setPagesRead] = useState("");
    const [loading, setLoading] = useState(false);

    const reset = () => {
        setMode("book"); setBook(null); setUrl(""); setPreview(null);
        setFile(null); setTextContent(""); setTitle(""); setAuthor("");
        setReadDate(new Date().toISOString().slice(0, 10));
        setRating(0); setReview("");
        setStatus("completed"); setTotalPages(""); setPagesRead("");
    };

    const pickBook = (b) => {
        setBook(b);
        setTitle(b.title || "");
        setAuthor((b.authors || []).slice(0, 2).join(", "));
        if (b.page_count) setTotalPages(String(b.page_count));
    };

    // Open pre-filled from the book page / search ("Log it")
    useEffect(() => {
        if (!open || !prefill) return;
        if (prefill.book) { setMode("book"); pickBook(prefill.book); }
        if (prefill.url) { setMode("link"); setUrl(prefill.url); }
        if (prefill.status) setStatus(prefill.status);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, prefill]);

    const fetchLink = async () => {
        if (!url.trim()) return;
        setFetching(true); setPreview(null);
        try {
            const p = await previewUrl(url.trim());
            setPreview(p);
            setUrl(p.url);
            if (p.title) setTitle(p.title);
            if (p.author) setAuthor(p.author);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Couldn't fetch that link");
        } finally {
            setFetching(false);
        }
    };

    const submit = async () => {
        if (mode === "book" && !book) {
            toast.error("Search for a book and pick a result");
            return;
        }
        if (mode === "link" && !url.trim()) {
            toast.error("Paste a link first");
            return;
        }
        if (mode === "text" && !textContent.trim()) {
            toast.error("Paste some text or switch to PDF upload");
            return;
        }
        if (mode === "text" && !title.trim()) {
            toast.error("Give your text a title");
            return;
        }
        setLoading(true);
        try {
            const fd = new FormData();
            if (mode === "pdf" && file) fd.append("file", file);
            if (mode === "text" && textContent.trim()) fd.append("text_content", textContent);
            if (mode === "book" && book) fd.append("book_id", book.id);
            if (mode === "link") {
                fd.append("source_url", url.trim());
                // Send the previewed text so the server doesn't fetch twice (PDFs are re-fetched so the file is stored)
                if (preview && !preview.is_pdf && preview.text) fd.append("text_content", preview.text);
                if (preview?.site_name) fd.append("site_name", preview.site_name);
            }
            if (title) fd.append("title", title);
            if (author) fd.append("author", author);
            if (readDate) fd.append("read_date", readDate);
            if (rating) fd.append("rating", String(rating));
            if (review) fd.append("review", review);
            fd.append("status", status);
            if (totalPages) fd.append("total_pages", String(totalPages));
            if (pagesRead) fd.append("pages_read", String(pagesRead));
            const created = await createReading(fd);
            toast.success(status === "reading" ? "Added to Currently Reading." : "Reading logged.");
            reset(); onOpenChange(false);
            onCreated && onCreated(created);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Failed to log reading");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1B2228] border-[#2C3440] text-white max-w-xl max-h-[90vh] overflow-y-auto" data-testid="log-reading-dialog">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl">Log a Reading</DialogTitle>
                    <DialogDescription className="text-xs text-[#99AABB]">Find a book, import an article from a link, upload a PDF, or paste text. AI extracts a synopsis when text is available.</DialogDescription>
                </DialogHeader>

                {/* Source mode toggle */}
                <div className="grid grid-cols-4 gap-2" data-testid="source-toggle">
                    {MODES.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setMode(id)}
                            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs sm:text-sm transition ${mode === id ? "border-[#40BCF4] bg-[#40BCF4]/10 text-[#40BCF4]" : "border-[#2C3440] text-[#99AABB] hover:text-white"}`}
                            data-testid={`source-${id}-btn`}
                        >
                            <Icon size={16} weight="fill" /> {label}
                        </button>
                    ))}
                </div>

                {/* Status toggle */}
                <div className="grid grid-cols-2 gap-2" data-testid="status-toggle">
                    <button
                        type="button"
                        onClick={() => setStatus("reading")}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition ${status === "reading" ? "border-[#FF8000] bg-[#FF8000]/10 text-[#FF8000]" : "border-[#2C3440] text-[#99AABB] hover:text-white"}`}
                        data-testid="status-reading-btn"
                    >
                        <BookOpen size={16} weight="fill" /> Currently Reading
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatus("completed")}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition ${status === "completed" ? "border-[#00E054] bg-[#00E054]/10 text-[#00E054]" : "border-[#2C3440] text-[#99AABB] hover:text-white"}`}
                        data-testid="status-completed-btn"
                    >
                        <CheckCircle size={16} weight="fill" /> Completed
                    </button>
                </div>

                {mode === "book" ? (
                    book ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-[#2C3440] bg-[#14181C]" data-testid="selected-book">
                            <BookThumb book={book} className="w-12 h-[72px]" />
                            <div className="min-w-0 flex-1">
                                <div className="font-heading font-bold truncate">{book.title}</div>
                                <div className="text-xs text-[#99AABB] truncate">{(book.authors || []).join(", ")}{book.year ? ` · ${book.year}` : ""}{book.page_count ? ` · ${book.page_count} pages` : ""}</div>
                                <LibraryBadge library={book.library} />
                            </div>
                            {book.library?.reading_id && (
                                <button type="button" onClick={() => { onOpenChange(false); nav(`/readings/${book.library.reading_id}`); }} className="text-xs text-[#00E054] hover:underline">Open</button>
                            )}
                            <button type="button" onClick={() => setBook(null)} className="text-[#667788] hover:text-white" title="Change book" data-testid="clear-book-btn"><X size={16} /></button>
                        </div>
                    ) : (
                        <BookSearch onPick={pickBook} autoFocus />
                    )
                ) : mode === "link" ? (
                    <div data-testid="link-import">
                        <div className="label-tag mb-1">Article or PDF link</div>
                        <div className="flex gap-2">
                            <Input
                                value={url}
                                onChange={(e) => { setUrl(e.target.value); setPreview(null); }}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchLink(); } }}
                                placeholder="https://…"
                                className="bg-[#14181C] border-[#2C3440]"
                                data-testid="link-input"
                            />
                            <Button type="button" onClick={fetchLink} disabled={fetching || !url.trim()} variant="outline" className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="fetch-link-btn">
                                {fetching ? <CircleNotch size={14} className="animate-spin" /> : "Fetch"}
                            </Button>
                        </div>
                        {preview ? (
                            <div className="mt-3 p-3 rounded-lg border border-[#2C3440] bg-[#14181C] text-sm" data-testid="link-preview">
                                <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-[#667788]">
                                    <span className="truncate">{preview.site_name}{preview.is_pdf ? " · PDF" : ""}</span>
                                    <span>{preview.word_count.toLocaleString()} words</span>
                                </div>
                                {preview.excerpt && <p className="mt-2 text-[#99AABB] text-xs leading-relaxed line-clamp-4">{preview.excerpt}</p>}
                                {preview.warning && (
                                    <div className="mt-2 flex gap-2 text-xs text-[#FF8000]"><Warning size={14} weight="fill" className="flex-shrink-0 mt-0.5" /> {preview.warning}</div>
                                )}
                                {preview.existing_reading && (
                                    <div className="mt-2 text-xs text-[#40BCF4]">
                                        Already in your library as "{preview.existing_reading.title}".{" "}
                                        <button type="button" className="underline" onClick={() => { onOpenChange(false); nav(`/readings/${preview.existing_reading.id}`); }}>Open it</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-[10px] text-[#667788] mt-1">Works for public articles, blogs and PDF links. Paywalled or login-only pages need the Chrome extension.</div>
                        )}
                    </div>
                ) : mode === "pdf" ? (
                    <label
                        htmlFor="pdf-file-input"
                        className="block cursor-pointer border-2 border-dashed border-[#2C3440] rounded-lg p-6 text-center hover:border-[#00E054] transition-colors"
                        data-testid="pdf-dropzone"
                    >
                        {file ? (
                            <div className="flex items-center justify-center gap-3">
                                <FilePdf size={28} color="#FF8000" weight="fill" />
                                <div className="text-left">
                                    <div className="font-medium">{file.name}</div>
                                    <div className="text-xs text-[#99AABB]">{(file.size/1024).toFixed(0)} KB</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-[#99AABB]">
                                <UploadSimple size={28} />
                                <div className="text-sm">Drop a PDF or click to browse</div>
                                <div className="text-xs">AI will auto-analyze and generate a synopsis</div>
                            </div>
                        )}
                        <input
                            id="pdf-file-input"
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            data-testid="pdf-file-input"
                        />
                    </label>
                ) : (
                    <div>
                        <div className="label-tag mb-1 flex items-center justify-between">
                            <span>Paste article or text</span>
                            <span className="text-[10px] text-[#667788] normal-case tracking-normal">Words are preserved exactly. Only paragraph spacing is auto-formatted.</span>
                        </div>
                        <Textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            rows={8}
                            placeholder="Paste the full article, essay, or excerpt here…"
                            className="bg-[#14181C] border-[#2C3440] leading-relaxed text-[14px]"
                            data-testid="paste-text-input"
                        />
                        <div className="text-[10px] uppercase tracking-widest text-[#667788] mt-1">
                            {textContent.trim().split(/\s+/).filter(Boolean).length} words
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="label-tag mb-1">Title{mode === "text" ? " *" : ""}</div>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === "text" ? "Required for pasted text" : "Optional (auto-filled)"} className="bg-[#14181C] border-[#2C3440]" data-testid="title-input" />
                    </div>
                    <div>
                        <div className="label-tag mb-1">Author</div>
                        <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-[#14181C] border-[#2C3440]" data-testid="author-input" />
                    </div>
                    <div>
                        <div className="label-tag mb-1">{status === "reading" ? "Date Started" : "Date Read"}</div>
                        <Input type="date" value={readDate} onChange={(e) => setReadDate(e.target.value)} className="bg-[#14181C] border-[#2C3440]" data-testid="date-input" />
                    </div>
                    <div>
                        <div className="label-tag mb-1">Rating</div>
                        <div className="pt-2"><StarRating value={rating} onChange={setRating} size={22} testId="log-rating" /></div>
                    </div>
                    {status === "reading" && (
                        <>
                            <div>
                                <div className="label-tag mb-1">Total Pages</div>
                                <Input type="number" min={0} value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder="e.g. 320" className="bg-[#14181C] border-[#2C3440]" data-testid="total-pages-input" />
                            </div>
                            <div>
                                <div className="label-tag mb-1">Pages Read</div>
                                <Input type="number" min={0} value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} placeholder="e.g. 87" className="bg-[#14181C] border-[#2C3440]" data-testid="pages-read-input" />
                            </div>
                        </>
                    )}
                </div>

                <div>
                    <div className="label-tag mb-1">Review / Thoughts</div>
                    <Textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} className="bg-[#14181C] border-[#2C3440]" data-testid="review-input" />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="cancel-log-btn">Cancel</Button>
                    <Button onClick={submit} disabled={loading} className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a] font-semibold" data-testid="submit-log-btn">
                        {loading ? (mode === "book" ? "Saving..." : "Analyzing...") : "Log Reading"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
