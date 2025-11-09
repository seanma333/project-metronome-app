"use client";

import { useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import RoleSelection from "./RoleSelection";

type Role = "TEACHER" | "STUDENT" | "PARENT";

export default function SignUpWithRole() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  // Normalize role param (e.g., "teacher" -> "TEACHER")
  const normalizedRole = roleParam && ["TEACHER", "STUDENT", "PARENT"].includes(roleParam.toUpperCase())
    ? (roleParam.toUpperCase() as Role)
    : null;

  const [selectedRole, setSelectedRole] = useState<Role | null>(normalizedRole);
  // Auto-confirm if role is provided in URL
  const [roleConfirmed, setRoleConfirmed] = useState(!!normalizedRole);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setRoleConfirmed(false); // Reset confirmation when role changes
  };

  const handleConfirm = () => {
    if (selectedRole) {
      setRoleConfirmed(true);
    }
  };

  // Build the redirect URL with the role parameter
  const fallbackRedirectUrl = selectedRole
    ? `/onboarding?role=${selectedRole}`
    : "/onboarding";

  // Show role selection if no role is selected or not confirmed
  if (!selectedRole || !roleConfirmed) {
    return (
      <div className="w-full">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg space-y-6">
          <RoleSelection
            selectedRole={selectedRole}
            onRoleChange={handleRoleSelect}
          />
          {selectedRole && (
            <div className="flex justify-end pt-4 border-t border-border">
              <Button onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show Clerk sign-up form with role context
  return (
    <div className="w-full space-y-6">
      {/* Role Display */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Signing up as:</p>
            <p className="text-lg font-semibold text-primary capitalize">
              {selectedRole === "TEACHER" && "Teacher"}
              {selectedRole === "STUDENT" && "Student"}
              {selectedRole === "PARENT" && "Parent"}
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedRole(null);
              setRoleConfirmed(false);
            }}
            className="text-sm text-primary hover:text-primary/80 underline"
          >
            Change
          </button>
        </div>
      </div>

      {/* Clerk Sign Up Component */}
      <div className="w-full">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg border border-border bg-card",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton:
                "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border",
              socialButtonsBlockButtonText: "text-foreground",
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-primary-foreground",
              footerActionLink: "text-primary hover:text-primary/80",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
              formFieldInput:
                "bg-background border-border text-foreground focus:border-primary focus:ring-primary",
              formFieldLabel: "text-foreground",
              formFieldSuccessText: "text-primary",
              formFieldErrorText: "text-destructive",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formResendCodeLink: "text-primary hover:text-primary/80",
              otpCodeFieldInput:
                "border-border focus:border-primary focus:ring-primary",
              selectButton:
                "bg-background border-border text-foreground hover:bg-muted",
              selectButtonText: "text-foreground",
            },
            variables: {
              colorPrimary: "oklch(0.55 0.15 40)",
              colorBackground: "oklch(0.99 0.005 60)",
              colorInputBackground: "oklch(1 0 0)",
              colorInputText: "oklch(0.145 0 0)",
              colorText: "oklch(0.145 0 0)",
              colorTextSecondary: "oklch(0.5 0 0)",
              colorDanger: "oklch(0.577 0.245 27.325)",
              borderRadius: "0.625rem",
              fontFamily: "var(--font-geist-sans)",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl={fallbackRedirectUrl}
        />
      </div>
    </div>
  );
}
