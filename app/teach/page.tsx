import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Settings, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Start Teaching | TempoLink",
  description:
    "Get started teaching on TempoLink. Set up your profile, preferences, and availability to connect with students.",
};

export default async function TeachPage() {
  const clerkUser = await currentUser();

  // If not logged in, show sign-up CTA
  if (!clerkUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl mx-auto space-y-8">
              <header className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Start Teaching on TempoLink
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Join our community of independent music teachers and connect with
                  students looking for quality music instruction.
                </p>
              </header>

              <div className="rounded-lg border border-border bg-card p-8 text-center space-y-6">
                <p className="text-muted-foreground">
                  Create your free teacher account to start building your teaching
                  practice. Set up your profile, manage your availability, and begin
                  accepting lesson requests from students.
                </p>
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/sign-up?role=teacher">Sign Up as a Teacher</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get user role
  const role = clerkUser.publicMetadata?.role as string | undefined;

  // If logged in but not a teacher, redirect to landing page
  if (role !== "TEACHER") {
    redirect("/");
  }

  // If logged in as teacher, show setup sections
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-5xl mx-auto space-y-8">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Get Started Teaching
              </h1>
              <p className="text-muted-foreground">
                Complete these steps to set up your teaching profile and start
                accepting students.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Set up Profile */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Set Up Profile</CardTitle>
                  </div>
                  <CardDescription>
                    Create and customize your public teacher profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Your profile is how students discover you. Add your photo,
                    bio, instruments you teach, languages you speak, and links to your
                    website or social media. This information helps students find you
                    and decide if you&apos;re the right teacher for them.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant="outline">
                    <Link
                      href="/my-profile"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Go to Profile
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Set up Preferences */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Set Up Preferences</CardTitle>
                  </div>
                  <CardDescription>
                    Configure your teaching preferences and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Manage your teaching format (online, in-person, or both), time
                    zone, and whether you&apos;re currently accepting new students.
                    These preferences help students understand your availability and
                    teaching style.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant="outline">
                    <Link
                      href="/my-preferences"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Go to Preferences
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Set up Availability */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Set Up Availability</CardTitle>
                  </div>
                  <CardDescription>
                    Define your weekly teaching schedule
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Create time slots for when you&apos;re available to teach. You can
                    set up recurring weekly availability or one-time slots. Students
                    will see your available times when requesting lessons, and you can
                    update your schedule anytime.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant="outline">
                    <Link
                      href="/my-timeslots"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Go to Availability
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

