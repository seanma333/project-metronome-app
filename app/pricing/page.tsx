import type { Metadata } from "next";
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
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | TempoLink",
  description:
    "Simple, transparent pricing for music teachers and students. Free for everyone, with payments going directly to teachers.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Header */}
            <header className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                TempoLink is free for everyone. Students never pay platform fees—all
                payments go directly to teachers.
              </p>
            </header>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">For Students</CardTitle>
                  <CardDescription>
                    Everything you need to find and connect with music teachers
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">Free</span>
                    <span className="text-muted-foreground ml-2">forever</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Search and discover music teachers
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        View teacher profiles and availability
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Request and manage lesson bookings
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Access lesson calendar and notes
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Manage student profiles (for parents)
                      </span>
                    </li>
                  </ul>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">No platform fees.</strong>{" "}
                      Any payments for lessons go directly to your teacher. You&apos;ll
                      never pay TempoLink for features.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" size="lg">
                    <Link href="/sign-up?role=student">Get Started Free</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Teacher Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">For Teachers</CardTitle>
                  <CardDescription>
                    Build your teaching practice and connect with students
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">Free</span>
                    <span className="text-muted-foreground ml-2">forever</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Create and customize your public profile
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Set your availability and manage timeslots
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Receive and manage lesson requests
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Calendar integration and lesson management
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        AI-assisted profile creation
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Student notes and lesson tracking
                      </span>
                    </li>
                  </ul>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">100% of lesson payments</strong>{" "}
                      go directly to you. We may introduce optional premium features in
                      the future, but core functionality will always remain free.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" size="lg">
                    <Link href="/sign-up?role=teacher">Start Teaching</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* FAQ Section */}
            <section className="space-y-6 pt-8 border-t border-border">
              <h2 className="text-2xl font-semibold text-foreground text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Do students pay anything to use TempoLink?
                  </h3>
                  <p className="text-muted-foreground">
                    No. Students never pay TempoLink for platform features. The
                    platform is completely free for students. Any payments for lessons
                    are arranged directly between students and teachers, and 100% of
                    those payments go to the teacher.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Will teachers ever have to pay?
                  </h3>
                  <p className="text-muted-foreground">
                    Currently, all features are free for teachers. In the future, we may
                    introduce optional premium features for teachers (such as advanced
                    analytics, enhanced visibility, or additional tools), but the core
                    functionality—creating profiles, managing availability, and
                    connecting with students—will always remain free.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    How do payments work?
                  </h3>
                  <p className="text-muted-foreground">
                    At present, TempoLink does not process payments. Teachers and
                    students arrange payment terms directly between themselves. When we
                    introduce payment processing in the future, we will ensure that all
                    lesson payments go directly to teachers with no platform fees
                    deducted.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Are there any hidden fees?
                  </h3>
                  <p className="text-muted-foreground">
                    No. TempoLink is free to use for both students and teachers. There
                    are no hidden fees, no subscription costs, and no charges for
                    connecting with teachers or students.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="text-center space-y-4 pt-8">
              <h2 className="text-2xl font-semibold text-foreground">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground">
                Join TempoLink today and start your musical journey—completely free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/sign-up?role=student">Sign Up as Student</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/sign-up?role=teacher">Sign Up as Teacher</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

