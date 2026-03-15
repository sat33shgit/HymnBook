"use client";

import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      <Badge
        variant={selected === null ? "default" : "outline"}
        className="cursor-pointer px-3 py-1 text-sm transition-colors"
        onClick={() => onSelect(null)}
      >
        All
      </Badge>
      {categories.map((cat) => (
        <Badge
          key={cat}
          variant={selected === cat ? "default" : "outline"}
          className="cursor-pointer px-3 py-1 text-sm transition-colors"
          onClick={() => onSelect(cat)}
        >
          {cat}
        </Badge>
      ))}
    </div>
  );
}
