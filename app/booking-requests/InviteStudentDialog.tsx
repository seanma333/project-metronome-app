"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { createInvite } from "@/app/actions/create-invite";
import { getCurrentTeacherTimeslots } from "@/app/actions/get-teacher-timeslots";

interface InviteStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSent?: () => void;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export default function InviteStudentDialog({
  open,
  onOpenChange,
  onInviteSent,
}: InviteStudentDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"PARENT" | "STUDENT" | "">("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTimeslotId, setSelectedTimeslotId] = useState<string>("");
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeslots when dialog opens
  useEffect(() => {
    if (open) {
      const fetchTimeslots = async () => {
        setLoading(true);
        try {
          const data = await getCurrentTeacherTimeslots();
          if (data) {
            setTimeslots(data);
          }
        } catch (err) {
          console.error("Error fetching timeslots:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchTimeslots();
    }
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFullName("");
      setEmail("");
      setRole("");
      setSelectedDay("");
      setSelectedTimeslotId("");
      setError(null);
    }
  }, [open]);

  // Group timeslots by day
  const timeslotsByDay = timeslots.reduce((acc, timeslot) => {
    const day = timeslot.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(timeslot);
    return acc;
  }, {} as Record<number, any[]>);

  // Get available days (days that have timeslots)
  const availableDays = Object.keys(timeslotsByDay)
    .map(Number)
    .sort((a, b) => a - b);

  // Get timeslots for selected day
  const timeslotsForSelectedDay = selectedDay
    ? timeslotsByDay[Number(selectedDay)] || []
    : [];

  // Reset timeslot selection when day changes
  useEffect(() => {
    if (selectedDay) {
      setSelectedTimeslotId("");
    }
  }, [selectedDay]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!role) {
      setError("Please select a role");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createInvite({
        email: email.trim(),
        fullName: fullName.trim(),
        role: role as "PARENT" | "STUDENT",
        timeslotId: selectedTimeslotId || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        // Success - close dialog and notify parent
        onOpenChange(false);
        if (onInviteSent) {
          onInviteSent();
        }
      }
    } catch (err) {
      console.error("Error creating invite:", err);
      setError("Failed to create invite. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = fullName.trim() && email.trim() && role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Student or Parent</DialogTitle>
          <DialogDescription>
            Send an invitation to a student or parent to join your lessons.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-3">
            <Label>
              Role <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as "PARENT" | "STUDENT")}>
              <div className="space-y-1">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="STUDENT" id="role-student" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="role-student" className="font-normal cursor-pointer">
                      Student
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      For teenagers or adults who will manage their own profile and lessons
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="PARENT" id="role-parent" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="role-parent" className="font-normal cursor-pointer">
                      Parent
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      For parents who will manage their children's lessons
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <Label htmlFor="day">Day (Optional)</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger id="day" className="w-full">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.length === 0 ? (
                  <SelectItem value="no-timeslots" disabled>
                    No timeslots available
                  </SelectItem>
                ) : (
                  availableDays.map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {DAYS_OF_WEEK[day]}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          {selectedDay && (
            <div className="space-y-2">
              <Label htmlFor="time">Time (Optional)</Label>
              <Select
                value={selectedTimeslotId}
                onValueChange={setSelectedTimeslotId}
              >
                <SelectTrigger id="time" className="w-full">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeslotsForSelectedDay.length === 0 ? (
                    <SelectItem value="no-times" disabled>
                      No times available for this day
                    </SelectItem>
                  ) : (
                    timeslotsForSelectedDay.map((timeslot: any) => {
                      const startTime = formatTime(timeslot.startTime);
                      const endTime = formatTime(timeslot.endTime);
                      return (
                        <SelectItem key={timeslot.id} value={timeslot.id}>
                          {startTime} - {endTime}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || submitting || loading}>
              {submitting ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

