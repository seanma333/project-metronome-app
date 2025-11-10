import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getTeacherById } from "@/app/actions/get-teacher-by-id";
import { getTeacherTimeslotsById } from "@/app/actions/get-teacher-timeslots-by-id";
import { getParentChildren } from "@/app/actions/get-parent-children";
import { getUserPreferences } from "@/app/actions/get-user-preferences";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import RequestBookingContent from "./RequestBookingContent";

interface RequestBookingPageProps {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ format?: string; instrument?: string; studentId?: string }>;
}

export default async function RequestBookingPage({
  params,
  searchParams,
}: RequestBookingPageProps) {
  const { teacherId } = await params;
  const { format, instrument, studentId } = await searchParams;

  // Check authentication and role
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check user role from metadata
  const role = user.publicMetadata?.role as string | undefined;

  if (!role || (role !== "STUDENT" && role !== "PARENT")) {
    redirect("/");
  }

  // Get teacher data
  const teacher = await getTeacherById(teacherId);

  if (!teacher) {
    notFound();
  }

  // Determine lesson format (default to online)
  const lessonFormat = format === "in-person" ? "IN_PERSON_ONLY" : "ONLINE_ONLY";

  // Get all available timeslots for the teacher (we'll filter client-side)
  const timeslots = await getTeacherTimeslotsById(teacherId);

  // Get children/student profiles for the current user
  const children = await getParentChildren();

  // Get user's preferred timezone
  const userPreferences = await getUserPreferences();
  const userTimezone = userPreferences?.user.preferredTimezone || null;

  // Get teacher's preferred timezone
  const teacherTimezone = teacher.user.preferredTimezone || null;

  // Determine selected instrument (default to first alphabetically)
  const selectedInstrument = instrument || (teacher.instruments.length > 0
    ? teacher.instruments.sort((a, b) => a.name.localeCompare(b.name))[0].name
    : null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <RequestBookingContent
              teacher={teacher}
              timeslots={timeslots || []}
              initialFormat={lessonFormat}
              children={children || []}
              selectedInstrument={selectedInstrument}
              userRole={role}
              userTimezone={userTimezone}
              teacherTimezone={teacherTimezone}
              initialStudentId={studentId}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
