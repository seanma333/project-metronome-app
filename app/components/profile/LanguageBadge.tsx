"use client";

import { cn } from "@/lib/utils";

interface LanguageBadgeProps {
  language: {
    id: number;
    name: string;
    code: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function LanguageBadge({
  language,
  isSelected = false,
  onClick,
  className,
}: LanguageBadgeProps) {
  const BadgeContent = (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        isSelected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
        onClick && "cursor-pointer",
        className
      )}
    >
      {language.name}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-full">
        {BadgeContent}
      </button>
    );
  }

  return BadgeContent;
}
