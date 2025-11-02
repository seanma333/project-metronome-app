import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function SignInPage() {
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
              Welcome back to{" "}
              <span className="text-primary">TempoLink</span>
            </h1>
            <p className="text-muted-foreground">
              Sign in to continue your musical journey
            </p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="flex justify-center">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-lg border border-border bg-card",
                  headerTitle: "text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  socialButtonsBlockButton:
                    "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border",
                  socialButtonsBlockButtonText: "text-foreground",
                  formButtonPrimary:
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                  footerActionLink: "text-primary hover:text-primary/80",
                  identityPreviewText: "text-foreground",
                  identityPreviewEditButton: "text-primary hover:text-primary/80",
                  formFieldInput:
                    "bg-background border-border text-foreground focus:border-primary focus:ring-primary",
                  formFieldLabel: "text-foreground",
                  formFieldSuccessText: "text-primary",
                  formFieldErrorText: "text-destructive",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground",
                  formResendCodeLink: "text-primary hover:text-primary/80",
                  otpCodeFieldInput: "border-border focus:border-primary focus:ring-primary",
                },
                variables: {
                  colorPrimary: "oklch(0.55 0.15 40)",
                  colorBackground: "oklch(0.99 0.005 60)",
                  colorInputBackground: "oklch(1 0 0)",
                  colorInputText: "oklch(0.145 0 0)",
                  colorText: "oklch(0.145 0 0)",
                  colorTextSecondary: "oklch(0.5 0 0)",
                  colorDanger: "oklch(0.577 0.245 27.325)",
                  borderRadius: "0.625rem",
                  fontFamily: "var(--font-geist-sans)",
                },
              }}
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
            />
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Don't have an account?{" "}
              <Link
                href="/sign-up"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
