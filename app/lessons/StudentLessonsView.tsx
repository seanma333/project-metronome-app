"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Calculate next lesson date based on day of week and time
const getNextLessonDate = (dayOfWeek: number, startTime: string) => {
  const now = new Date();
  const currentDay = now.getDay();
  const [hours, minutes] = startTime.split(':').map(Number);

  // Calculate days until next occurrence
  let daysUntil = (dayOfWeek - currentDay + 7) % 7;

  // If it's today but the time has passed, move to next week
  if (daysUntil === 0) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour > hours || (currentHour === hours && currentMinute >= minutes)) {
      daysUntil = 7;
    }
  }

  // If daysUntil is 0 and we're checking today, use today
  if (daysUntil === 0) {
    return now;
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate;
};

interface StudentLessonsViewProps {
  lessons: any[];
}

export default function StudentLessonsView({ lessons }: StudentLessonsViewProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Lessons</h3>
          <p className="text-muted-foreground">
            You don't have any scheduled lessons yet. Start by requesting a booking with a teacher.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <Card key={lessonData.lesson.id}>
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
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">
                    {teacherName} - {instrumentName}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {dayName}s, {startTime} - {endTime}
                  </p>
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
                  <h4 className="font-semibold mb-2">Latest Notes</h4>
                  {latestNote.noteTitle && (
                    <p className="font-medium text-sm mb-2">{latestNote.noteTitle}</p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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
                    No notes yet from your teacher.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
