import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentTeacherProfile } from "@/app/actions/get-teacher-profile";
import {
  getCurrentStudentProfile,
  getParentStudentProfiles,
} from "@/app/actions/get-student-profile";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import EditableTeacherProfile from "@/app/components/profile/EditableTeacherProfile";
import EditableStudentProfile from "@/app/components/profile/EditableStudentProfile";
import EditableParentProfile from "@/app/components/profile/EditableParentProfile";

export default async function MyProfilePage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const role = clerkUser.publicMetadata?.role as string | undefined;

  // Handle Teacher profile
  if (role === "TEACHER") {
    const teacher = await getCurrentTeacherProfile();
    if (!teacher) {
      redirect("/onboarding");
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-5xl mx-auto">
              <EditableTeacherProfile
                teacher={teacher}
                firstName={teacher.user.firstName}
                lastName={teacher.user.lastName}
                email={teacher.user.email}
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle Student profile
  if (role === "STUDENT") {
    const student = await getCurrentStudentProfile();
    if (!student) {
      redirect("/onboarding");
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-5xl mx-auto">
              <EditableStudentProfile student={student} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle Parent profile
  if (role === "PARENT") {
    const parentData = await getParentStudentProfiles();
    if (!parentData) {
      redirect("/onboarding");
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-5xl mx-auto">
              <EditableParentProfile
                user={parentData.user}
                students={parentData.students}
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Unknown role, redirect to home
  redirect("/");
}
