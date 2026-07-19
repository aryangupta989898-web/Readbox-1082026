import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { StarRating } from "./StarRating";
import { UploadSimple, FilePdf, BookOpen, CheckCircle, TextAlignLeft } from "@phosphor-icons/react";
import { createReading } from "../lib/api";
import { toast } from "sonner";

export const LogReadingDialog = ({ open, onOpenChange, onCreated }) => {
    const [mode, setMode] = useState("pdf"); // "pdf" | "text"
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
        setMode("pdf");
        setFile(null); setTextContent(""); setTitle(""); setAuthor("");
        setReadDate(new Date().toISOString().slice(0, 10));
        setRating(0); setReview("");
        setStatus("completed"); setTotalPages(""); setPagesRead("");
    };

    const submit = async () => {
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
                    <DialogDescription className="text-xs text-[#99AABB]">Upload a PDF, paste text from an article, or add manually. AI extracts a synopsis when text is available.</DialogDescription>
                </DialogHeader>

                {/* Source mode toggle */}
                <div className="grid grid-cols-2 gap-2" data-testid="source-toggle">
                    <button
                        type="button"
                        onClick={() => setMode("pdf")}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition ${mode === "pdf" ? "border-[#40BCF4] bg-[#40BCF4]/10 text-[#40BCF4]" : "border-[#2C3440] text-[#99AABB] hover:text-white"}`}
                        data-testid="source-pdf-btn"
                    >
                        <FilePdf size={16} weight="fill" /> Upload PDF
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("text")}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition ${mode === "text" ? "border-[#40BCF4] bg-[#40BCF4]/10 text-[#40BCF4]" : "border-[#2C3440] text-[#99AABB] hover:text-white"}`}
                        data-testid="source-text-btn"
                    >
                        <TextAlignLeft size={16} weight="fill" /> Paste Text
                    </button>
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

                {mode === "pdf" ? (
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
                        {loading ? "Analyzing..." : "Log Reading"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
