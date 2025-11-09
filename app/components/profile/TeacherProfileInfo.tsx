"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface TeacherProfileInfoProps {
  imageUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  className?: string;
}

export default function TeacherProfileInfo({
  imageUrl,
  firstName,
  lastName,
  email,
  className,
}: TeacherProfileInfoProps) {
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Teacher";
  const imageSrc = imageUrl || "/images/profile/default_user.png";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
        <Image
          src={imageSrc}
          alt={fullName}
          fill
          className="object-cover"
          sizes="192px"
        />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {fullName}
        </h1>
        <p className="text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}
