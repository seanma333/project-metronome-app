import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { updateUserRole } from "@/app/actions/update-user-metadata";
import OnboardingForm from "./OnboardingForm";

interface OnboardingPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const params = await searchParams;
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get role from URL params or user metadata
  const roleParam = params.role?.toUpperCase();
  const validRoles = ["TEACHER", "STUDENT", "PARENT"];

  // If role is provided in URL and not in metadata, save it
  if (
    roleParam &&
    validRoles.includes(roleParam) &&
    !user.publicMetadata.role
  ) {
    const result = await updateUserRole(roleParam as "TEACHER" | "STUDENT" | "PARENT");
    if (result.success) {
      // Refresh to get updated user data
      redirect(`/onboarding?role=${roleParam}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-background -z-10" />

      {/* Decorative elements */}
      <div className="fixed top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 left-20 w-80 h-80 bg-accent/15 rounded-full blur-3xl -z-10" />

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Welcome to <span className="text-primary">TempoLink</span>
            </h1>
            <p className="text-muted-foreground">
              Let's set up your profile
            </p>
          </div>

          <OnboardingForm
            userId={user.id}
            role={user.publicMetadata?.role as string | undefined}
            firstName={user.firstName || ""}
            lastName={user.lastName || ""}
            email={user.emailAddresses[0]?.emailAddress || ""}
          />
        </div>
      </main>
    </div>
  );
}
