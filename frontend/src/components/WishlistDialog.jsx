import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { UploadSimple, FilePdf } from "@phosphor-icons/react";
import { createWishlist } from "../lib/api";
import { toast } from "sonner";

export const WishlistDialog = ({ open, onOpenChange, onCreated }) => {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const reset = () => { setTitle(""); setAuthor(""); setNotes(""); setFile(null); };

    const submit = async () => {
        if (!title.trim()) return;
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("title", title.trim());
            if (author) fd.append("author", author.trim());
            if (notes) fd.append("notes", notes);
            if (file) fd.append("file", file);
            const created = await createWishlist(fd);
            toast.success("Added to Wishlist");
            onCreated && onCreated(created);
            reset();
            onOpenChange(false);
        } catch { toast.error("Failed to add"); }
        finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
            <DialogContent className="bg-[#1B2228] border-[#2C3440] text-white max-w-md" data-testid="wishlist-dialog">
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl">Add to Wishlist</DialogTitle>
                    <DialogDescription className="text-xs text-[#99AABB]">Attach a PDF, or just jot down the title. Promote to Currently Reading anytime.</DialogDescription>
                </DialogHeader>

                <div>
                    <div className="label-tag mb-1">Title *</div>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Zero to One" className="bg-[#14181C] border-[#2C3440]" autoFocus data-testid="wishlist-title-input" />
                </div>

                <div>
                    <div className="label-tag mb-1">Author</div>
                    <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Optional" className="bg-[#14181C] border-[#2C3440]" data-testid="wishlist-author-input" />
                </div>

                <div>
                    <div className="label-tag mb-1">Notes</div>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why do you want to read this?" rows={2} className="bg-[#14181C] border-[#2C3440]" data-testid="wishlist-notes-input" />
                </div>

                <label
                    htmlFor="wishlist-pdf-input"
                    className="block cursor-pointer border-2 border-dashed border-[#2C3440] rounded-lg p-4 text-center hover:border-[#40BCF4] transition"
                    data-testid="wishlist-dropzone"
                >
                    {file ? (
                        <div className="flex items-center justify-center gap-2">
                            <FilePdf size={22} color="#FF8000" weight="fill" />
                            <div className="text-left">
                                <div className="text-sm font-medium truncate max-w-[200px]">{file.name}</div>
                                <div className="text-[10px] text-[#99AABB]">{(file.size/1024).toFixed(0)} KB</div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-[#99AABB]">
                            <UploadSimple size={18} />
                            <div className="text-xs">Optional: attach PDF to read later</div>
                        </div>
                    )}
                    <input
                        id="wishlist-pdf-input"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        data-testid="wishlist-pdf-input"
                    />
                </label>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="cancel-wishlist-btn">Cancel</Button>
                    <Button onClick={submit} disabled={!title.trim() || loading} className="bg-[#40BCF4] text-[#14181C] hover:bg-[#2eabe4] font-semibold" data-testid="submit-wishlist-btn">
                        {loading ? "Adding..." : "Add to Wishlist"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
