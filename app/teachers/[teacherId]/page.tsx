import { redirect } from "next/navigation";
import { getTeacherById } from "@/app/actions/get-teacher-by-id";
import { notFound } from "next/navigation";

interface TeacherIdPageProps {
  params: Promise<{ teacherId: string }>;
}

export default async function TeacherIdPage({
  params,
}: TeacherIdPageProps) {
  const { teacherId } = await params;

  // Get teacher by ID to find their profileName
  const teacher = await getTeacherById(teacherId);

  if (!teacher) {
    notFound();
  }

  // Redirect to the teacher profile page using profileName
  redirect(`/teacher-profiles/${teacher.profileName}`);
}
