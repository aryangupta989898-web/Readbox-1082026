import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { StarRating } from "./StarRating";
import { UploadSimple, FilePdf, BookOpen, CheckCircle } from "@phosphor-icons/react";
import { createReading } from "../lib/api";
import { toast } from "sonner";

export const LogReadingDialog = ({ open, onOpenChange, onCreated }) => {
    const [file, setFile] = useState(null);
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
        setFile(null); setTitle(""); setAuthor("");
        setReadDate(new Date().toISOString().slice(0, 10));
        setRating(0); setReview("");
        setStatus("completed"); setTotalPages(""); setPagesRead("");
    };

    const submit = async () => {
        setLoading(true);
        try {
            const fd = new FormData();
            if (file) fd.append("file", file);
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
            toast.error("Failed to log reading");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1B2228] border-[#2C3440] text-white max-w-xl max-h-[90vh] overflow-y-auto" data-testid="log-reading-dialog">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl">Log a Reading</DialogTitle>
                </DialogHeader>

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

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="label-tag mb-1">Title</div>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional (auto-filled)" className="bg-[#14181C] border-[#2C3440]" data-testid="title-input" />
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
