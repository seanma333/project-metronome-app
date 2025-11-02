import { notFound } from "next/navigation";
import { getTeacherByProfileName } from "@/app/actions/get-teacher-profile";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import TeacherProfileInfo from "@/app/components/profile/TeacherProfileInfo";
import ProfileSection from "@/app/components/profile/ProfileSection";
import InstrumentBadge from "@/app/components/profile/InstrumentBadge";
import LanguageBadge from "@/app/components/profile/LanguageBadge";

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
              </div>

              {/* Right Side - Bio, Instruments, Languages */}
              <div className="md:col-span-2 space-y-6">
                {/* Bio */}
                <ProfileSection title="Biography">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {teacher.bio || "No biography available."}
                  </p>
                </ProfileSection>

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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
