import type { Metadata } from "next";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | TempoLink",
  description:
    "Read the terms and conditions for using TempoLink as a music teacher or student.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <header className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Terms of Service
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: November 15, 2025
              </p>
              <p className="text-muted-foreground">
                Welcome to TempoLink (&quot;TempoLink,&quot; &quot;we,&quot; &quot;our,&quot; or
                &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to
                and use of TempoLink, including any content, functionality, and
                services offered on or through our website and applications
                (collectively, the &quot;Service&quot;). By accessing or using the
                Service, you agree to be bound by these Terms. If you do not
                agree to these Terms, you may not use the Service.
              </p>
            </header>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                1. Eligibility and Accounts
              </h2>
              <p className="text-muted-foreground">
                The Service is intended only for individuals who are 13 years
                of age or older. By using the Service, you represent and
                warrant that you are at least 13 years old, and if you are
                under the age of majority where you live, you have the consent
                of a parent or legal guardian to use the Service.
              </p>
              <p className="text-muted-foreground">
                To use certain features, you must create an account and provide
                accurate, current, and complete information. You agree to keep
                your account information up to date, to maintain the
                confidentiality of your login credentials, and to be
                responsible for all activities that occur under your account.
                You agree to notify us promptly of any unauthorized use of your
                account or other breach of security.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                2. Role of TempoLink
              </h2>
              <p className="text-muted-foreground">
                TempoLink is a scheduling and discovery tool that enables music
                teachers (&quot;Teachers&quot;) to showcase their teaching services and
                manage availability, and students or their parents/guardians
                (&quot;Students&quot;) to discover Teachers and request lessons.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  TempoLink does not provide music lessons itself and does not
                  supervise, control, or guarantee any Teacher, Student,
                  lesson, or interaction.
                </li>
                <li>
                  At present, TempoLink does not collect payments from Students
                  on behalf of Teachers. Any payment terms, if applicable, are
                  arranged directly between Teachers and Students outside of
                  the Service.
                </li>
                <li>
                  TempoLink may in the future offer paid plans or premium
                  features for Teachers or other users. If we introduce paid
                  features, we will provide additional terms and pricing
                  details, which will become part of these Terms when you
                  choose to use those paid features.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                3. User Content and Public Profiles
              </h2>
              <p className="text-muted-foreground">
                You may provide content such as profile information,
                descriptions of services, schedule availability, images, links,
                and other materials (&quot;User Content&quot;). You retain ownership of
                your User Content but grant TempoLink a non-exclusive,
                worldwide, royalty-free license to host, use, display,
                reproduce, modify, and distribute your User Content as
                necessary to operate and improve the Service.
              </p>
              <p className="text-muted-foreground">
                Teachers may create public profiles that may include: name,
                photo, location (based on address you provide), instruments
                taught, languages spoken, experience, pricing (if you choose to
                share it), email address, and external links (for example,
                website or social media). Information you choose to make public
                in your profile will be visible to other users and visitors to
                the Site.
              </p>
              <p className="text-muted-foreground">
                TempoLink may offer an &quot;AI Assist&quot; feature that helps you
                generate or refine your profile or other content. To provide AI
                Assist, we send your prompts, profile details, and related data
                to our third-party AI provider (currently OpenAI) to generate
                suggested text. Use of AI Assist is optional, and you are
                responsible for reviewing and editing AI-generated content
                before publishing it as your own.
              </p>
              <p className="text-muted-foreground">
                You are solely responsible for your User Content and any
                information you make public, and you represent and warrant that
                your User Content does not infringe any third-party rights and
                complies with these Terms and applicable law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                4. Acceptable Use
              </h2>
              <p className="text-muted-foreground">
                You agree not to use the Service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>In any unlawful manner or for any unlawful purpose.</li>
                <li>
                  To misrepresent your identity, qualifications, or your
                  affiliation with any person or entity.
                </li>
                <li>
                  To post or transmit content that is illegal, harmful,
                  fraudulent, defamatory, obscene, harassing, or otherwise
                  objectionable.
                </li>
                <li>
                  To attempt to exploit or harm minors, including by requesting
                  or posting inappropriate content involving minors.
                </li>
                <li>
                  To interfere with or disrupt the Service or servers or
                  networks connected to the Service.
                </li>
                <li>
                  To reverse engineer, decompile, or attempt to extract the
                  source code of the Service, except as permitted by law.
                </li>
                <li>
                  To use any automated means (such as bots or scrapers) to
                  access the Service without our prior written consent.
                </li>
              </ul>
              <p className="text-muted-foreground">
                We may remove or modify User Content, or suspend or terminate
                accounts that violate these Terms or applicable law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                5. Scheduling and Interactions Between Users
              </h2>
              <p className="text-muted-foreground">
                Users are solely responsible for communications, scheduling,
                and any lessons or services arranged using the Service.
                TempoLink does not vet, endorse, or guarantee the
                qualifications, background, or suitability of any Teacher or
                Student. You are solely responsible for exercising appropriate
                caution and conducting any checks you deem necessary before
                meeting or engaging with other users.
              </p>
              <p className="text-muted-foreground">
                For Students under the age of majority, a parent or legal
                guardian should be involved in any decision to engage a Teacher
                and in supervising the Student&apos;s use of the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                6. Intellectual Property
              </h2>
              <p className="text-muted-foreground">
                The Service, including all software, text, graphics, logos, and
                other materials (excluding User Content), is owned by TempoLink
                or its licensors and is protected by intellectual property
                laws. We grant you a limited, non-exclusive, non-transferable,
                revocable license to use the Service for your personal or
                internal business purposes, in accordance with these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                7. Disclaimers
              </h2>
              <p className="text-muted-foreground">
                The Service is provided on an &quot;as is&quot; and &quot;as available&quot;
                basis without warranties of any kind, whether express, implied,
                or statutory. We do not warrant that the Service will meet your
                requirements, be uninterrupted, secure, or error-free, or that
                search results or recommendations will be accurate or reliable.
              </p>
              <p className="text-muted-foreground">
                AI-generated content provided through AI Assist may be
                inaccurate, incomplete, or inappropriate. You must review
                AI-generated text before using it, and you are solely
                responsible for any content you publish based on AI Assist.
              </p>
              <p className="text-muted-foreground">
                Some jurisdictions do not allow limitations on implied
                warranties, so these limitations may not apply to you.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                8. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, TempoLink and its
                affiliates, officers, employees, and agents will not be liable
                for any indirect, incidental, special, consequential, or
                punitive damages, or any loss of profits, data, or goodwill,
                arising from or related to your use of the Service. Our total
                liability for any claim arising out of or relating to the
                Service or these Terms will not exceed the greater of (a) the
                amount you have paid to TempoLink for the Service in the twelve
                (12) months preceding the claim, or (b) USD $100 (or equivalent
                in local currency).
              </p>
              <p className="text-muted-foreground">
                Some jurisdictions do not allow the exclusion or limitation of
                certain damages, so these limitations may not apply to you.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                9. Indemnification
              </h2>
              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless TempoLink and
                its affiliates, officers, employees, and agents from and
                against any claims, liabilities, damages, losses, and expenses
                (including reasonable legal fees) arising out of or in any way
                connected with your use of the Service, your User Content, your
                violation of these Terms, or your violation of any rights of
                another person or entity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                10. Changes to the Service and Terms
              </h2>
              <p className="text-muted-foreground">
                We may modify or discontinue any part of the Service at any
                time, with or without notice. We may update these Terms from
                time to time. When we do, we will revise the &quot;Last updated&quot;
                date above and, where required by law, notify you or seek your
                consent. Your continued use of the Service after the updated
                Terms become effective constitutes your acceptance of the
                changes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                11. Termination
              </h2>
              <p className="text-muted-foreground">
                You may stop using the Service at any time. We may suspend or
                terminate your access to the Service at any time, with or
                without notice, if we believe you have violated these Terms or
                applicable law, or for any other reason at our sole discretion.
                Upon termination, your right to use the Service will cease
                immediately, but certain provisions of these Terms (including
                ownership, disclaimers, limitations of liability, and
                indemnification) will continue to apply.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                12. Governing Law and Disputes
              </h2>
              <p className="text-muted-foreground">
                These Terms and any dispute arising out of or in connection
                with them shall be governed by and construed in accordance with
                the laws of the United States of America, without regard to its conflict of
                law principles. Any disputes arising under or in connection
                with these Terms will be subject to the exclusive jurisdiction
                of the courts located in the United States of America, unless
                applicable law requires otherwise.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                13. Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us
                at:
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
                These Terms of Service are provided for general informational
                purposes only and do not constitute legal advice. You should
                consult with a licensed attorney to review and adapt these
                terms for your specific jurisdiction and business needs.
              </p>
            </section> */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


