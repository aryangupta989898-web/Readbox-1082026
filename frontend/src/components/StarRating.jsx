import React, { useState } from "react";
import { Star } from "@phosphor-icons/react";

export const StarRating = ({ value = 0, onChange, size = 18, readOnly = false, testId = "rating" }) => {
    const [hover, setHover] = useState(null);
    const display = hover != null ? hover : value || 0;

    return (
        <div className="inline-flex items-center gap-0.5" data-testid={testId}>
            {[1, 2, 3, 4, 5].map((i) => {
                const half = i - 0.5;
                const filled = display >= i;
                const halfFilled = !filled && display >= half;
                return (
                    <div key={i} className="relative cursor-pointer" style={{ width: size, height: size }}>
                        {!readOnly && (
                            <>
                                <div
                                    className="absolute inset-y-0 left-0 z-10"
                                    style={{ width: size / 2 }}
                                    onMouseEnter={() => setHover(half)}
                                    onMouseLeave={() => setHover(null)}
                                    onClick={() => onChange && onChange(half)}
                                    data-testid={`${testId}-half-${i}`}
                                />
                                <div
                                    className="absolute inset-y-0 right-0 z-10"
                                    style={{ width: size / 2 }}
                                    onMouseEnter={() => setHover(i)}
                                    onMouseLeave={() => setHover(null)}
                                    onClick={() => onChange && onChange(i)}
                                    data-testid={`${testId}-full-${i}`}
                                />
                            </>
                        )}
                        <Star size={size} weight="regular" color="#2C3440" />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: filled ? size : halfFilled ? size / 2 : 0 }}>
                            <Star size={size} weight="fill" color="#00E054" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
