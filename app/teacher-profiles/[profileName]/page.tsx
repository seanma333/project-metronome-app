import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getTeacherByProfileName } from "@/app/actions/get-teacher-profile";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import TeacherProfileInfo from "@/app/components/profile/TeacherProfileInfo";
import ProfileSection from "@/app/components/profile/ProfileSection";
import InstrumentBadge from "@/app/components/profile/InstrumentBadge";
import LanguageBadge from "@/app/components/profile/LanguageBadge";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { SocialIcon } from "react-social-icons";

interface TeacherProfilePageProps {
  params: Promise<{ profileName: string }>;
}

export default async function TeacherProfilePage({
  params,
}: TeacherProfilePageProps) {
  const { profileName } = await params;
  const teacher = await getTeacherByProfileName(profileName);

  if (!teacher) {
    notFound();
  }

  // Check if user is logged in and is a STUDENT or PARENT
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const canBookLesson = user && (role === "STUDENT" || role === "PARENT");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Side - Profile Info */}
              <div className="md:col-span-1">
                <TeacherProfileInfo
                  imageUrl={teacher.imageUrl}
                  firstName={teacher.user.firstName}
                  lastName={teacher.user.lastName}
                  email={teacher.user.email}
                />
                {canBookLesson && (
                  <div className="mt-6">
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/teachers/${teacher.id}/request-booking`}>
                        Book a Lesson
                      </Link>
                    </Button>
                  </div>
                )}
                {!user && (
                  <div className="mt-6">
                    <Button asChild className="w-full" size="lg">
                      <Link href="/sign-up">
                        Create Account to Book a Lesson
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Right Side - Bio, Instruments, Languages */}
              <div className="md:col-span-2 space-y-6">
                {/* Bio */}
                <ProfileSection title="Biography">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {teacher.bio || "No biography available."}
                  </p>
                </ProfileSection>

                {/* Follow Me */}
                {teacher.socialLinks && teacher.socialLinks.length > 0 && (
                  <ProfileSection title="Follow Me">
                    <div className="flex flex-wrap gap-4">
                      {teacher.socialLinks.map((link) => (
                        <div
                          key={link.id}
                          className="transition-transform hover:scale-110"
                        >
                          <SocialIcon
                            url={link.externalUrl}
                            style={{ width: 40, height: 40 }}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        </div>
                      ))}
                    </div>
                  </ProfileSection>
                )}

                {/* Instruments */}
                <ProfileSection title="Instruments">
                  <div className="flex flex-wrap gap-2">
                    {teacher.instruments.length > 0 ? (
                      teacher.instruments.map((instrument) => (
                        <InstrumentBadge key={instrument.id} instrument={instrument} />
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No instruments listed.</p>
                    )}
                  </div>
                </ProfileSection>

                {/* Languages */}
                <ProfileSection title="Languages">
                  <div className="flex flex-wrap gap-2">
                    {teacher.languages.length > 0 ? (
                      teacher.languages.map((language) => (
                        <LanguageBadge key={language.id} language={language} />
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No languages listed.</p>
                    )}
                  </div>
                </ProfileSection>
              </div>
            </div>

            {/* Acknowledgements */}
            <div className="mt-12 pt-6 border-t border-border">
              <div className="text-xs text-muted-foreground space-y-1 text-center max-w-2xl mx-auto">
                <div>
                  Icons made by{" "}
                  <a
                    href="https://www.flaticon.com/authors/flat-icons"
                    title="Flat Icons"
                    className="text-primary hover:text-primary/80 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Flat Icons
                  </a>{" "}
                  from{" "}
                  <a
                    href="https://www.flaticon.com/"
                    title="Flaticon"
                    className="text-primary hover:text-primary/80 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.flaticon.com
                  </a>
                </div>
                <div>
                  Icons made by{" "}
                  <a
                    href="https://www.freepik.com"
                    title="Freepik"
                    className="text-primary hover:text-primary/80 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Freepik
                  </a>{" "}
                  from{" "}
                  <a
                    href="https://www.flaticon.com/"
                    title="Flaticon"
                    className="text-primary hover:text-primary/80 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.flaticon.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
