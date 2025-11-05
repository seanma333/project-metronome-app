import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";
import RoleSelectionOnboarding from "./RoleSelectionOnboarding";
import { updateUserRole } from "@/app/actions/update-user-metadata";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const params = await searchParams;
  const roleParam = params.role;

  // Check if user has a role in metadata
  let role = user.publicMetadata?.role as string | undefined;
  const validRoles = ["TEACHER", "STUDENT", "PARENT"];

  // If role is in query params but not in metadata, set it automatically and redirect
  if (roleParam && validRoles.includes(roleParam.toUpperCase()) && !role) {
    // Set the role in metadata
    const roleToSet = roleParam.toUpperCase() as "TEACHER" | "STUDENT" | "PARENT";
    await updateUserRole(roleToSet);
    // Redirect to onboarding without query param to refresh session
    redirect("/onboarding");
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
              {!role ? "First, let's determine your role" : "Let's set up your profile"}
            </p>
          </div>

          {!role || !validRoles.includes(role.toUpperCase()) ? (
            <RoleSelectionOnboarding />
          ) : (
            <OnboardingForm
              userId={user.id}
              role={role}
              firstName={user.firstName || ""}
              lastName={user.lastName || ""}
              email={user.emailAddresses[0]?.emailAddress || ""}
            />
          )}
        </div>
      </main>
    </div>
  );
}
