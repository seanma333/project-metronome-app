"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import Editor, {
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnNumberedList,
  BtnBulletList,
  BtnUndo,
  BtnRedo,
} from "react-simple-wysiwyg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { createLessonNote, updateLessonNote } from "@/app/actions/manage-lesson-notes";
import { getLessonEventOccurrences } from "@/app/actions/get-lesson-event-occurrences";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: any;
  note: any | null;
  isEditing: boolean;
  onSave: () => void;
}

export default function NoteDialog({
  open,
  onOpenChange,
  lesson,
  note,
  isEditing,
  onSave,
}: NoteDialogProps) {
  const [noteTitle, setNoteTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedLessonDate, setSelectedLessonDate] = useState<string>("");
  const [lessonOccurrences, setLessonOccurrences] = useState<Array<{ date: Date; formatted: string }>>([]);
  const [loadingOccurrences, setLoadingOccurrences] = useState(false);

  useEffect(() => {
    if (open && !isEditing) {
      // Fetch lesson occurrences when creating a new note
      const fetchOccurrences = async () => {
        setLoadingOccurrences(true);
        try {
          const result = await getLessonEventOccurrences(lesson.lesson.id);
          if (result.error) {
            console.error("Error fetching lesson occurrences:", result.error);
            setLessonOccurrences([]);
          } else {
            setLessonOccurrences(result.occurrences || []);
          }
        } catch (error) {
          console.error("Error fetching lesson occurrences:", error);
          setLessonOccurrences([]);
        } finally {
          setLoadingOccurrences(false);
        }
      };
      fetchOccurrences();
    }
  }, [open, isEditing, lesson.lesson.id]);

  useEffect(() => {
    if (note && isEditing) {
      setNoteTitle(note.noteTitle || "");
      setNotes(note.notes || "");
      // If note has a lessonDate, set it (though we won't show dropdown for editing)
      if (note.lessonDate) {
        setSelectedLessonDate(new Date(note.lessonDate).toISOString());
      } else {
        setSelectedLessonDate("");
      }
    } else {
      // Reset for new note
      setNotes("");
      setSelectedLessonDate("");
      // Set default title based on whether there are lesson occurrences
      if (lessonOccurrences.length === 0) {
        setNoteTitle("Before the Next Lesson");
      } else {
        setNoteTitle("");
      }
    }
  }, [note, isEditing, open, lessonOccurrences.length]);

  // Update title when lesson date is selected
  useEffect(() => {
    if (selectedLessonDate && !isEditing) {
      const selectedOccurrence = lessonOccurrences.find(
        (occ) => occ.date.toISOString() === selectedLessonDate
      );
      if (selectedOccurrence) {
        // Extract just the date part from the formatted string (before "at")
        const datePart = selectedOccurrence.formatted.split(" at ")[0];
        setNoteTitle(`Lesson notes - ${datePart}`);
      }
    }
  }, [selectedLessonDate, lessonOccurrences, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let result;
      const lessonDate = selectedLessonDate ? new Date(selectedLessonDate) : null;
      
      if (isEditing && note) {
        result = await updateLessonNote(note.id, noteTitle || null, notes, lessonDate);
      } else {
        result = await createLessonNote(lesson.lesson.id, noteTitle || null, notes, lessonDate);
      }

      if (result.error) {
        alert(result.error);
      } else {
        onSave();
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-2xl bg-card border rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {isEditing ? "Edit Note" : "Create New Note"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isEditing && lessonOccurrences.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="lessonDate">Lesson Date</Label>
                <Select
                  value={selectedLessonDate}
                  onValueChange={setSelectedLessonDate}
                  disabled={loadingOccurrences}
                >
                  <SelectTrigger id="lessonDate" className="w-full">
                    <SelectValue placeholder={loadingOccurrences ? "Loading dates..." : "Select a lesson date..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonOccurrences.map((occurrence) => (
                      <SelectItem
                        key={occurrence.date.toISOString()}
                        value={occurrence.date.toISOString()}
                      >
                        {occurrence.formatted}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the date and time of the lesson this note is for
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="noteTitle">Note Title (Optional)</Label>
              <Input
                id="noteTitle"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Enter note title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-destructive">*</span>
              </Label>
              <div className="border border-input rounded-md overflow-hidden">
                <Editor
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  containerProps={{
                    className: "min-h-[250px] p-3",
                  }}
                >
                  <Toolbar>
                    <BtnBold />
                    <BtnItalic />
                    <BtnNumberedList />
                    <BtnBulletList />
                    <BtnUndo />
                    <BtnRedo />
                  </Toolbar>
                </Editor>
              </div>
              {!notes.trim() && (
                <p className="text-xs text-muted-foreground">
                  Please enter some notes
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !notes.trim()}>
                {saving ? "Saving..." : isEditing ? "Update Note" : "Create Note"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
