import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define routes that don't require role check
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/",
  "/teachers(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // If user is logged in and not on a public route, check for role
  if (userId && !isPublicRoute(req)) {
    const metadata = sessionClaims?.metadata as { role?: string } | undefined;
    const role = metadata?.role;
    const validRoles = ["TEACHER", "STUDENT", "PARENT"];

    // If no role or invalid role, redirect to onboarding
    if (!role || !validRoles.includes(role.toUpperCase())) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
