"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { createLessonNote, updateLessonNote } from "@/app/actions/manage-lesson-notes";

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

  useEffect(() => {
    if (note && isEditing) {
      setNoteTitle(note.noteTitle || "");
      setNotes(note.notes || "");
    } else {
      // Set default title with current date for new notes
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setNoteTitle(`Lesson Notes - ${currentDate}`);
      setNotes("");
    }
  }, [note, isEditing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let result;
      if (isEditing && note) {
        result = await updateLessonNote(note.id, noteTitle || null, notes);
      } else {
        result = await createLessonNote(lesson.lesson.id, noteTitle || null, notes);
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
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter detailed notes..."
                required
                rows={10}
              />
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
