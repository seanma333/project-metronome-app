"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingFormProps {
  userId: string;
  role?: string;
}

export default function OnboardingForm({ userId, role }: OnboardingFormProps) {
  const router = useRouter();

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <Card className="border-border shadow-lg">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {role
              ? `Setting up your profile as a ${role.toLowerCase()}...`
              : "Setting up your profile..."}
          </p>
          {/* TODO: Add onboarding form fields based on role */}
          <p className="text-sm text-muted-foreground">
            Onboarding form will be implemented here.
          </p>
          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
