"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { createUserFromClerk } from "@/app/actions/create-user";
import TeacherForm from "./TeacherForm";
import StudentForm from "./StudentForm";
import ParentForm from "./ParentForm";

interface OnboardingFormProps {
  userId: string;
  role?: string;
  firstName: string;
  lastName: string;
  email: string;
  invitationId?: string;
}

export default function OnboardingForm({ userId, role, firstName, lastName, email, invitationId }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createUser = async () => {
      try {
        // Get user's timezone from browser
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 10000); // 10 second timeout
        });

        const result = await Promise.race([
          createUserFromClerk(timezone, invitationId),
          timeoutPromise,
        ]) as Awaited<ReturnType<typeof createUserFromClerk>>;

        if (result?.error) {
          setError(result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error && err.message === "Request timeout"
          ? "Request timed out. Please try refreshing the page."
          : "Failed to initialize user";
        setError(errorMessage);
        console.error("Error creating user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    createUser();
  }, [invitationId]);

  if (isLoading) {
    return (
      <Card className="border-border shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Setting up your account...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderForm = () => {
    if (!role) {
      return (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Please wait while we determine your account type...
          </p>
        </div>
      );
    }

    switch (role.toUpperCase()) {
      case "TEACHER":
        return <TeacherForm firstName={firstName} lastName={lastName} email={email} />;
      case "STUDENT":
        return <StudentForm firstName={firstName} lastName={lastName} email={email} />;
      case "PARENT":
        return <ParentForm firstName={firstName} lastName={lastName} />;
      default:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Unknown role: {role}. Please contact support.
            </p>
          </div>
        );
    }
  };

  return (
    <Card className="border-border shadow-lg">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {renderForm()}
        </div>
      </CardContent>
    </Card>
  );
}
