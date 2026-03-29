"use client";

import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  const getButtonClassName = (isActive: boolean) =>
    cn(
      "inline-flex items-center rounded-full border px-4 py-2 text-[0.88rem] font-semibold transition-all",
      isActive
        ? "border-transparent bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
        : "border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] text-[var(--desktop-chip-foreground)] hover:-translate-y-px hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)]",
    );

  return (
    <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter by category">
      <button
        type="button"
        className={getButtonClassName(selected === null)}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          className={getButtonClassName(selected === cat)}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
