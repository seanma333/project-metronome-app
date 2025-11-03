"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import RoleSelection from "@/app/components/sign-up/RoleSelection";
import { updateUserRole } from "@/app/actions/update-user-metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

type Role = "TEACHER" | "STUDENT" | "PARENT";

export default function RoleSelectionOnboarding() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedRole) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateUserRole(selectedRole);
      if (result.error) {
        setError(result.error);
        setIsSaving(false);
      } else {
        // Refresh the page to get updated user data with role
        router.refresh();
      }
    } catch (err) {
      setError("Failed to save role. Please try again.");
      setIsSaving(false);
      console.error("Error saving role:", err);
    }
  };

  return (
    <Card className="border-border shadow-lg">
      <CardHeader>
        <CardTitle>Select Your Role</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <RoleSelection
          selectedRole={selectedRole}
          onRoleChange={handleRoleSelect}
        />

        {selectedRole && (
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleConfirm} disabled={isSaving}>
              {isSaving ? "Saving..." : "Continue"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
