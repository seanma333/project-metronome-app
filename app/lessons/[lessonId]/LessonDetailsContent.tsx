"use client";

import { useState } from "react";
import Image from "next/image";
import { shouldUnoptimizeImages } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";
import { createLessonNote, updateLessonNote, getLessonNote, deleteLessonNote } from "@/app/actions/manage-lesson-notes";
import NoteDialog from "../NoteDialog";

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

interface LessonDetailsContentProps {
  lesson: any;
  user: any;
}

export default function LessonDetailsContent({ lesson, user }: LessonDetailsContentProps) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingNotes, setDeletingNotes] = useState<Set<string>>(new Set());

  const isTeacher = user.role === "TEACHER" && lesson.teacher.id === user.id;
  const dayName = DAYS_OF_WEEK[lesson.timeslot.dayOfWeek];
  const startTime = formatTime(lesson.timeslot.startTime);
  const endTime = formatTime(lesson.timeslot.endTime);
  const instrumentName = lesson.instrument.name;
  const nextLessonDate = getNextLessonDate(lesson.timeslot.dayOfWeek, lesson.timeslot.startTime);

  // Display name based on role
  let displayName = "";
  let displayImage = null;
  if (isTeacher) {
    displayName = `${lesson.student.firstName || ''} ${lesson.student.lastName || ''}`.trim() || 'Student';
    displayImage = lesson.student.imageUrl;
  } else {
    displayName = `${lesson.teacherUser.firstName || ''} ${lesson.teacherUser.lastName || ''}`.trim() || 'Teacher';
    displayImage = lesson.teacher.imageUrl || lesson.teacherUser.imageUrl;
  }

  const handleCreateNote = () => {
    setSelectedNote(null);
    setIsEditing(false);
    setNoteDialogOpen(true);
  };

  const handleEditNote = async (note: any) => {
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
    setSelectedNote(null);
    setIsEditing(false);
    // Refresh the page to show updated notes
    window.location.reload();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (deletingNotes.has(noteId)) return;

    setDeletingNotes(prev => new Set(prev).add(noteId));

    try {
      const result = await deleteLessonNote(noteId);

      if (result.error) {
        alert(result.error);
      } else {
        // Refresh the page to show updated notes
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note. Please try again.");
    } finally {
      setDeletingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteId);
        return newSet;
      });
    }
  };

  // Create a lesson object for the NoteDialog
  const lessonForDialog = {
    lesson: {
      id: lesson.lesson.id,
    },
  };

  return (
    <>
      <div className="space-y-6">
        {/* Back button */}
        <Link
          href="/lessons"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lessons
        </Link>

        {/* Lesson Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              {displayImage && (
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={displayImage}
                    alt={displayName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized={shouldUnoptimizeImages()}
                  />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-1">
                  {displayName} - {instrumentName}
                </CardTitle>
                <p className="text-muted-foreground text-lg">
                  {dayName}s, {startTime} - {endTime}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Next Lesson</p>
              <p className="text-foreground text-lg">
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
          </CardContent>
        </Card>

        {/* Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Lesson Notes</h2>
            {isTeacher && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNote}
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
                Add Note
              </Button>
            )}
          </div>

          {lesson.notes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {isTeacher
                    ? "No notes yet. Create your first note for this lesson."
                    : "No notes available from your teacher yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {lesson.notes.map((note: any) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {note.noteTitle ? (
                          <CardTitle className="text-xl mb-2">
                            {note.noteTitle}
                          </CardTitle>
                        ) : (
                          <CardTitle className="text-xl mb-2 text-muted-foreground">
                            Untitled Note
                          </CardTitle>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {note.updatedAt && new Date(note.updatedAt).getTime() !== new Date(note.createdAt).getTime() && (
                            <span className="ml-2">(Updated {new Date(note.updatedAt).toLocaleDateString()})</span>
                          )}
                        </p>
                      </div>
                      {isTeacher && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditNote(note)}
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingNotes.has(note.id)}
                                className="flex items-center gap-2 text-destructive hover:text-destructive"
                              >
                                <Image
                                  src="/svg/delete_button.svg"
                                  alt="Delete"
                                  width={16}
                                  height={16}
                                  className="w-4 h-4"
                                  unoptimized={shouldUnoptimizeImages()}
                                />
                                {deletingNotes.has(note.id) ? "Deleting..." : "Delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this note? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Note
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {note.notes}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {noteDialogOpen && (
        <NoteDialog
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          lesson={lessonForDialog}
          note={selectedNote}
          isEditing={isEditing}
          onSave={handleNoteSaved}
        />
      )}
    </>
  );
}
