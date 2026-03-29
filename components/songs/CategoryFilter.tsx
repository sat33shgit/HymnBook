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
      "inline-flex items-center rounded-full border px-4 py-2 text-[0.88rem] font-semibold transition-colors",
      isActive
        ? "border-primary bg-primary text-primary-foreground md:border-transparent md:bg-[var(--desktop-nav-active)] md:text-[var(--desktop-nav-active-foreground)]"
        : "border-border bg-background text-muted-foreground hover:text-foreground md:border-[var(--desktop-chip-border)] md:bg-[var(--desktop-chip)] md:text-[var(--desktop-chip-foreground)] md:hover:border-primary/30 md:hover:text-primary",
    );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
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
