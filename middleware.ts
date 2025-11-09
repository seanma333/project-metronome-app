import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define routes that don't require role check
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/",
  "/teachers(.*)",
  "/teacher-profiles(.*)",
]);

const authorizedParties = process.env.AUTHORIZED_PARTIES 
  ? process.env.AUTHORIZED_PARTIES.split(',') 
  : undefined;

export default clerkMiddleware(
  async (auth, req) => {
    const { userId, sessionClaims } = await auth();

    // If user is logged in and not on a public route, check for role
    if (userId && !isPublicRoute(req)) {
      // Check both metadata and publicMetadata for role
      // publicMetadata is the source of truth, but metadata might have it too
      const publicMetadata = sessionClaims?.publicMetadata as { role?: string } | undefined;
      const metadata = sessionClaims?.metadata as { role?: string } | undefined;
      const role = publicMetadata?.role || metadata?.role;
      const validRoles = ["TEACHER", "STUDENT", "PARENT"];

      // If no role or invalid role, redirect to onboarding
      if (!role || !validRoles.includes(role.toUpperCase())) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }
  },
  {
    authorizedParties,
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
