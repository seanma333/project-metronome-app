"use client";

import Image from "next/image";
import { cn, shouldUnoptimizeImages } from "@/lib/utils";

interface InstrumentBadgeProps {
  instrument: {
    id: number;
    name: string;
    imagePath: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function InstrumentBadge({
  instrument,
  isSelected = false,
  onClick,
  className,
}: InstrumentBadgeProps) {
  const BadgeContent = (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        isSelected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
        onClick && "cursor-pointer",
        className
      )}
    >
      <Image
        src={instrument.imagePath}
        alt={instrument.name}
        width={20}
        height={20}
        className="object-contain"
        unoptimized={shouldUnoptimizeImages()}
      />
      <span>{instrument.name}</span>
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
