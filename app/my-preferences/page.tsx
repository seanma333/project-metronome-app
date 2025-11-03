import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getUserPreferences } from "@/app/actions/get-user-preferences";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import PreferencesForm from "./PreferencesForm";

export default async function MyPreferencesPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const preferences = await getUserPreferences();

  if (!preferences) {
    redirect("/onboarding");
  }

  const role = clerkUser.publicMetadata?.role as string | undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-8">Preferences</h1>
            <PreferencesForm
              preferences={preferences}
              role={role}
              currentTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
