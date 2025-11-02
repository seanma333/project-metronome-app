import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Music, Users, Calendar } from "lucide-react";

export default function Hero() {
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
                Connect with Your Perfect{" "}
                <span className="text-primary">Music Teacher</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                TempoLink streamlines connections between independent music teachers
                and students. Find qualified instructors, schedule lessons, and grow
                your musical journey.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-lg px-8">
                <Link href="/signup?role=student">Find a Teacher</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link href="/signup?role=teacher">I'm a Teacher</Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-2 text-primary">
                  <Users size={24} />
                  <span className="text-2xl font-bold">500+</span>
                </div>
                <span className="text-sm text-muted-foreground text-center sm:text-left">
                  Teachers
                </span>
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-2 text-primary">
                  <Music size={24} />
                  <span className="text-2xl font-bold">20+</span>
                </div>
                <span className="text-sm text-muted-foreground text-center sm:text-left">
                  Instruments
                </span>
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-2 text-primary">
                  <Calendar size={24} />
                  <span className="text-2xl font-bold">10k+</span>
                </div>
                <span className="text-sm text-muted-foreground text-center sm:text-left">
                  Lessons
                </span>
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
