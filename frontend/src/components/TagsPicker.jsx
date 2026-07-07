import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
    Sword, Skull, Fire, Lightning, Leaf, Book, Brain, Heart,
    Star, Compass, Feather, Crown, Diamond, Flag, Moon, Rocket,
    Anchor, Eye, Ghost, PawPrint, Plant, Sun, Target, X,
} from "@phosphor-icons/react";

export const ICONS = {
    Sword, Skull, Fire, Lightning, Leaf, Book, Brain, Heart,
    Star, Compass, Feather, Crown, Diamond, Flag, Moon, Rocket,
    Anchor, Eye, Ghost, PawPrint, Plant, Sun, Target,
};

const COLORS = [
    "#00E054", "#FF8000", "#40BCF4", "#FF2A79", "#9D4EDD",
    "#FFB800", "#F5A623", "#5B8FF9", "#E74C3C", "#1ABC9C",
    "#E056FD", "#95A5A6",
];

const ICON_NAMES = Object.keys(ICONS);

export const TagChip = ({ tag, onRemove, size = "sm" }) => {
    const Icon = ICONS[tag.icon] || ICONS.Sword;
    const dims = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-1.5";
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border ${dims} font-medium`}
            style={{ borderColor: tag.color + "80", color: tag.color, background: tag.color + "18" }}
            data-testid={`tag-chip-${tag.name}`}
        >
            <Icon size={size === "sm" ? 12 : 14} weight="fill" />
            {tag.name}
            {onRemove && (
                <button onClick={onRemove} className="hover:text-white ml-1" data-testid={`remove-tag-${tag.name}`}>
                    <X size={10} weight="bold" />
                </button>
            )}
        </span>
    );
};

export const TagsPicker = ({ tags = [], onChange }) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [icon, setIcon] = useState("Sword");
    const [open, setOpen] = useState(false);

    const addTag = () => {
        if (!name.trim()) return;
        onChange([...tags, { name: name.trim(), color, icon }]);
        setName(""); setOpen(false);
    };
    const removeTag = (idx) => onChange(tags.filter((_, i) => i !== idx));

    return (
        <div className="flex flex-wrap items-center gap-2" data-testid="tags-picker">
            {tags.map((t, i) => <TagChip key={i} tag={t} onRemove={() => removeTag(i)} />)}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        className="text-xs uppercase tracking-widest text-[#99AABB] hover:text-white border border-dashed border-[#2C3440] rounded-full px-3 py-1"
                        data-testid="add-tag-btn"
                    >
                        + Tag
                    </button>
                </PopoverTrigger>
                <PopoverContent className="bg-[#1B2228] border-[#2C3440] text-white w-80 p-4">
                    <div className="label-tag mb-2">New Tag</div>
                    <Input
                        placeholder="Tag name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag()}
                        className="bg-[#14181C] border-[#2C3440] mb-3"
                        data-testid="tag-name-input"
                    />
                    <div className="label-tag mb-2">Color</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-full transition ${color === c ? "ring-2 ring-white" : ""}`}
                                style={{ background: c }}
                                data-testid={`tag-color-${c}`}
                            />
                        ))}
                    </div>
                    <div className="label-tag mb-2">Icon</div>
                    <div className="grid grid-cols-8 gap-1 mb-3 max-h-32 overflow-y-auto">
                        {ICON_NAMES.map((n) => {
                            const I = ICONS[n];
                            return (
                                <button
                                    key={n}
                                    onClick={() => setIcon(n)}
                                    className={`aspect-square rounded flex items-center justify-center transition ${
                                        icon === n ? "bg-[#2C3440] ring-1 ring-white" : "hover:bg-[#2C3440]"
                                    }`}
                                    style={{ color: icon === n ? color : "#99AABB" }}
                                    data-testid={`tag-icon-${n}`}
                                    title={n}
                                >
                                    <I size={16} weight="fill" />
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between">
                        <TagChip tag={{ name: name || "preview", color, icon }} />
                        <Button size="sm" onClick={addTag} className="bg-[#00E054] text-[#14181C] hover:bg-[#00c94a]" data-testid="tag-add-confirm">Add</Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
