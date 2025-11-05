import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import BookingRequestsContent from "./BookingRequestsContent";

export default async function BookingRequestsPage() {
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
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Booking Requests
              </h1>
              <p className="text-muted-foreground">
                {userData.role === "TEACHER"
                  ? "Manage incoming booking requests from students and parents"
                  : "View and manage your booking requests with teachers"
                }
              </p>
            </div>

            <BookingRequestsContent user={userData} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
