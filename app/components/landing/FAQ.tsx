"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does TempoLink work?",
    answer:
      "TempoLink connects music students with independent teachers. Students can search for teachers by instrument, language, and location, then book lessons directly through our platform. Teachers create profiles, set their availability, and manage their student roster all in one place.",
  },
  {
    question: "Is TempoLink free to use?",
    answer:
      "Creating an account and browsing teacher profiles is completely free for students. Teachers can sign up and create a basic profile for free. We offer premium plans with additional features like priority listing, advanced analytics, and unlimited student slots.",
  },
  {
    question: "What instruments can I learn on TempoLink?",
    answer:
      "TempoLink supports teachers for all instruments including piano, guitar, violin, voice, drums, saxophone, flute, cello, and many more. You can filter by specific instruments to find the perfect teacher for your needs.",
  },
  {
    question: "Can I take lessons online or only in-person?",
    answer:
      "Both! Teachers on TempoLink offer in-person lessons, online lessons, or a combination of both. You can filter your search based on your preference. Online lessons work with any video platform you and your teacher prefer.",
  },
  {
    question: "How do I schedule a lesson?",
    answer:
      "Once you find a teacher you like, you can view their available time slots and book directly through their calendar. Teachers receive notifications of new bookings, and both parties get reminders before scheduled lessons.",
  },
  {
    question: "Can teachers add lesson notes?",
    answer:
      "Yes! Teachers can add notes after each lesson, including practice assignments, progress updates, and goals for next time. Students can access these notes anytime to stay on track with their practice.",
  },
  {
    question: "What if I need to reschedule or cancel a lesson?",
    answer:
      "Both students and teachers can reschedule or cancel lessons through the platform. We recommend following the cancellation policy agreed upon between you and your teacher (typically 24-48 hours notice).",
  },
  {
    question: "How do payments work?",
    answer:
      "Payment arrangements are made directly between students and teachers. TempoLink provides a secure messaging platform to discuss rates and payment methods. We're working on integrated payment processing for future updates.",
  },
  {
    question: "Are teachers verified?",
    answer:
      "Teachers create detailed profiles including their experience, credentials, teaching style, and languages spoken. Students can read reviews from other students and view teacher qualifications before booking their first lesson.",
  },
  {
    question: "Can I teach multiple instruments?",
    answer:
      "Absolutely! When creating your teacher profile, you can select all the instruments you teach. Students searching for any of those instruments will be able to find your profile.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Frequently Asked{" "}
            <span className="text-primary">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions? We've got answers. If you can't find what you're
            looking for, feel free to contact us.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-left hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
