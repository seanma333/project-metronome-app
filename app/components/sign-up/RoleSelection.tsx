"use client";

import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { cn, shouldUnoptimizeImages } from "@/lib/utils";

type Role = "TEACHER" | "STUDENT" | "PARENT";

interface RoleSelectionProps {
  selectedRole: Role | null;
  onRoleChange: (role: Role) => void;
}

const roles: { value: Role; label: string; description: string; imagePath: string }[] = [
  {
    value: "TEACHER",
    label: "Teacher",
    description: "I teach music and want to connect with students",
    imagePath: "/images/onboarding/teacher.png",
  },
  {
    value: "STUDENT",
    label: "Student",
    description: "I want to learn music and find a teacher",
    imagePath: "/images/onboarding/student.png",
  },
  {
    value: "PARENT",
    label: "Parent",
    description: "I'm signing up for my child to learn music",
    imagePath: "/images/onboarding/parent.png",
  },
];

export default function RoleSelection({ selectedRole, onRoleChange }: RoleSelectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-semibold text-foreground">
          I am signing up as a:
        </Label>
        <p className="text-sm text-muted-foreground">
          Select your role to get started
        </p>
      </div>

      <RadioGroup
        value={selectedRole || undefined}
        onValueChange={(value) => onRoleChange(value as Role)}
        className="grid grid-cols-1 gap-4"
      >
        {roles.map((role) => {
          const isSelected = selectedRole === role.value;

          return (
            <div key={role.value} className="relative">
              <RadioGroupItem
                value={role.value}
                id={role.value}
                className="peer absolute opacity-0"
                aria-label={`Select ${role.label}`}
              />
              <Label
                htmlFor={role.value}
                className={cn(
                  "block cursor-pointer",
                  "relative flex items-start space-x-4 rounded-lg border-2 p-4 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={role.imagePath}
                      alt={`${role.label} icon`}
                      fill
                      sizes="48px"
                      className={cn(
                        "object-contain rounded-lg",
                        isSelected ? "opacity-100" : "opacity-70"
                      )}
                      unoptimized={shouldUnoptimizeImages()}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-semibold",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {role.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
