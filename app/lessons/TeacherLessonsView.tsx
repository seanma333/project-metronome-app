"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { shouldUnoptimizeImages } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { createLessonNote, updateLessonNote, getLessonNote } from "@/app/actions/manage-lesson-notes";
import NoteDialog from "./NoteDialog";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

interface TeacherLessonsViewProps {
  lessons: any[];
}

export default function TeacherLessonsView({ lessons }: TeacherLessonsViewProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleCreateNote = (lesson: any) => {
    setSelectedLesson(lesson);
    setSelectedNote(null);
    setIsEditing(false);
    setNoteDialogOpen(true);
  };

  const handleEditNote = async (lesson: any, note: any) => {
    setSelectedLesson(lesson);

    // Fetch full note data
    const result = await getLessonNote(note.id);
    if (result.error) {
      alert(result.error);
      return;
    }

    setSelectedNote(result.note);
    setIsEditing(true);
    setNoteDialogOpen(true);
  };

  const handleNoteSaved = () => {
    setNoteDialogOpen(false);
    setSelectedLesson(null);
    setSelectedNote(null);
    setIsEditing(false);
    // Refresh the page to show updated notes
    window.location.reload();
  };

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
            You don't have any scheduled lessons yet. Students will appear here once they book lessons with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {lessons.map((lessonData) => {
          const studentName = `${lessonData.student.firstName || ''} ${lessonData.student.lastName || ''}`.trim() || 'Student';
          const studentImage = lessonData.student.imageUrl;
          const dayName = DAYS_OF_WEEK[lessonData.timeslot.dayOfWeek];
          const startTime = formatTime(lessonData.timeslot.startTime);
          const endTime = formatTime(lessonData.timeslot.endTime);
          const instrumentName = lessonData.instrument.name;
          const latestNote = lessonData.latestNote;

          return (
            <Card key={lessonData.lesson.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {studentImage && (
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={studentImage}
                        alt={studentName}
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
                          {studentName} - {instrumentName}
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
                {latestNote && (
                  <div className="border-t pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Latest Notes</h4>
                        <Link
                          href={`/lessons/${lessonData.lesson.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View All →
                        </Link>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditNote(lessonData, latestNote)}
                          className="flex items-center gap-2"
                        >
                          <Image
                            src="/svg/edit_button.svg"
                            alt="Edit"
                            width={16}
                            height={16}
                            className="w-4 h-4"
                            unoptimized={shouldUnoptimizeImages()}
                          />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateNote(lessonData)}
                          className="flex items-center gap-2"
                        >
                          <Image
                            src="/svg/add_button.svg"
                            alt="Add"
                            width={16}
                            height={16}
                            className="w-4 h-4"
                            unoptimized={shouldUnoptimizeImages()}
                          />
                          New Note
                        </Button>
                      </div>
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
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground italic">
                        No notes yet. Create your first note for this lesson.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateNote(lessonData)}
                        className="flex items-center gap-2"
                      >
                        <Image
                          src="/svg/add_button.svg"
                          alt="Add"
                          width={16}
                          height={16}
                          className="w-4 h-4"
                        />
                        Create Note
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {noteDialogOpen && selectedLesson && (
        <NoteDialog
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          lesson={selectedLesson}
          note={selectedNote}
          isEditing={isEditing}
          onSave={handleNoteSaved}
        />
      )}
    </>
  );
}
