import React from "react";

// Circular progress ring — size in px
export const ProgressRing = ({ value = 0, size = 44, stroke = 4, color = "#FF8000", track = "#2C3440", label }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, value));
    const offset = c - (pct / 100) * c;
    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} data-testid="progress-ring">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
                <circle
                    cx={size/2} cy={size/2} r={r}
                    stroke={color} strokeWidth={stroke} fill="none"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-heading font-bold text-white" style={{ fontSize: Math.max(9, size * 0.24) }}>
                {label !== undefined ? label : `${Math.round(pct)}%`}
            </div>
        </div>
    );
};
