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
    // Generated art wins; otherwise fall back to the catalog cover for books found via search
    const generated = reading?.cover_image_path && reading?.id ? coverUrl(reading.id) : null;
    const coverSrc = generated || reading?.cover_url || null;
    const displayTitle = title || reading?.title || "?";
    const displayColor = color || reading?.cover_color || "#00E054";
    const initials = (displayTitle || "?")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    const [imgError, setImgError] = useState(false);

    if (coverSrc && !imgError) {
        return (
            <div className={`relative overflow-hidden rounded-sm border border-[#2C3440] flex-shrink-0 ${sizes[size]} ${className}`}>
                <img
                    src={coverSrc}
                    alt={displayTitle}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                {size !== "xs" && generated && (
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
                        <div className="font-heading font-bold text-white text-xs sm:text-sm leading-tight line-clamp-3 drop-shadow-lg" style={{textShadow: '0 2px 6px rgba(0,0,0,0.9)'}}>
                            {displayTitle}
                        </div>
                    </div>
                )}
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
