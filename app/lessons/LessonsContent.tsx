"use client";

import { useEffect, useState } from "react";
import { getStudentLessons, getParentLessons, getTeacherLessons } from "@/app/actions/get-lessons";
import StudentLessonsView from "./StudentLessonsView";
import ParentLessonsView from "./ParentLessonsView";
import TeacherLessonsView from "./TeacherLessonsView";

interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "TEACHER" | "STUDENT" | "PARENT" | null;
  imageUrl: string | null;
  preferredTimezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LessonsContentProps {
  user: User;
}

export default function LessonsContent({ user }: LessonsContentProps) {
  const [lessonsData, setLessonsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (user.role === "TEACHER") {
          result = await getTeacherLessons();
        } else if (user.role === "PARENT") {
          result = await getParentLessons();
        } else {
          result = await getStudentLessons();
        }

        if (result.error) {
          setError(result.error);
        } else {
          setLessonsData(result);
        }
      } catch (err) {
        console.error("Error fetching lessons:", err);
        setError("Failed to load lessons");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [user.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (user.role === "TEACHER") {
    return <TeacherLessonsView lessons={lessonsData?.lessons || []} />;
  } else if (user.role === "PARENT") {
    return <ParentLessonsView students={lessonsData?.students || []} />;
  } else {
    return <StudentLessonsView lessons={lessonsData?.lessons || []} />;
  }
}
