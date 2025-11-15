import type { Metadata } from "next";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";

export const metadata: Metadata = {
  title: "About Us | TempoLink",
  description:
    "Learn about TempoLink's mission to empower independent music teachers with simple, intuitive tools built specifically for music education.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">About TempoLink</h1>
            </header>

            <section className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                TempoLink was born from watching the day-to-day challenges of
                independent music teachers — the scheduling headaches, the scattered
                communications, and the lack of simple tools built specifically for
                their world. Many teachers rely on a patchwork of apps that aren&apos;t
                designed for music education, often burdened with subscription fees or
                hidden costs. We believed there had to be a better way.
              </p>
            </section>

            <section className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                TempoLink is our answer: a clean, intuitive platform that helps music
                teachers and students connect, schedule lessons, and manage their time
                effortlessly — without extra fees or unnecessary complexity. Whether you
                teach from a home studio, a school, or virtually, TempoLink gives you a
                flexible, reliable space to keep your studio running smoothly.
              </p>
            </section>

            <section className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Our mission is simple: empower music teachers with tools that fit
                seamlessly into their teaching lives, so they can spend more time
                sharing their craft and less time managing logistics. TempoLink is built
                for teachers, shaped by real teaching experiences, and continually
                evolving to support the vibrant community of musicians who keep the
                world inspired.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

