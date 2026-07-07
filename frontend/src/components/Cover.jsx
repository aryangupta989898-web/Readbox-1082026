import React from "react";

export const Cover = ({ title, color = "#00E054", size = "md", className = "" }) => {
    const sizes = {
        xs: "w-10 h-14 text-[10px]",
        sm: "w-14 h-20 text-xs",
        md: "w-20 h-28 text-sm",
        lg: "w-32 h-48 text-base",
        xl: "w-48 h-72 text-lg",
    };
    const initials = (title || "?")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    return (
        <div
            className={`relative overflow-hidden rounded-sm border border-[#2C3440] flex-shrink-0 ${sizes[size]} ${className}`}
            style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}66 60%, #14181C 100%)`,
            }}
        >
            <div className="absolute inset-0 grain" />
            <div className="relative h-full w-full flex flex-col justify-end p-2">
                <div className="font-heading font-bold uppercase leading-tight text-white drop-shadow-md">
                    {initials}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-white/60 mt-1 line-clamp-2">
                    {title}
                </div>
            </div>
        </div>
    );
};
