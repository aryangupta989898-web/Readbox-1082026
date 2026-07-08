import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    fetchReading, updateReading, deleteReading,
    generateChecklist, fetchChecklist, toggleChecklist,
    generateNotes, fetchNotes,
    createHighlight, fetchHighlights, deleteHighlight,
    generateQuiz, fetchQuiz,
    updateTags, generateCover,
    suggestHighlights, toggleLike,
} from "../lib/api";
import { Cover } from "../components/Cover";
import { StarRating } from "../components/StarRating";
import { TagsPicker } from "../components/TagsPicker";
import { ProgressRing } from "../components/ProgressRing";
import { AddToListButton } from "../components/AddToListButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Checkbox } from "../components/ui/checkbox";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Heart, Trash, ArrowLeft, Sparkle, Plus, Image as ImageIcon, PencilSimple, BookOpen, CheckCircle, Check } from "@phosphor-icons/react";
import { toast } from "sonner";

export const ReadingDetailPage = () => {
    const { id } = useParams();
    const nav = useNavigate();
    const [reading, setReading] = useState(null);
    const [checklist, setChecklist] = useState([]);
    const [notes, setNotes] = useState(null);
    const [highlights, setHighlights] = useState([]);
    const [quiz, setQuiz] = useState(null);
    const [busy, setBusy] = useState("");
    const [newHighlight, setNewHighlight] = useState("");
    const [review, setReview] = useState("");
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [coverBusy, setCoverBusy] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestBusy, setSuggestBusy] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState(false);
    const [authorDraft, setAuthorDraft] = useState("");
    const [pagesBusy, setPagesBusy] = useState(false);

    const runSuggest = async () => {
        setSuggestBusy(true);
        try { const s = await suggestHighlights(id); setSuggestions(s); toast.success(`${s.length} insights extracted`); }
        catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
        finally { setSuggestBusy(false); }
    };
    const saveSuggestion = async (text) => {
        const h = await createHighlight(id, { text });
        setHighlights([...highlights, h]);
        setSuggestions(suggestions.filter((s) => s !== text));
        toast.success("Saved");
    };

    const genCover = async () => {
        setCoverBusy(true);
        try { await generateCover(id); await load(); toast.success("Cover generated"); }
        catch { toast.error("Cover generation failed"); }
        finally { setCoverBusy(false); }
    };

    const setTags = async (tags) => {
        try { await updateTags(id, tags); setReading({ ...reading, tags }); }
        catch { toast.error("Failed to save tags"); }
    };

    const load = async () => {
        const r = await fetchReading(id);
        setReading(r); setReview(r.review || "");
        const [c, n, h, q] = await Promise.all([
            fetchChecklist(id), fetchNotes(id), fetchHighlights(id), fetchQuiz(id),
        ]);
        setChecklist(c); setNotes(n); setHighlights(h); setQuiz(q);
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    if (!reading) return <div className="max-w-4xl mx-auto p-12 text-[#99AABB]">Loading...</div>;

    const patch = async (p) => { const u = await updateReading(id, p); setReading(u); };
    const doDelete = async () => { if (confirm("Delete this reading?")) { await deleteReading(id); nav("/readings"); } };

    const runChecklist = async () => {
        setBusy("checklist");
        try { const items = await generateChecklist(id); setChecklist(items); toast.success("Checklist generated"); }
        catch { toast.error("Failed to generate checklist"); }
        finally { setBusy(""); }
    };
    const runNotes = async () => {
        setBusy("notes");
        try { const n = await generateNotes(id); setNotes(n); toast.success("Notes generated"); }
        catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
        finally { setBusy(""); }
    };
    const runQuiz = async () => {
        setBusy("quiz");
        try { const q = await generateQuiz(id); setQuiz(q); setQuizAnswers({}); setQuizSubmitted(false); toast.success("Quiz generated"); }
        catch { toast.error("Failed to generate quiz"); }
        finally { setBusy(""); }
    };
    const addHighlight = async () => {
        if (!newHighlight.trim()) return;
        const h = await createHighlight(id, { text: newHighlight.trim() });
        setHighlights([...highlights, h]); setNewHighlight("");
        toast.success("Highlight saved for spaced repetition");
    };
    const removeHighlight = async (hid) => {
        await deleteHighlight(hid); setHighlights(highlights.filter((h) => h.id !== hid));
    };
    const tickChecklist = async (item) => {
        await toggleChecklist(item.id, !item.checked);
        setChecklist(checklist.map((c) => c.id === item.id ? { ...c, checked: !c.checked } : c));
    };

    const allChecked = checklist.length > 0 && checklist.every((c) => c.checked);
    const toggleSelectAll = async () => {
        const nextState = !allChecked;
        setChecklist(checklist.map((c) => ({ ...c, checked: nextState })));
        const toFlip = checklist.filter((c) => c.checked !== nextState);
        try {
            await Promise.all(toFlip.map((c) => toggleChecklist(c.id, nextState)));
        } catch {
            toast.error("Some items failed to update");
            const fresh = await fetchChecklist(id);
            setChecklist(fresh);
        }
    };

    const saveAuthor = async () => {
        const trimmed = authorDraft.trim();
        if (trimmed === (reading.author || "")) { setEditingAuthor(false); return; }
        await patch({ author: trimmed });
        setEditingAuthor(false);
        toast.success("Author updated");
    };

    const setStatus = async (next) => {
        setPagesBusy(true);
        try {
            const payload = { status: next };
            if (next === "reading" && (reading.pages_read === null || reading.pages_read === undefined)) {
                payload.pages_read = 0;
            }
            const u = await updateReading(id, payload);
            setReading(u);
            toast.success(next === "reading" ? "Marked as Currently Reading" : "Marked as Completed");
        } catch { toast.error("Failed to update status"); }
        finally { setPagesBusy(false); }
    };

    const savePages = async (field, value) => {
        const v = value === "" ? null : Math.max(0, parseInt(value, 10) || 0);
        const payload = { [field]: v };
        if (field === "pages_read" && reading.total_pages && v >= reading.total_pages && v > 0) {
            payload.status = "completed";
        }
        const u = await updateReading(id, payload);
        setReading(u);
    };

    const flipLike = async () => {
        const next = !reading.liked;
        setReading({ ...reading, liked: next });
        try { await toggleLike(id, next); }
        catch { toast.error("Failed"); setReading({ ...reading, liked: !next }); }
    };

    const isReading = reading.status === "reading";
    const pct = reading.total_pages > 0 ? Math.min(100, Math.round(((reading.pages_read || 0) / reading.total_pages) * 100)) : 0;


    return (
        <div className="pb-24" data-testid="reading-detail-page">
            {/* Hero */}
            <div className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${reading.cover_color}22 0%, #14181C 100%)` }}>
                <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-[auto_1fr] gap-8">
                    <div className="flex flex-col items-center gap-3">
                        <Cover reading={reading} title={reading.title} color={reading.cover_color} size="xl" />
                        <Button
                            onClick={genCover}
                            disabled={coverBusy}
                            variant="outline"
                            className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440] text-xs w-48"
                            data-testid="gen-cover-btn"
                        >
                            <ImageIcon size={14} className="mr-1" />
                            {coverBusy ? "Generating..." : reading.cover_image_path ? "Regenerate Cover" : "Generate Cover"}
                        </Button>
                        <AddToListButton readingId={id} />
                    </div>
                    <div>
                        <button onClick={() => nav(-1)} className="text-xs text-[#99AABB] hover:text-white flex items-center gap-1 mb-4" data-testid="back-btn"><ArrowLeft size={14}/>Back</button>
                        <div className="label-tag mb-2">Reading Log · {reading.read_date}</div>
                        <h1 className="font-heading text-4xl font-bold mb-2">{reading.title}</h1>
                        {editingAuthor ? (
                            <div className="flex items-center gap-2 mb-4" data-testid="author-edit">
                                <Input
                                    value={authorDraft}
                                    onChange={(e) => setAuthorDraft(e.target.value)}
                                    placeholder="Author name"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && saveAuthor()}
                                    className="bg-[#1B2228] border-[#2C3440] text-white max-w-xs"
                                    data-testid="author-edit-input"
                                />
                                <Button size="sm" onClick={saveAuthor} className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a]" data-testid="author-save-btn">Save</Button>
                                <Button size="sm" variant="outline" onClick={() => { setEditingAuthor(false); setAuthorDraft(reading.author || ""); }} className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]" data-testid="author-cancel-btn">Cancel</Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mb-4 group">
                                {reading.author ? (
                                    <button
                                        onClick={() => nav(`/author/${encodeURIComponent(reading.author)}`)}
                                        className="text-[#99AABB] hover:text-[#c8ae7d] hover:underline underline-offset-4 transition"
                                        data-testid="author-link"
                                    >
                                        by <span className="italic" style={{ fontFamily: "Cormorant Garamond, serif" }}>{reading.author}</span>
                                    </button>
                                ) : (
                                    <span className="text-[#667788] italic text-sm">by Unknown</span>
                                )}
                                <button
                                    onClick={() => setEditingAuthor(true)}
                                    className="opacity-0 group-hover:opacity-100 text-[#667788] hover:text-white transition"
                                    title="Edit author"
                                    data-testid="author-edit-btn"
                                >
                                    <PencilSimple size={14} />
                                </button>
                            </div>
                        )}

                        {/* Status control */}
                        <div className="flex items-center gap-2 mb-4" data-testid="status-controls">
                            <button
                                onClick={() => setStatus(isReading ? "completed" : "reading")}
                                disabled={pagesBusy}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs uppercase tracking-widest transition ${isReading ? "border-[#FF8000] bg-[#FF8000]/10 text-[#FF8000] hover:bg-[#FF8000]/20" : "border-[#00E054] bg-[#00E054]/10 text-[#00E054] hover:bg-[#00E054]/20"}`}
                                data-testid="status-toggle-btn"
                            >
                                {isReading ? <><BookOpen size={12} weight="fill" /> Currently Reading</> : <><CheckCircle size={12} weight="fill" /> Completed</>}
                            </button>
                            {isReading && (
                                <div className="flex items-center gap-2 text-xs text-[#99AABB]" data-testid="pages-controls">
                                    <input
                                        type="number"
                                        min={0}
                                        max={reading.total_pages || 99999}
                                        value={reading.pages_read ?? ""}
                                        onChange={(e) => setReading({ ...reading, pages_read: e.target.value === "" ? null : parseInt(e.target.value, 10) || 0 })}
                                        onBlur={(e) => savePages("pages_read", e.target.value)}
                                        placeholder="0"
                                        className="w-16 bg-[#1B2228] border border-[#2C3440] rounded px-2 py-1 text-center text-white focus:outline-none focus:border-[#FF8000]"
                                        data-testid="pages-read-input"
                                    />
                                    <span>/</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={reading.total_pages ?? ""}
                                        onChange={(e) => setReading({ ...reading, total_pages: e.target.value === "" ? null : parseInt(e.target.value, 10) || 0 })}
                                        onBlur={(e) => savePages("total_pages", e.target.value)}
                                        placeholder="—"
                                        className="w-16 bg-[#1B2228] border border-[#2C3440] rounded px-2 py-1 text-center text-white focus:outline-none focus:border-[#FF8000]"
                                        data-testid="total-pages-input"
                                    />
                                    <span className="uppercase tracking-widest text-[10px] text-[#667788]">pages</span>
                                    {reading.total_pages > 0 && (
                                        <div className="ml-2"><ProgressRing value={pct} size={32} stroke={3} color="#FF8000" /></div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <TagsPicker tags={reading.tags || []} onChange={setTags} />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <StarRating value={reading.rating || 0} onChange={(v) => patch({ rating: v })} size={22} testId="detail-rating" />
                            <button onClick={flipLike} className="transition-transform hover:scale-110" data-testid="like-btn">
                                <Heart size={26} weight={reading.liked ? "fill" : "regular"} color={reading.liked ? "#FF2A79" : "#667788"} />
                            </button>
                            {reading.storage_path && (
                                <a href={`${process.env.REACT_APP_BACKEND_URL}/api/readings/${id}/pdf`} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-widest text-[#40BCF4] hover:underline" data-testid="view-pdf-link">Open PDF</a>
                            )}
                            <button onClick={doDelete} className="ml-auto text-[#667788] hover:text-red-400 transition" data-testid="delete-btn"><Trash size={18} /></button>
                        </div>
                        <Textarea
                            placeholder="Write your thoughts and review..."
                            className="bg-[#1B2228] border-[#2C3440] min-h-24"
                            value={review} onChange={(e) => setReview(e.target.value)}
                            onBlur={() => review !== reading.review && patch({ review })}
                            data-testid="review-textarea"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-8">
                <Tabs defaultValue="synopsis" className="w-full">
                    <TabsList className="bg-[#1B2228] border border-[#2C3440] p-1 flex flex-wrap" data-testid="detail-tabs">
                        <TabsTrigger value="synopsis" data-testid="tab-synopsis" className="data-[state=active]:bg-[#2C3440] data-[state=active]:text-white">Synopsis</TabsTrigger>
                        <TabsTrigger value="checklist" data-testid="tab-checklist" className="data-[state=active]:bg-[#2C3440] data-[state=active]:text-white">Topics Checklist</TabsTrigger>
                        <TabsTrigger value="notes" data-testid="tab-notes" className="data-[state=active]:bg-[#2C3440] data-[state=active]:text-white">AI Notes</TabsTrigger>
                        <TabsTrigger value="highlights" data-testid="tab-highlights" className="data-[state=active]:bg-[#2C3440] data-[state=active]:text-white">My Highlights</TabsTrigger>
                        <TabsTrigger value="quiz" data-testid="tab-quiz" className="data-[state=active]:bg-[#2C3440] data-[state=active]:text-white">Quiz</TabsTrigger>
                    </TabsList>

                    <TabsContent value="synopsis" className="mt-6">
                        <div className="bg-[#1B2228] border border-[#2C3440] rounded-lg p-6" data-testid="synopsis-panel">
                            <div className="label-tag mb-2 flex items-center gap-2"><Sparkle size={12} color="#00E054" weight="fill"/> AI Synopsis</div>
                            {reading.synopsis ? (
                                <p className="text-[#c8d3de] leading-relaxed">{reading.synopsis}</p>
                            ) : (
                                <p className="text-[#667788] italic">No synopsis available (upload a PDF to enable AI analysis).</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="checklist" className="mt-6">
                        <div className="bg-[#1B2228] border border-[#2C3440] rounded-lg p-6" data-testid="checklist-panel">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="label-tag mb-1">AI Topic Checklist</div>
                                    <div className="text-xs text-[#99AABB]">Check the topics you want to learn — AI will generate detailed notes only on those.</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {checklist.length > 0 && (
                                        <Button
                                            onClick={toggleSelectAll}
                                            variant="outline"
                                            size="sm"
                                            className="border-[#2C3440] bg-transparent text-white hover:bg-[#2C3440]"
                                            data-testid="select-all-btn"
                                        >
                                            <Check size={12} className="mr-1" />
                                            {allChecked ? "Deselect All" : "Select All"}
                                        </Button>
                                    )}
                                    <Button onClick={runChecklist} disabled={busy==="checklist"} className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a]" data-testid="gen-checklist-btn">
                                        <Sparkle size={14} className="mr-1"/>{checklist.length ? "Regenerate" : "Generate"}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {checklist.map((it) => (
                                    <label key={it.id} className="flex items-start gap-3 p-3 rounded hover:bg-[#222B33] cursor-pointer" data-testid={`checklist-item-${it.id}`}>
                                        <Checkbox checked={it.checked} onCheckedChange={() => tickChecklist(it)} className="mt-1 border-[#2C3440] data-[state=checked]:bg-[#00E054] data-[state=checked]:text-[#14181C]" data-testid={`checkbox-${it.id}`} />
                                        <div>
                                            <div className="font-medium">{it.topic}</div>
                                            {it.description && <div className="text-xs text-[#99AABB]">{it.description}</div>}
                                        </div>
                                    </label>
                                ))}
                                {checklist.length === 0 && <div className="text-[#667788] text-sm italic">No topics yet. Click Generate.</div>}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-6">
                        <div className="bg-[#1B2228] border border-[#2C3440] rounded-lg p-6" data-testid="notes-panel">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="label-tag mb-1">AI Summary Notes</div>
                                    <div className="text-xs text-[#99AABB]">Generated from your checked topics.</div>
                                </div>
                                <Button onClick={runNotes} disabled={busy==="notes"} className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a]" data-testid="gen-notes-btn">
                                    <Sparkle size={14} className="mr-1"/>{notes ? "Regenerate" : "Generate"}
                                </Button>
                            </div>
                            {notes ? (
                                <NotesRenderer content={notes.content} />
                            ) : (
                                <div className="text-[#667788] italic text-sm">Check some topics on the Checklist tab, then click Generate.</div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="highlights" className="mt-6">
                        <div className="bg-[#1B2228] border border-[#2C3440] rounded-lg p-6" data-testid="highlights-panel">
                            <div className="flex items-center justify-between mb-1">
                                <div className="label-tag">My Highlights</div>
                                <Button onClick={runSuggest} disabled={suggestBusy} size="sm" variant="outline" className="border-[#FF8000]/50 bg-transparent text-[#FF8000] hover:bg-[#FF8000]/10" data-testid="suggest-highlights-btn">
                                    <Sparkle size={12} className="mr-1" />{suggestBusy ? "Extracting..." : "Suggest 4 Key Insights"}
                                </Button>
                            </div>
                            <div className="text-xs text-[#99AABB] mb-4">Add quotes/insights to review via spaced repetition.</div>

                            {suggestions.length > 0 && (
                                <div className="mb-4 space-y-2" data-testid="suggested-highlights">
                                    <div className="label-tag text-[#FF8000]">AI-Extracted Holy-Grail Insights</div>
                                    {suggestions.map((s, i) => (
                                        <div key={i} className="flex items-start justify-between gap-3 p-3 rounded border-l-2 border-[#FFB800] bg-[#FFB800]/5" data-testid={`suggestion-${i}`}>
                                            <div className="text-sm text-[#c8d3de] italic flex-1">"{s}"</div>
                                            <Button size="sm" onClick={() => saveSuggestion(s)} className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a] shrink-0" data-testid={`save-suggestion-${i}`}>
                                                <Plus size={12} className="mr-1" />Save
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2 mb-4">
                                <Textarea value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)} placeholder="Add a highlight..." className="bg-[#14181C] border-[#2C3440] flex-1" data-testid="new-highlight-input" />
                                <Button onClick={addHighlight} className="bg-[#FF8000] text-white hover:bg-[#e67300]" data-testid="add-highlight-btn"><Plus size={14}/></Button>
                            </div>
                            <div className="space-y-2">
                                {highlights.map((h) => (
                                    <div key={h.id} className="flex items-start justify-between gap-3 p-3 rounded border-l-2 border-[#FF8000] bg-[#14181C]" data-testid={`highlight-${h.id}`}>
                                        <div className="text-sm text-[#c8d3de] italic">"{h.text}"</div>
                                        <button onClick={() => removeHighlight(h.id)} className="text-[#667788] hover:text-red-400" data-testid={`del-highlight-${h.id}`}><Trash size={14} /></button>
                                    </div>
                                ))}
                                {highlights.length === 0 && <div className="text-[#667788] italic text-sm">No highlights yet.</div>}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="quiz" className="mt-6">
                        <div className="bg-[#1B2228] border border-[#2C3440] rounded-lg p-6" data-testid="quiz-panel">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="label-tag mb-1">Quiz Yourself</div>
                                    <div className="text-xs text-[#99AABB]">AI-generated MCQs from this reading.</div>
                                </div>
                                <Button onClick={runQuiz} disabled={busy==="quiz"} className="bg-[#40BCF4] text-[#14181C] hover:bg-[#2eabe4]" data-testid="gen-quiz-btn">
                                    <Sparkle size={14} className="mr-1"/>{quiz ? "Regenerate" : "Generate"}
                                </Button>
                            </div>
                            {quiz && quiz.questions?.length > 0 ? (
                                <div className="space-y-6">
                                    {quiz.questions.map((q, qi) => (
                                        <div key={qi} className="border border-[#2C3440] rounded p-4" data-testid={`quiz-q-${qi}`}>
                                            <div className="font-medium mb-3">{qi + 1}. {q.q}</div>
                                            <div className="space-y-2">
                                                {q.options.map((opt, oi) => {
                                                    const selected = quizAnswers[qi] === oi;
                                                    const isCorrect = q.answer === oi;
                                                    let cls = "border-[#2C3440] hover:border-[#40BCF4]";
                                                    if (quizSubmitted) {
                                                        if (isCorrect) cls = "border-[#00E054] bg-[#00E054]/10";
                                                        else if (selected && !isCorrect) cls = "border-red-500 bg-red-500/10";
                                                    } else if (selected) cls = "border-[#40BCF4] bg-[#40BCF4]/10";
                                                    return (
                                                        <button
                                                            key={oi}
                                                            onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                                                            className={`block w-full text-left px-3 py-2 rounded border ${cls} text-sm transition`}
                                                            data-testid={`quiz-q-${qi}-opt-${oi}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {quizSubmitted && q.explanation && (
                                                <div className="mt-2 text-xs text-[#99AABB]">💡 {q.explanation}</div>
                                            )}
                                        </div>
                                    ))}
                                    {!quizSubmitted ? (
                                        <Button onClick={() => setQuizSubmitted(true)} className="bg-[#00E054] text-[#14181C]" data-testid="submit-quiz-btn">Check Answers</Button>
                                    ) : (
                                        <div className="text-sm text-[#99AABB]" data-testid="quiz-score">
                                            Score: {quiz.questions.filter((q, i) => quizAnswers[i] === q.answer).length} / {quiz.questions.length}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[#667788] italic text-sm">No quiz yet. Click Generate.</div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

const NotesRenderer = ({ content }) => {
    // Essay-style rendering: paragraphs, italic rhetorical questions, drop cap on first paragraph
    const lines = content.split(/\n+/).filter(Boolean);
    let title = null;
    const paragraphs = [];
    lines.forEach((l) => {
        const t = l.trim();
        if (t.startsWith("## ") && !title) { title = t.replace(/^##\s*/, ""); return; }
        if (t.startsWith("# ") && !title) { title = t.replace(/^#\s*/, ""); return; }
        if (t.startsWith("#")) { title = t.replace(/^#+\s*/, ""); return; }
        paragraphs.push(t.replace(/^[-*]\s+/, ""));  // strip stray bullets
    });

    const renderPara = (text, idx) => {
        // Detect rhetorical questions and italicize them
        const parts = text.split(/(?<=[?!])\s+/);
        return (
            <p key={idx} className={`text-[#c8d3de] leading-[1.85] text-[15px] ${idx === 0 ? "first-letter:text-5xl first-letter:font-heading first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.9] first-letter:text-[#00E054]" : ""}`}>
                {parts.map((p, i) => {
                    if (p.trim().endsWith("?")) {
                        return <span key={i} className="italic text-[#40BCF4]">{p} </span>;
                    }
                    // bold **text**
                    const bolded = p.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
                        if (seg.startsWith("**") && seg.endsWith("**")) return <strong key={j} className="text-white">{seg.slice(2, -2)}</strong>;
                        return <span key={j}>{seg}</span>;
                    });
                    return <span key={i}>{bolded} </span>;
                })}
            </p>
        );
    };

    return (
        <div className="prose-essay space-y-5" data-testid="notes-content">
            {title && <h2 className="font-heading text-3xl font-bold text-white mb-2">{title}</h2>}
            {paragraphs.map(renderPara)}
        </div>
    );
};
