import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Plus, PuzzlePiece } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { ExtensionDialog } from "./ExtensionDialog";

const links = [
    { to: "/", label: "Home", end: true },
    { to: "/readings", label: "Readings" },
    { to: "/diary", label: "Diary" },
    { to: "/lists", label: "Lists" },
    { to: "/wishlist", label: "Wishlist" },
    { to: "/likes", label: "Likes" },
    { to: "/revision", label: "Revision" },
    { to: "/recap", label: "Recap" },
];

export const NavBar = ({ onLog }) => {
    const [stamp, setStamp] = useState(false);
    const [extOpen, setExtOpen] = useState(false);
    return (
        <header
            className="sticky top-0 z-40 backdrop-blur-xl border-b"
            style={{ background: "rgba(20,24,28,0.9)", borderColor: "#2C3440" }}
            data-testid="app-header"
        >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
                <NavLink to="/" onClick={(e) => { e.preventDefault(); setStamp(true); setTimeout(() => setStamp(false), 1400); }} className="flex items-center gap-2 relative" data-testid="brand-link">
                    <BookOpen size={22} weight="fill" color="#00E054" />
                    <span className="font-heading font-bold text-lg tracking-tight">READBOX</span>
                    <AnimatePresence>
                        {stamp && (
                            <motion.div
                                initial={{ scale: 0.4, rotate: -18, opacity: 0 }}
                                animate={{ scale: 1, rotate: -8, opacity: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute -bottom-8 left-6 pointer-events-none"
                                style={{ fontFamily: "Cormorant Garamond, serif" }}
                            >
                                <div className="border-2 border-[#c8ae7d]/70 text-[#c8ae7d] text-[10px] uppercase tracking-[0.3em] px-2 py-1 rounded-sm italic">
                                    Ex Libris · You
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </NavLink>
                <nav className="flex items-center gap-6 flex-1">
                    {links.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            end={l.end}
                            data-testid={`nav-${l.label.toLowerCase()}`}
                            className={({ isActive }) =>
                                `text-sm font-medium transition-colors ${
                                    isActive ? "text-white border-b-2 border-[#00E054] pb-1" : "text-[#99AABB] hover:text-white"
                                }`
                            }
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>
                <button
                    onClick={() => setExtOpen(true)}
                    className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#99AABB] hover:text-white transition border border-[#2C3440] hover:border-[#00E054] px-3 py-1.5 rounded-full"
                    data-testid="header-extension-btn"
                    title="Chrome extension setup"
                >
                    <PuzzlePiece size={13} weight="fill" />
                    Extension
                </button>
                <Button
                    onClick={onLog}
                    className="rounded-full bg-[#00E054] text-[#14181C] hover:bg-[#00c94a] font-semibold"
                    data-testid="header-log-reading-btn"
                >
                    <Plus size={16} weight="bold" className="mr-1" /> Log
                </Button>
            </div>
            <ExtensionDialog open={extOpen} onOpenChange={setExtOpen} />
        </header>
    );
};
