import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchDueHighlights, fetchRevisionReadings, reviewHighlight, fetchQuiz, generateQuiz } from "../lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Cover } from "../components/Cover";
import { useNavigate } from "react-router-dom";
import { Lightning } from "@phosphor-icons/react";

export const RevisionPage = () => {
    return (
        <div className="max-w-5xl mx-auto px-6 py-12" data-testid="revision-page">
            <div className="mb-8">
                <div className="label-tag mb-2">Revision</div>
                <h1 className="font-heading text-4xl font-bold">Cement what you've learned.</h1>
                <p className="text-[#99AABB] text-sm mt-2">Spaced repetition on your highlights, plus per-reading quizzes.</p>
            </div>
            <Tabs defaultValue="highlights">
                <TabsList className="bg-[#1B2228] border border-[#2C3440] p-1" data-testid="revision-tabs">
                    <TabsTrigger value="highlights" data-testid="tab-rev-highlights" className="data-[state=active]:bg-[#2C3440] data-[state=active]:text-white">Highlights Revision</TabsTrigger>
                    <TabsTrigger value="quizzes" data-testid="tab-rev-quizzes" className="data-[state=active]:bg-[#2C3440] data-[state=active]:text-white">Quizzes</TabsTrigger>
                </TabsList>
                <TabsContent value="highlights" className="mt-6"><HighlightsRevision /></TabsContent>
                <TabsContent value="quizzes" className="mt-6"><QuizzesList /></TabsContent>
            </Tabs>
        </div>
    );
};

const HighlightsRevision = () => {
    const [due, setDue] = useState([]);
    const [idx, setIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const load = () => fetchDueHighlights().then((d) => { setDue(d); setIdx(0); setFlipped(false); });
    useEffect(() => { load(); }, []);

    if (due.length === 0) {
        return <div className="text-center py-16 border border-dashed border-[#2C3440] rounded-lg text-[#99AABB]" data-testid="no-due">
            Nothing due. Add highlights on a reading to start spaced repetition.
        </div>;
    }
    if (idx >= due.length) {
        return <div className="text-center py-16 border border-dashed border-[#00E054] rounded-lg" data-testid="all-done">
            <div className="font-heading text-2xl mb-2">All done for today 🎉</div>
            <Button onClick={load} className="bg-[#00E054] text-[#14181C] mt-4">Reload</Button>
        </div>;
    }

    const current = due[idx];
    const grade = async (g) => {
        try { await reviewHighlight(current.id, g); }
        catch { toast.error("Failed"); }
        setIdx(idx + 1); setFlipped(false);
    };

    return (
        <div data-testid="highlights-revision">
            <div className="mb-4 flex items-center justify-between">
                <div className="label-tag">{idx + 1} / {due.length}</div>
                <div className="text-xs text-[#99AABB]">{current.reading_title}</div>
            </div>
            <div style={{ perspective: 1400 }} className="mb-6">
                <motion.div
                    className="relative w-full aspect-[16/9] cursor-pointer"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={() => setFlipped(!flipped)}
                    data-testid="flashcard"
                >
                    <div className="absolute inset-0 rounded-lg bg-[#1B2228] border border-[#2C3440] flex items-center justify-center p-10 text-center" style={{ backfaceVisibility: 'hidden' }}>
                        <div>
                            <Lightning size={22} color={current.cover_color} weight="fill" className="mx-auto mb-4" />
                            <div className="text-xl leading-relaxed">"{current.text}"</div>
                            <div className="mt-6 label-tag">Tap to reveal note</div>
                        </div>
                    </div>
                    <div className="absolute inset-0 rounded-lg bg-[#2C3440] border border-[#00E054]/40 flex items-center justify-center p-10 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div>
                            <div className="label-tag mb-2 text-[#00E054]">Reflection</div>
                            <div className="text-lg text-[#c8d3de]">{current.note || "(no reflection recorded — grade honestly)"}</div>
                        </div>
                    </div>
                </motion.div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => grade(0)} className="border-red-500 bg-transparent text-red-400 hover:bg-red-500/10" data-testid="grade-again">Again</Button>
                <Button variant="outline" onClick={() => grade(1)} className="border-orange-500 bg-transparent text-orange-400 hover:bg-orange-500/10" data-testid="grade-hard">Hard</Button>
                <Button variant="outline" onClick={() => grade(2)} className="border-[#40BCF4] bg-transparent text-[#40BCF4] hover:bg-[#40BCF4]/10" data-testid="grade-good">Good</Button>
                <Button variant="outline" onClick={() => grade(3)} className="border-[#00E054] bg-transparent text-[#00E054] hover:bg-[#00E054]/10" data-testid="grade-easy">Easy</Button>
            </div>
        </div>
    );
};

const QuizzesList = () => {
    const [readings, setReadings] = useState([]);
    const nav = useNavigate();
    useEffect(() => { fetchRevisionReadings().then(setReadings); }, []);
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="quizzes-list">
            {readings.map((r) => (
                <div key={r.id} className="cursor-pointer" onClick={() => nav(`/readings/${r.id}?tab=quiz`)} data-testid={`quiz-card-${r.id}`}>
                    <div className="cover-hover"><Cover title={r.title} color={r.cover_color} size="md" className="w-full h-auto aspect-[2/3]" /></div>
                    <div className="mt-2 text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-[#99AABB]">{r.highlight_count} highlights</div>
                </div>
            ))}
            {readings.length === 0 && <div className="col-span-4 py-12 text-center text-[#99AABB] border border-dashed border-[#2C3440] rounded-lg">No quizzes yet. Add highlights on readings to enable revision.</div>}
        </div>
    );
};
