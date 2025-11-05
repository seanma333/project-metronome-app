import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import { getLessonDetails } from "@/app/actions/get-lesson-details";
import LessonDetailsContent from "./LessonDetailsContent";

interface LessonPageProps {
  params: Promise<{ lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
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

  // Get lesson details and verify authorization
  const result = await getLessonDetails(lessonId);

  if (!result.authorized || result.error) {
    redirect("/lessons");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <LessonDetailsContent lesson={result.lesson} user={userData} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
