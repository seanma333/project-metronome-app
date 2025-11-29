"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const role = (user?.publicMetadata?.role as string | undefined) || undefined;
  const canFindTeacher = role === "STUDENT" || role === "PARENT";
  const isTeacher = role === "TEACHER";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/logo/logo.png"
              alt="TempoLink Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-xl font-bold text-primary">TempoLink</span>
          </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <SignedOut>
                  <Link
                    href="#features"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="#faq"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    FAQ
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/my-profile"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    {role === "PARENT" ? "Student Profiles" : "My Profile"}
                  </Link>
                  <Link
                    href="/booking-requests"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Booking Requests
                  </Link>
                  <Link
                    href="/lessons"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Lessons
                  </Link>
                  <Link
                    href="/my-preferences"
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Preferences
                  </Link>
                  {canFindTeacher && (
                    <Link
                      href="/search"
                      className="text-foreground/80 hover:text-primary transition-colors"
                    >
                      Find Teacher
                    </Link>
                  )}
                  {isTeacher && (
                    <Link
                      href="/my-timeslots"
                      className="text-foreground/80 hover:text-primary transition-colors"
                    >
                      Timeslots
                    </Link>
                  )}
                </SignedIn>
              </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <SignedOut>
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                userProfileUrl="/my-account"
              />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden py-4 space-y-4">
                <SignedOut>
                  <Link
                    href="#features"
                    className="block text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="block text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    How It Works
                  </Link>
                  <Link
                    href="#faq"
                    className="block text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    FAQ
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/my-profile"
                    className="block text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {role === "PARENT" ? "Student Profiles" : "My Profile"}
                  </Link>
                  <Link
                    href="/booking-requests"
                    className="block text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Booking Requests
                  </Link>
                  <Link
                    href="/lessons"
                    className="block text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Lessons
                  </Link>
                  <Link
                    href="/my-preferences"
                    className="block text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Preferences
                  </Link>
                  {canFindTeacher && (
                    <Link
                      href="/search"
                      className="block text-foreground/80 hover:text-primary transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Find Teacher
                    </Link>
                  )}
                  {isTeacher && (
                    <Link
                      href="/my-timeslots"
                      className="block text-foreground/80 hover:text-primary transition-colors py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Timeslots
                    </Link>
                  )}
                </SignedIn>
                <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                  <SignedOut>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/sign-up">Get Started</Link>
                    </Button>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center justify-center py-2">
                      <UserButton
                        afterSignOutUrl="/"
                        userProfileUrl="/my-account"
                      />
                    </div>
                  </SignedIn>
                </div>
              </div>
            )}
      </div>
    </nav>
  );
}
