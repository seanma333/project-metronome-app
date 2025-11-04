"use client";

import { useState } from "react";
import { updateAcceptingStudents } from "@/app/actions/update-teacher-preferences";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";

interface AcceptingStudentsCheckboxProps {
  initialValue: boolean;
}

export default function AcceptingStudentsCheckbox({ initialValue }: AcceptingStudentsCheckboxProps) {
  const [acceptingStudents, setAcceptingStudents] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (checked: boolean | "indeterminate") => {
    if (checked === "indeterminate") return;

    const newValue = checked;
    setAcceptingStudents(newValue);
    setIsSaving(true);

    const result = await updateAcceptingStudents(newValue);

    setIsSaving(false);

    if (result.error) {
      // Revert on error
      setAcceptingStudents(!newValue);
      console.error("Failed to update accepting students:", result.error);
    }
  };

  return (
    <div className="flex items-center space-x-2 mb-6">
      <Checkbox
        id="accepting-students"
        checked={acceptingStudents}
        onCheckedChange={handleChange}
        disabled={isSaving}
      />
      <Label
        htmlFor="accepting-students"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
      >
        Ready to take new students
      </Label>
      {isSaving && (
        <span className="text-xs text-muted-foreground">Saving...</span>
      )}
    </div>
  );
}
