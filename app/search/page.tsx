import { SearchPageContent } from "./SearchPageContent";
import { getInstruments, getLanguages } from "@/app/actions/get-instruments-languages";
import { getUserPreferences } from "@/app/actions/get-user-preferences";
import {
  getCurrentStudentProfile,
  getParentStudentProfiles,
} from "@/app/actions/get-student-profile";
import { currentUser } from "@clerk/nextjs/server";
import Navbar from "@/app/components/common/Navbar";

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default async function SearchPage() {
  const clerkUser = await currentUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;

  const [instruments, languages, userPreferences, studentProfile, parentData] = await Promise.all([
    getInstruments(),
    getLanguages(),
    getUserPreferences(),
    role === "STUDENT" ? getCurrentStudentProfile() : Promise.resolve(null),
    role === "PARENT" ? getParentStudentProfiles() : Promise.resolve(null),
  ]);

  // Calculate default age
  let defaultAge = 4;
  if (studentProfile?.dateOfBirth) {
    const age = calculateAge(studentProfile.dateOfBirth);
    if (age !== null && age >= 4) {
      defaultAge = age;
    }
  }

  // Serialize dates for client components
  const serializedStudentProfile = studentProfile
    ? {
        id: studentProfile.id,
        dateOfBirth: studentProfile.dateOfBirth
          ? new Date(studentProfile.dateOfBirth).toISOString()
          : null,
      }
    : null;

  const serializedParentStudents = parentData?.students
    ? parentData.students.map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth
          ? new Date(student.dateOfBirth).toISOString()
          : null,
      }))
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 flex flex-col md:flex-row">
        <SearchPageContent
          instruments={instruments}
          languages={languages}
          userPreferences={userPreferences}
          defaultAge={defaultAge}
          studentProfile={serializedStudentProfile}
          parentStudents={serializedParentStudents}
        />
      </main>
    </div>
  );
}
