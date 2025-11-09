import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import CalendarContent from "./CalendarContent";

export default async function CalendarPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/");
  }

  // Get user from database
  const user = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  if (user.length === 0) {
    redirect("/onboarding");
  }

  const userData = user[0];

  if (!userData.role) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Calendar
              </h1>
              <p className="text-muted-foreground">
                {userData.role === "TEACHER"
                  ? "View your lesson schedule and availability"
                  : userData.role === "PARENT"
                  ? "View your children's lesson schedule"
                  : "View your lesson schedule"}
              </p>
            </div>

            <CalendarContent user={userData} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

