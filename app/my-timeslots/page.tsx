import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentTeacherTimeslots } from "@/app/actions/get-teacher-timeslots";
import { getUserPreferences } from "@/app/actions/get-user-preferences";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import TimeslotsGrid from "./TimeslotsGrid";
import AcceptingStudentsCheckbox from "./AcceptingStudentsCheckbox";

export default async function MyTimeslotsPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const role = clerkUser.publicMetadata?.role as string | undefined;

  if (role !== "TEACHER") {
    redirect("/");
  }

  const [timeslots, preferences] = await Promise.all([
    getCurrentTeacherTimeslots(),
    getUserPreferences(),
  ]);

  const teachingFormat = preferences?.teacher?.teachingFormat || "ONLINE_ONLY";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-8">My Booking Timeslots</h1>
            <p className="text-muted-foreground mb-6 max-w-3xl">
              Manage your weekly availability by creating, moving, and editing time slots.
              Hover over empty grid cells to add new 15-minute slots, drag existing slots to move them,
              resize them by dragging the top or bottom edges, or delete them by hovering and clicking the delete button.
              All changes are automatically saved.
            </p>
            <AcceptingStudentsCheckbox initialValue={preferences?.teacher?.acceptingStudents ?? false} />
            <TimeslotsGrid timeslots={timeslots || []} defaultTeachingFormat={teachingFormat} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
