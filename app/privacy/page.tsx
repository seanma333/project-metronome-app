import type { Metadata } from "next";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | TempoLink",
  description:
    "Learn how TempoLink collects, uses, and protects your personal information when you use our platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Privacy Policy
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: November 15, 2025
              </p>
              <p className="text-muted-foreground">
                This Privacy Policy explains how TempoLink (&quot;TempoLink,&quot;
                &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, shares, and
                protects personal information when you use our website and
                services (the &quot;Service&quot;). By using the Service, you acknowledge that
                you have read and understood this Privacy Policy. If you do not
                agree, please do not use the Service.
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                1. Information We Collect
              </h2>
              <p className="text-muted-foreground">
                We collect the following categories of information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <span className="font-semibold">
                    Account and profile information:
                  </span>{" "}
                  such as your name, email address, authentication credentials
                  (stored in hashed form where applicable), role (for example,
                  Teacher or Student/parent), and profile details you choose to
                  provide (such as instruments, languages, experience,
                  biography, and external links).
                </li>
                <li>
                  <span className="font-semibold">
                    Teacher address and location data:
                  </span>{" "}
                  Teachers may provide an address or general location (for
                  example, city or region). We use this information to power the
                  search and discovery features so Students can find Teachers
                  based on location or time zone. Depending on how your profile
                  is configured, we may display generalized location
                  information (for example, your city or area) on your public
                  profile.
                </li>
                <li>
                  <span className="font-semibold">
                    Scheduling and lesson-related information:
                  </span>{" "}
                  including availability, booked time slots, lesson
                  preferences, and related details you enter into the Service,
                  as well as metadata about lesson requests and confirmations
                  (such as dates, times, and associated accounts).
                </li>
                <li>
                  <span className="font-semibold">
                    Communications and support:
                  </span>{" "}
                  such as messages you send us (for example, via email or
                  in-app forms) and feedback or survey responses.
                </li>
                <li>
                  <span className="font-semibold">
                    Usage and device information:
                  </span>{" "}
                  including IP address, browser type, operating system,
                  referring URLs, pages viewed, access times, and information
                  about how you interact with the Service (such as features
                  used, clicks, and search queries).
                </li>
                <li>
                  <span className="font-semibold">
                    Cookies and similar technologies:
                  </span>{" "}
                  we use cookies and similar technologies to operate and
                  improve the Service. For more details, see our Cookie Policy.
                </li>
                <li>
                  <span className="font-semibold">AI Assist inputs:</span> when
                  you use &quot;AI Assist&quot; to generate or refine your profile or
                  other content, we collect the prompts, profile details, and
                  related information you submit, as well as the AI-generated
                  outputs.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                2. How We Use Your Information
              </h2>
              <p className="text-muted-foreground">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <span className="font-semibold">
                    To provide and maintain the Service:
                  </span>{" "}
                  including creating and managing user accounts, enabling
                  Teachers to create and manage profiles, enabling Students to
                  search for and connect with Teachers, and managing
                  scheduling and related functionality.
                </li>
                <li>
                  <span className="font-semibold">
                    To power search and discovery:
                  </span>{" "}
                  using Teacher location and profile data to help Students find
                  relevant Teachers (for example, by instrument, language,
                  proximity, or time zone).
                </li>
                <li>
                  <span className="font-semibold">To provide AI Assist:</span>{" "}
                  sending AI Assist inputs (such as profile data and prompts) to
                  our third-party AI provider (currently OpenAI) to generate
                  suggested content, and returning those suggestions for you to
                  review and edit. Use of AI Assist is optional, and you remain
                  responsible for the content you publish.
                </li>
                <li>
                  <span className="font-semibold">To communicate with you:</span>{" "}
                  including sending service-related notices (such as account
                  updates or security alerts) and responding to inquiries and
                  support requests.
                </li>
                <li>
                  <span className="font-semibold">
                    To improve and secure the Service:
                  </span>{" "}
                  including analyzing usage trends and performance, and
                  detecting, preventing, and responding to fraud, abuse,
                  security incidents, and other harmful activity.
                </li>
                <li>
                  <span className="font-semibold">Legal and compliance:</span>{" "}
                  including complying with applicable laws, regulations, legal
                  processes, or enforceable governmental requests, and
                  protecting our rights, privacy, safety, or property, and/or
                  that of our users or others.
                </li>
              </ul>
              <p className="text-muted-foreground">
                We process your information based on various legal bases,
                including the performance of a contract (providing the
                Service), our legitimate interests (running and improving the
                Service), compliance with legal obligations, and your consent
                where required (for example, for certain cookies or marketing
                communications).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                3. How We Share Your Information
              </h2>
              <p className="text-muted-foreground">
                We do not sell your personal information, and we do not use
                your data to serve third-party targeted advertising. We may
                share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <span className="font-semibold">Other users:</span> Teacher
                  public profile information (as configured by you) is visible
                  to Students and other visitors to the Site. Scheduling data
                  may be visible to counterparties as necessary (for example, a
                  Teacher and Student seeing their scheduled time).
                </li>
                <li>
                  <span className="font-semibold">Service providers:</span>{" "}
                  third-party vendors that help us operate the Service (such as
                  hosting providers, analytics providers, email delivery, and
                  customer support tools), and our AI provider (currently
                  OpenAI) for AI Assist functionality, acting as a processor or
                  service provider on our behalf.
                </li>
                <li>
                  <span className="font-semibold">Legal and safety:</span> where
                  required by law, regulation, legal process, or government
                  request, or when we believe disclosure is necessary to
                  protect the rights, property, or safety of TempoLink, our
                  users, or others.
                </li>
                <li>
                  <span className="font-semibold">Business transfers:</span> in
                  connection with a merger, acquisition, financing, or sale of
                  all or a portion of our business or assets, your information
                  may be transferred as part of that transaction, subject to
                  applicable law.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                4. Cookies and Similar Technologies
              </h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to keep you signed in,
                remember your preferences, and understand how users interact
                with the Service so we can improve it. TempoLink does not use
                cookies to serve third-party advertising on the Service. For
                more details, please refer to our Cookie Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                5. Data Retention
              </h2>
              <p className="text-muted-foreground">
                We retain personal information for as long as reasonably
                necessary to provide the Service to you, to comply with our
                legal obligations, to resolve disputes, and to enforce our
                agreements. Where allowed by law and consistent with your
                choices, we may retain certain information in an anonymized or
                aggregated form.
              </p>
              <p className="text-muted-foreground">
                If you request account deletion, we will take reasonable steps
                to delete or anonymize your personal information, except where
                we are required or permitted to retain certain information by
                law or for legitimate business purposes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                6. Children&apos;s Privacy
              </h2>
              <p className="text-muted-foreground">
                The Service is not intended for children under 13 years of age,
                and we do not knowingly collect personal information from
                children under 13. If you are under 13, you may not use the
                Service or provide any personal information.
              </p>
              <p className="text-muted-foreground">
                If we become aware that we have collected personal information
                from a child under 13, we will take steps to delete such
                information. If you believe a child under 13 has provided us
                with personal information, please contact us at
                {" "}
                [CONTACT EMAIL].
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                7. Data Security
              </h2>
              <p className="text-muted-foreground">
                We use reasonable technical and organizational measures to
                protect your information from unauthorized access, loss,
                misuse, or alteration. However, no method of transmission over
                the internet or electronic storage is completely secure, and we
                cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                8. International Transfers
              </h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in
                countries other than your own, where data protection laws may
                differ from those in your jurisdiction. Where required, we
                implement appropriate safeguards to protect your personal
                information in accordance with applicable law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                9. Your Rights and Choices
              </h2>
              <p className="text-muted-foreground">
                Depending on your location and applicable law, you may have
                certain rights regarding your personal information, such as:
                the right to request access to the personal information we hold
                about you, to request correction of inaccurate or incomplete
                information, to request deletion of certain information, to
                request restriction of processing, to object to certain types
                of processing, and to request a copy of your personal
                information in a structured, commonly used format.
              </p>
              <p className="text-muted-foreground">
                You can often exercise these rights directly through your
                account settings. Otherwise, you can contact us at
                {" "}
                [CONTACT EMAIL]. If you are in a jurisdiction with specific
                data protection rules, you may also have the right to lodge a
                complaint with your local data protection authority.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. When we
                do, we will revise the &quot;Last updated&quot; date above. Where
                required by law, we will notify you or seek your consent for
                material changes. Your continued use of the Service after any
                changes become effective constitutes your acceptance of the
                updated Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                11. Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have any questions or concerns about this Privacy Policy
                or our data practices, please contact us at:
              </p>
              <ul className="list-none space-y-1 text-muted-foreground">
                <li>
                  <span className="font-semibold">Email:</span>{" "}
                  <a
                    href="mailto:contact@tempo-link.xyz"
                    className="text-primary hover:underline"
                  >
                    contact@tempo-link.xyz
                  </a>
                </li>
              </ul>
            </section>

            {/* <section className="rounded-md border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">
                This Privacy Policy is provided for general informational
                purposes only and does not constitute legal advice. You should
                consult with a licensed attorney to review and adapt this
                policy for your specific jurisdiction and business needs.
              </p>
            </section> */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


