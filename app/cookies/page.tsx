import type { Metadata } from "next";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";

export const metadata: Metadata = {
  title: "Cookie Policy | TempoLink",
  description:
    "Learn how TempoLink uses cookies and similar technologies on our platform.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Cookie Policy
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: November 15, 2025
              </p>
              <p className="text-muted-foreground">
                This Cookie Policy explains how TempoLink (&quot;TempoLink,&quot;
                &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies and similar
                technologies on our website and services (the &quot;Service&quot;).
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                1. What Are Cookies?
              </h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are stored on your device when
                you visit a website. They are widely used to make websites work,
                or work more efficiently, and to provide information to the site
                owners. Similar technologies (such as web beacons, pixels, and
                local storage) may also be used for similar purposes. In this
                policy, we refer to all of these technologies as &quot;cookies.&quot;
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                2. Types of Cookies We Use
              </h2>
              <p className="text-muted-foreground">
                We use the following categories of cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <span className="font-semibold">
                    Strictly necessary cookies:
                  </span>{" "}
                  these cookies are essential to provide you with the Service
                  and to enable core functionality, such as logging in and
                  authenticating your account, and keeping your session active
                  as you navigate between pages. Without these cookies, the
                  Service may not function properly.
                </li>
                <li>
                  <span className="font-semibold">Functional cookies:</span>{" "}
                  these cookies help remember your preferences and choices, such
                  as language or region settings and user interface
                  preferences. They enhance your experience but are not strictly
                  required for the Service to work.
                </li>
                <li>
                  <span className="font-semibold">
                    Analytics and performance cookies:
                  </span>{" "}
                  these cookies help us understand how users interact with the
                  Service, such as which pages are visited most often, how users
                  navigate the site, and error diagnostics and performance
                  metrics. We use this information to improve the Service and
                  user experience.
                </li>
                <li>
                  <span className="font-semibold">No advertising cookies:</span>{" "}
                  TempoLink does not use cookies to serve third-party targeted
                  advertising on the Service. We do not use third-party ad
                  networks on the Service.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                3. Third-Party Cookies
              </h2>
              <p className="text-muted-foreground">
                Some cookies may be set by third-party service providers that
                help us operate and improve the Service, such as analytics
                providers, infrastructure and hosting providers, and tools that
                help with performance monitoring or error tracking. These third
                parties may collect information about your use of the Service
                over time for the purposes described in this policy (for example,
                analytics and security), but not for third-party advertising
                through TempoLink.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                4. How to Control Cookies
              </h2>
              <p className="text-muted-foreground">
                You have choices regarding cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <span className="font-semibold">Browser settings:</span> most
                  web browsers allow you to control cookies through their
                  settings (for example, to block, delete, or receive alerts
                  about cookies). Please note that if you disable certain
                  cookies (especially strictly necessary cookies), some parts of
                  the Service may not function correctly.
                </li>
                <li>
                  <span className="font-semibold">Device settings:</span> your
                  device or operating system may provide additional tools to
                  control cookies and similar technologies.
                </li>
                <li>
                  <span className="font-semibold">Do Not Track:</span> some
                  browsers offer a &quot;Do Not Track&quot; (&quot;DNT&quot;) setting. The
                  Service currently does not respond to DNT signals, as there is
                  no common industry standard for DNT.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                5. Changes to This Cookie Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time. When we do,
                we will revise the &quot;Last updated&quot; date above. Where required
                by law, we will notify you or obtain your consent to material
                changes. Your continued use of the Service after any changes
                become effective constitutes your acceptance of the updated
                Cookie Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                6. Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have any questions about our use of cookies or this
                Cookie Policy, please contact us at:
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
                This Cookie Policy is provided for general informational
                purposes only and does not constitute legal advice. You should
                consult with a licensed attorney to review and adapt this policy
                for your specific jurisdiction and business needs.
              </p>
            </section> */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


