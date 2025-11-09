"use client";

import Image from "next/image";
import { cn, shouldUnoptimizeImages } from "@/lib/utils";

interface ProficiencyBadgeProps {
  instrument: {
    id: number;
    name: string;
    imagePath: string;
  };
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  className?: string;
}

export default function ProficiencyBadge({
  instrument,
  proficiency,
  className,
}: ProficiencyBadgeProps) {
  const getProficiencyDisplay = (prof: string) => {
    switch (prof) {
      case "BEGINNER":
        return "Beginner";
      case "INTERMEDIATE":
        return "Intermediate";
      case "ADVANCED":
        return "Advanced";
      default:
        return prof;
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium border-border bg-card",
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
      <span>
        {instrument.name} - {getProficiencyDisplay(proficiency)}
      </span>
    </div>
  );
}
