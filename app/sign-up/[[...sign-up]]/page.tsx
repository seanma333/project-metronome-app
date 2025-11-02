import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import SignUpWithRole from "@/app/components/sign-up/SignUpWithRole";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-background -z-10" />

      {/* Decorative elements */}
      <div className="fixed top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 left-20 w-80 h-80 bg-accent/15 rounded-full blur-3xl -z-10" />

      {/* Navbar */}
      <nav className="w-full border-b border-border bg-background/95 backdrop-blur relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo/logo.png"
              alt="TempoLink Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="text-lg font-bold text-primary">TempoLink</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Join <span className="text-primary">TempoLink</span>
            </h1>
            <p className="text-muted-foreground">
              Start connecting with music teachers and students today
            </p>
          </div>

          {/* Sign Up with Role Selection */}
          <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
            <SignUpWithRole />
          </Suspense>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
