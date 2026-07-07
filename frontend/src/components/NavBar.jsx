import React from "react";
import { NavLink } from "react-router-dom";
import { BookOpen, Plus } from "@phosphor-icons/react";
import { Button } from "./ui/button";

const links = [
    { to: "/", label: "Activity", end: true },
    { to: "/readings", label: "Readings" },
    { to: "/diary", label: "Diary" },
    { to: "/revision", label: "Revision" },
    { to: "/recap", label: "Recap" },
];

export const NavBar = ({ onLog }) => {
    return (
        <header
            className="sticky top-0 z-40 backdrop-blur-xl border-b"
            style={{ background: "rgba(20,24,28,0.9)", borderColor: "#2C3440" }}
            data-testid="app-header"
        >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
                <NavLink to="/" className="flex items-center gap-2" data-testid="brand-link">
                    <BookOpen size={22} weight="fill" color="#00E054" />
                    <span className="font-heading font-bold text-lg tracking-tight">READBOX</span>
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
                <Button
                    onClick={onLog}
                    className="rounded-full bg-[#00E054] text-[#14181C] hover:bg-[#00c94a] font-semibold"
                    data-testid="header-log-reading-btn"
                >
                    <Plus size={16} weight="bold" className="mr-1" /> Log
                </Button>
            </div>
        </header>
    );
};
