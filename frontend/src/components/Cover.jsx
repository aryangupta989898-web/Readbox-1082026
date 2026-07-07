import React, { useState, useEffect } from "react";
import { coverUrl } from "../lib/api";

export const Cover = ({ reading, title, color = "#00E054", size = "md", className = "", showFallback = true }) => {
    const sizes = {
        xs: "w-10 h-14 text-[10px]",
        sm: "w-14 h-20 text-xs",
        md: "w-20 h-28 text-sm",
        lg: "w-32 h-48 text-base",
        xl: "w-48 h-72 text-lg",
    };
    const hasCover = reading?.cover_image_path;
    const displayTitle = title || reading?.title || "?";
    const displayColor = color || reading?.cover_color || "#00E054";
    const initials = (displayTitle || "?")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    const [imgError, setImgError] = useState(false);

    if (hasCover && !imgError && reading?.id) {
        return (
            <div className={`relative overflow-hidden rounded-sm border border-[#2C3440] flex-shrink-0 ${sizes[size]} ${className}`}>
                <img
                    src={coverUrl(reading.id)}
                    alt={displayTitle}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    if (!showFallback) return null;

    return (
        <div
            className={`relative overflow-hidden rounded-sm border border-[#2C3440] flex-shrink-0 ${sizes[size]} ${className}`}
            style={{ background: `linear-gradient(135deg, ${displayColor} 0%, ${displayColor}66 60%, #14181C 100%)` }}
        >
            <div className="absolute inset-0 grain" />
            <div className="relative h-full w-full flex flex-col justify-end p-2">
                <div className="font-heading font-bold uppercase leading-tight text-white drop-shadow-md">{initials}</div>
                <div className="text-[9px] uppercase tracking-widest text-white/60 mt-1 line-clamp-2">{displayTitle}</div>
            </div>
        </div>
    );
};
