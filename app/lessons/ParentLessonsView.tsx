"use client";

import Link from "next/link";
import Image from "next/image";
import { shouldUnoptimizeImages } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getNextLessonDate = (dayOfWeek: number, startTime: string) => {
  const now = new Date();
  const currentDay = now.getDay();
  const [hours, minutes] = startTime.split(':').map(Number);

  let daysUntil = (dayOfWeek - currentDay + 7) % 7;

  if (daysUntil === 0) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour > hours || (currentHour === hours && currentMinute >= minutes)) {
      daysUntil = 7;
    }
  }

  if (daysUntil === 0) {
    return now;
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate;
};

interface ParentLessonsViewProps {
  students: Array<{
    student: any;
    lessons: any[];
  }>;
}

export default function ParentLessonsView({ students }: ParentLessonsViewProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Student Profiles</h3>
          <p className="text-muted-foreground mb-4">
            You need to create student profiles before you can view lessons.
          </p>
          <Button asChild>
            <Link href="/my-profile">Create Student Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {students.map((studentData) => {
          const studentName = `${studentData.student.firstName || ''} ${studentData.student.lastName || ''}`.trim() || 'Student';
          const studentImage = studentData.student.imageUrl;
          const lessons = studentData.lessons;

          return (
            <AccordionItem key={studentData.student.id} value={studentData.student.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  {studentImage && (
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={studentImage}
                        alt={studentName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized={shouldUnoptimizeImages()}
                      />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="font-semibold">{studentName}</div>
                    <div className="text-sm text-muted-foreground">
                      {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {lessons.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {studentName} doesn't have any scheduled lessons yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 pt-4">
                    {lessons.map((lessonData) => {
                      const teacherImage = lessonData.teacher.imageUrl || lessonData.teacherUser.imageUrl;
                      const teacherName = `${lessonData.teacherUser.firstName || ''} ${lessonData.teacherUser.lastName || ''}`.trim() || 'Teacher';
                      const dayName = DAYS_OF_WEEK[lessonData.timeslot.dayOfWeek];
                      const startTime = formatTime(lessonData.timeslot.startTime);
                      const endTime = formatTime(lessonData.timeslot.endTime);
                      const instrumentName = lessonData.instrument.name;
                      const nextLessonDate = getNextLessonDate(lessonData.timeslot.dayOfWeek, lessonData.timeslot.startTime);
                      const latestNote = lessonData.latestNote;

                      return (
                        <Card key={lessonData.lesson.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              {teacherImage && (
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                  <Image
                                    src={teacherImage}
                                    alt={teacherName}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                    unoptimized={shouldUnoptimizeImages()}
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <CardTitle className="text-xl mb-1">
                                      {teacherName} - {instrumentName}
                                    </CardTitle>
                                    <p className="text-muted-foreground">
                                      {dayName}s, {startTime} - {endTime}
                                    </p>
                                  </div>
                                  <Link
                                    href={`/lessons/${lessonData.lesson.id}`}
                                    className="text-sm text-primary hover:underline whitespace-nowrap"
                                  >
                                    View Details →
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="text-sm font-medium mb-1">Next Lesson</p>
                              <p className="text-foreground">
                                {nextLessonDate.toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>

                            {latestNote && (
                              <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold">Latest Notes</h4>
                                  <Link
                                    href={`/lessons/${lessonData.lesson.id}`}
                                    className="text-sm text-primary hover:underline"
                                  >
                                    View All Notes →
                                  </Link>
                                </div>
                                {latestNote.noteTitle && (
                                  <p className="font-medium text-sm mb-2">{latestNote.noteTitle}</p>
                                )}
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                  {latestNote.notes}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(latestNote.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}

                            {!latestNote && (
                              <div className="border-t pt-4">
                                <p className="text-sm text-muted-foreground italic">
                                  No notes yet from the teacher.
                                </p>
                                <Link
                                  href={`/lessons/${lessonData.lesson.id}`}
                                  className="text-sm text-primary hover:underline mt-2 inline-block"
                                >
                                  View Lesson Details →
                                </Link>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
