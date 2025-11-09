"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { cn, shouldUnoptimizeImages } from "@/lib/utils";

interface ProfileSectionProps {
  title: string;
  children: ReactNode;
  onEdit?: () => void;
  isEditing?: boolean;
  showEditButton?: boolean;
  className?: string;
}

export default function ProfileSection({
  title,
  children,
  onEdit,
  isEditing = false,
  showEditButton = false,
  className,
}: ProfileSectionProps) {
  return (
    <div className={cn("relative group", className)}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {onEdit && showEditButton && (
          <button
            onClick={onEdit}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded",
              isEditing && "opacity-100"
            )}
            aria-label={`Edit ${title}`}
          >
            <Image
              src="/svg/edit_button.svg"
              alt="Edit"
              width={20}
              height={20}
              className="object-contain"
              unoptimized={shouldUnoptimizeImages()}
            />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
