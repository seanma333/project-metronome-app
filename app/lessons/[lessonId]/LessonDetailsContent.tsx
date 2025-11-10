"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { ArrowLeft, Calendar } from "lucide-react";
import { createLessonNote, updateLessonNote, getLessonNote, deleteLessonNote } from "@/app/actions/manage-lesson-notes";
import { checkLessonCalendarEvent } from "@/app/actions/check-lesson-calendar-event";
import { createLessonCalendarEvent } from "@/app/actions/create-lesson-calendar-event";
import { deleteLesson } from "@/app/actions/delete-lesson";
import { RRule } from "rrule";
import { useRouter } from "next/navigation";
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

interface LessonDetailsContentProps {
  lesson: any;
  user: any;
}

export default function LessonDetailsContent({ lesson, user }: LessonDetailsContentProps) {
  const router = useRouter();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingNotes, setDeletingNotes] = useState<Set<string>>(new Set());
  const [hasCalendarEvent, setHasCalendarEvent] = useState<boolean | null>(null);
  const [calendarEvent, setCalendarEvent] = useState<any>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [checkingEvent, setCheckingEvent] = useState(true);
  const [nextLessonDate, setNextLessonDate] = useState<Date | null>(null);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isTeacher = user.role === "TEACHER" && lesson.teacher.id === user.id;

  // Check if calendar event exists for this lesson and calculate next lesson date
  useEffect(() => {
    const checkEvent = async () => {
      try {
        setCheckingEvent(true);
        const result = await checkLessonCalendarEvent(lesson.lesson.id);
        if (result.error) {
          console.error("Error checking calendar event:", result.error);
          setHasCalendarEvent(null);
          setCalendarEvent(null);
          setNextLessonDate(null);
        } else if (result.exists && result.event) {
          setHasCalendarEvent(true);
          setCalendarEvent(result.event);
          
          // Calculate next lesson date from calendar event
          const eventDtStart = new Date(result.event.dtStart);
          const now = new Date();
          
          if (result.event.rrule) {
            // Parse RRULE and find next occurrence
            try {
              const parsedRule = RRule.fromString(result.event.rrule);
              const rruleOptions = {
                ...parsedRule.options,
                dtstart: eventDtStart,
              };
              const rrule = new RRule(rruleOptions);
              
              // Get next occurrence after now
              const oneYearFromNow = new Date(now);
              oneYearFromNow.setFullYear(now.getFullYear() + 1);
              const occurrences = rrule.between(now, oneYearFromNow, true);
              
              if (occurrences.length > 0) {
                setNextLessonDate(occurrences[0]);
              } else {
                // No future occurrences, use the dtStart if it's in the future
                setNextLessonDate(eventDtStart > now ? eventDtStart : null);
              }
            } catch (error) {
              console.error("Error parsing RRULE:", error);
              // Fallback to dtStart if it's in the future
              setNextLessonDate(eventDtStart > now ? eventDtStart : null);
            }
          } else {
            // Non-recurring event, use dtStart if it's in the future
            setNextLessonDate(eventDtStart > now ? eventDtStart : null);
          }
        } else {
          setHasCalendarEvent(false);
          setCalendarEvent(null);
          // No calendar event, show fallback message
          setNextLessonDate(null);
        }
      } catch (error) {
        console.error("Error checking calendar event:", error);
        setHasCalendarEvent(null);
        setCalendarEvent(null);
        setNextLessonDate(null);
      } finally {
        setCheckingEvent(false);
      }
    };

    checkEvent();
  }, [lesson.lesson.id, lesson.timeslot.dayOfWeek, lesson.timeslot.startTime]);

  const dayName = DAYS_OF_WEEK[lesson.timeslot.dayOfWeek];
  const startTime = formatTime(lesson.timeslot.startTime);
  const endTime = formatTime(lesson.timeslot.endTime);
  const instrumentName = lesson.instrument.name;

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

  const handleCreateCalendarEvent = async () => {
    if (isCreatingEvent) return;

    setIsCreatingEvent(true);
    try {
      const result = await createLessonCalendarEvent(lesson.lesson.id);

      if (result.error) {
        alert(result.error);
      } else {
        // Refresh the page to reload calendar event data
        window.location.reload();
      }
    } catch (error) {
      console.error("Error creating calendar event:", error);
      alert("Failed to create calendar event. Please try again.");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (isDeletingLesson) return;

    setIsDeletingLesson(true);
    try {
      const result = await deleteLesson(lesson.lesson.id);

      if (result.error) {
        alert(result.error);
        setIsDeletingLesson(false);
      } else {
        // Redirect to lessons page after successful deletion
        router.push("/lessons");
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("Failed to delete lesson. Please try again.");
      setIsDeletingLesson(false);
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
          <CardHeader className="relative">
            <div className="flex items-start gap-4">
              {displayImage && (
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={displayImage}
                    alt={displayName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
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
            {/* Delete Lesson Button - Only for teachers */}
            {isTeacher && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-destructive"
                    disabled={isDeletingLesson}
                  >
                    <Image
                      src="/svg/delete_button.svg"
                      alt="Delete lesson"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this lesson? This action will:
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="text-sm text-muted-foreground">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Delete the lesson permanently</li>
                      <li>Delete all notes associated with this lesson</li>
                      <li>Delete all calendar events related to this lesson</li>
                      <li>Free the associated time slot (make it available for booking)</li>
                    </ul>
                    <p className="mt-2 font-medium">This action cannot be undone.</p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingLesson}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteLesson}
                      disabled={isDeletingLesson}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeletingLesson ? "Deleting..." : "Delete Lesson"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkingEvent ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Next Lesson</p>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : hasCalendarEvent && nextLessonDate ? (
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
              ) : hasCalendarEvent && !nextLessonDate ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Next Lesson</p>
                  <p className="text-muted-foreground">No upcoming lessons scheduled</p>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Next Lesson</p>
                  <p className="text-muted-foreground">No calendar event exists for this lesson</p>
                </div>
              )}
              
              {/* Calendar Event Section */}
              {isTeacher && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-sm font-medium">Calendar Event</p>
                    <p className="text-xs text-muted-foreground">
                      {checkingEvent
                        ? "Checking..."
                        : hasCalendarEvent
                        ? "Event added to calendar"
                        : "No calendar event yet"}
                    </p>
                  </div>
                  {!checkingEvent && !hasCalendarEvent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateCalendarEvent}
                      disabled={isCreatingEvent}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      {isCreatingEvent ? "Creating..." : "Add to Calendar"}
                    </Button>
                  )}
                </div>
              )}
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
                    <div 
                      className="text-muted-foreground prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: note.notes }}
                    />
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
