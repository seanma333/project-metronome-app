import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Calendar,
  MessageSquare,
  Shield,
  Clock,
  BookOpen,
  DollarSign,
  GraduationCap,
} from "lucide-react";

const studentParentFeatures = [
  {
    icon: Search,
    title: "Advanced Search",
    description:
      "Easily find online lessons or local in-person teachers with advanced search options. Filter by instrument, location, teaching format, and more.",
  },
  {
    icon: Calendar,
    title: "Book Lessons Directly",
    description:
      "Book lessons directly with teachers and easily reach out to them. No middlemen, just direct connections.",
  },
  {
    icon: BookOpen,
    title: "Access Lesson Notes",
    description:
      "Access lesson notes from teachers to track progress, review what you've learned, and stay organized.",
  },
  {
    icon: GraduationCap,
    title: "Set Your Proficiency Level",
    description:
      "Set your own proficiency level for each instrument to help teachers understand where you're at in your musical journey.",
  },
];

const teacherFeatures = [
  {
    icon: Clock,
    title: "Set Own Availability",
    description:
      "Set your own availability and teaching formats. Choose between in-person only, online only, or both—you decide.",
  },
  {
    icon: Calendar,
    title: "Schedule Weekly Lessons",
    description:
      "Easily schedule weekly lessons with students. Manage your timeslots and let students book directly through your availability.",
  },
  {
    icon: MessageSquare,
    title: "Connect Directly",
    description:
      "Connect directly with students and parents. No agencies or intermediaries—just you and your students.",
  },
  {
    icon: DollarSign,
    title: "Keep 100% of Your Earnings",
    description:
      "The platform never takes money from lessons. Set your own prices and keep everything you earn.",
  },
  {
    icon: BookOpen,
    title: "Create Lesson Notes",
    description:
      "Create lesson notes to share with students. Track progress, add reminders, and help students stay organized.",
  },
  {
    icon: Shield,
    title: "Your Data is Safe",
    description:
      "Your data is protected with industry-standard security. Your information and student relationships are safe with us.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Everything You Need to{" "}
            <span className="text-primary">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're a student looking for instruction or a teacher growing
            your practice, TempoLink has the tools you need.
          </p>
        </div>

        {/* Students & Parents Features */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            For Students & Parents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {studentParentFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-border hover:border-primary/50 transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Teachers Features */}
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            For Teachers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-border hover:border-primary/50 transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
