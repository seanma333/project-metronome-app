import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import ManageAccountContent from "./ManageAccountContent";

export default async function MyAccountPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Manage Account
              </h1>
              <p className="text-muted-foreground">
                Update your account information and settings
              </p>
            </div>

            <ManageAccountContent
              user={userData}
              clerkUser={{
                id: clerkUser.id,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                primaryEmail: clerkUser.emailAddresses[0]?.emailAddress || userData.email,
                imageUrl: clerkUser.imageUrl,
              }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
