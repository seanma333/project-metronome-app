"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export default function Hero() {
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;

  // Render buttons based on user role
  const renderButtons = () => {
    // If user is not loaded or not logged in, show default buttons
    if (!isLoaded || !user) {
      return (
        <>
          <Button size="lg" asChild className="text-lg px-8">
            <Link href="/search">Find a Teacher</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8">
            <Link href="/sign-up?role=teacher">I'm a Teacher</Link>
          </Button>
        </>
      );
    }

    // Student: Only show "Find a Teacher" button
    if (role === "STUDENT") {
      return (
        <Button size="lg" asChild className="text-lg px-8">
          <Link href="/search">Find a Teacher</Link>
        </Button>
      );
    }

    // Parent: Show "Find a Teacher" and "Update Profiles"
    if (role === "PARENT") {
      return (
        <>
          <Button size="lg" asChild className="text-lg px-8">
            <Link href="/search">Find a Teacher</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8">
            <Link href="/my-profile">Update Profiles</Link>
          </Button>
        </>
      );
    }

    // Teacher: Show "Update my Profile" and "Set my Availability"
    if (role === "TEACHER") {
      return (
        <>
          <Button size="lg" asChild className="text-lg px-8">
            <Link href="/my-profile">Update my Profile</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8">
            <Link href="/my-timeslots">Set my Availability</Link>
          </Button>
        </>
      );
    }

    // Default fallback for unknown roles
    return (
      <>
        <Button size="lg" asChild className="text-lg px-8">
          <Link href="/search">Find a Teacher</Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="text-lg px-8">
          <Link href="/sign-up?role=teacher">I'm a Teacher</Link>
        </Button>
      </>
    );
  };

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-background -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Your Gateway to{" "}
                <span className="text-primary">Independent Music Teachers</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                Seamlessly connect students and parents with talented independent music teachers.
                No agencies, no middlemen—just direct connections to passionate instructors ready
                to inspire your musical journey.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {renderButtons()}
            </div>

            {/* Value Proposition */}
            <div className="pt-8 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold text-foreground">Direct Connections</p>
                  <p className="text-sm text-muted-foreground">
                    Connect directly with independent teachers—no agencies, no complicated processes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold text-foreground">Simple Scheduling</p>
                  <p className="text-sm text-muted-foreground">
                    Browse teacher profiles, check availability, and book lessons in minutes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold text-foreground">For Students & Parents</p>
                  <p className="text-sm text-muted-foreground">
                    Whether you're learning yourself or finding a teacher for your child, we make it easy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/landing/piano-online-lesson.jpg"
                alt="Music teacher giving online piano lesson"
                width={600}
                height={600}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-accent/30 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
