import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Calendar,
  MessageSquare,
  Globe,
  Shield,
  Clock,
  Star,
  Video,
  BookOpen,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Advanced Search",
    description:
      "Find teachers by instrument, language, experience level, and availability. Detailed filters make it easy to find your perfect match.",
  },
  {
    icon: Calendar,
    title: "Seamless Scheduling",
    description:
      "Integrated calendar system for booking and managing lessons. Set your availability and let students book directly.",
  },
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description:
      "Message teachers directly through our platform. Discuss goals, ask questions, and coordinate lessons effortlessly.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description:
      "Connect with teachers who speak your language. We support instructors teaching in multiple languages.",
  },
  {
    icon: Video,
    title: "In-Person & Online",
    description:
      "Choose between in-person lessons or online sessions via your preferred video platform. Flexible learning options.",
  },
  {
    icon: BookOpen,
    title: "Lesson Notes & Progress",
    description:
      "Teachers can add lesson notes and track student progress. Students stay organized with practice reminders and goals.",
  },
  {
    icon: Star,
    title: "Verified Profiles",
    description:
      "All teacher profiles include credentials, experience, and student reviews. Make informed decisions confidently.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description:
      "Set your own availability, reschedule easily, and manage multiple students or teachers all in one place.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "Your data is protected with industry-standard security. Safe messaging and secure payment processing.",
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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
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
    </section>
  );
}
