import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Search, Calendar, Music } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description:
      "Sign up as a student or teacher. Set your preferences, instruments, and languages.",
    forTeacher: "Add your credentials, experience, and teaching philosophy.",
    forStudent: "Tell us what you want to learn and your skill level.",
  },
  {
    icon: Search,
    title: "Find Your Match",
    description:
      "Browse profiles, read reviews, and find the perfect fit for your needs.",
    forTeacher: "Get discovered by students searching for your expertise.",
    forStudent: "Use filters to find teachers by instrument, language, and location.",
  },
  {
    icon: Calendar,
    title: "Schedule Lessons",
    description:
      "Book lessons directly through the platform with integrated calendar tools.",
    forTeacher: "Set your availability and accept bookings automatically.",
    forStudent: "View available times and book instantly with one click.",
  },
  {
    icon: Music,
    title: "Start Learning",
    description:
      "Connect, learn, and grow. Track progress and keep lesson notes organized.",
    forTeacher: "Add lesson notes, track student progress, and build your practice.",
    forStudent: "Access lesson notes, practice assignments, and track your improvement.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            How <span className="text-primary">TempoLink</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting started is easy. Follow these simple steps to begin your
            musical journey or grow your teaching practice.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -z-10" />
                )}

                <Card className="border-border hover:border-primary/50 transition-all h-full">
                  <CardContent className="pt-6">
                    {/* Step Number Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <span className="text-4xl font-bold text-primary/20">
                        {index + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>

                    {/* Role-specific details */}
                    <div className="space-y-3 text-sm">
                      <div className="border-l-2 border-primary/30 pl-3">
                        <p className="font-medium text-primary mb-1">
                          For Teachers:
                        </p>
                        <p className="text-muted-foreground">{step.forTeacher}</p>
                      </div>
                      <div className="border-l-2 border-accent/50 pl-3">
                        <p className="font-medium text-foreground mb-1">
                          For Students:
                        </p>
                        <p className="text-muted-foreground">{step.forStudent}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
