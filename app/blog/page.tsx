import type { Metadata } from "next";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";

export const metadata: Metadata = {
  title: "Blog | TempoLink",
  description:
    "Read articles, tips, and insights about music education, teaching, and connecting teachers with students.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Blog</h1>
              <p className="text-muted-foreground">
                Articles, tips, and insights for music teachers and students
              </p>
            </header>

            <section className="space-y-4">
              <div className="rounded-md border border-border bg-muted/40 p-8 text-center">
                <p className="text-muted-foreground">
                  A blog post feature will be added in the future. Check back soon for
                  articles, tips, and insights about music education, teaching, and
                  connecting teachers with students.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

