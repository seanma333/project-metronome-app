"use client";

import { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { updateTeacherTimeslot } from "@/app/actions/update-teacher-timeslot";
import { deleteTeacherTimeslot } from "@/app/actions/delete-teacher-timeslot";
import { createTeacherTimeslot } from "@/app/actions/create-teacher-timeslot";
import { updateTeachingFormat } from "@/app/actions/update-teacher-preferences";
import { getLessonByTimeslot } from "@/app/actions/get-lesson-by-timeslot";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

interface Timeslot {
  id: string;
  teacherId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Format: "HH:MM:SS"
  endTime: string; // Format: "HH:MM:SS"
  isBooked: boolean;
  studentId: string | null;
  teachingFormat: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeslotsGridProps {
  timeslots: Timeslot[];
  defaultTeachingFormat?: "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE";
}

const DAYS_OF_WEEK = [
  { label: "Sunday", short: "Sun", value: 0 },
  { label: "Monday", short: "Mon", value: 1 },
  { label: "Tuesday", short: "Tue", value: 2 },
  { label: "Wednesday", short: "Wed", value: 3 },
  { label: "Thursday", short: "Thu", value: 4 },
  { label: "Friday", short: "Fri", value: 5 },
  { label: "Saturday", short: "Sat", value: 6 },
];

// Generate time slots in 15-minute increments from 8am to 9pm (8:00 to 21:00)
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 8; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Convert time string (HH:MM:SS or HH:MM) to minutes since midnight
const timeToMinutes = (timeString: string): number => {
  const parts = timeString.split(":").map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
};

// Convert minutes to time string (HH:MM:SS)
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
};

// Convert 24-hour time string (HH:MM or HH:MM:SS) to AM/PM format
const formatTimeAMPM = (timeString: string): string => {
  const parts = timeString.split(":");
  const hours24 = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";

  if (hours24 === 0) {
    return `12:${minutes} AM`;
  } else if (hours24 === 12) {
    return `12:${minutes} PM`;
  } else if (hours24 < 12) {
    return `${hours24}:${minutes} AM`;
  } else {
    return `${hours24 - 12}:${minutes} PM`;
  }
};

// Convert teaching format enum to display string
const formatTeachingFormat = (format: string): string => {
  switch (format) {
    case "ONLINE_ONLY":
      return "Online";
    case "IN_PERSON_ONLY":
      return "In-Person";
    case "IN_PERSON_AND_ONLINE":
      return "Online or In-Person";
    default:
      return "Online or In-Person";
  }
};

// Snap minutes to nearest 15-minute increment
const snapToGrid = (minutes: number): number => {
  return Math.round(minutes / 15) * 15;
};

// Grid constants
const GRID_START_MINUTES = 8 * 60; // 8am
const GRID_END_MINUTES = 21 * 60; // 9pm
const TOTAL_GRID_MINUTES = GRID_END_MINUTES - GRID_START_MINUTES; // 13 hours
const SLOT_HEIGHT_PX = 30; // Each 15-minute slot is 30px high
const SLOTS_PER_HOUR = 4; // 4 slots per hour (15 min each)
const MIN_SLOT_DURATION = 15; // Minimum 15 minutes


export default function TimeslotsGrid({ timeslots: initialTimeslots, defaultTeachingFormat = "ONLINE_ONLY" }: TimeslotsGridProps) {
  // Local state for managing timeslots
  const [timeslots, setTimeslots] = useState<Timeslot[]>(initialTimeslots);
  const [gridReady, setGridReady] = useState(false);
  const [savingTimeslotId, setSavingTimeslotId] = useState<string | null>(null);
  const [hoveredTimeslotId, setHoveredTimeslotId] = useState<string | null>(null);
  const [hoveredGridCell, setHoveredGridCell] = useState<{ day: number; timeSlot: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTimeslot, setEditingTimeslot] = useState<Timeslot | null>(null);
  const [editTeachingFormat, setEditTeachingFormat] = useState<"IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE" | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingLesson, setViewingLesson] = useState<{
    lessonId: string;
    student: { firstName: string | null; lastName: string | null; imageUrl: string | null };
    instrument: { name: string; imagePath: string };
    lessonFormat: string;
  } | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Keep track of teacher's preferred teaching format
  const [teachingFormat, setTeachingFormat] = useState<"IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE">(defaultTeachingFormat);

  // Generate all time slots in 15-minute increments
  const allTimeSlots = TIME_SLOTS;

  // Calculate total grid height in pixels
  const totalGridHeight = (TOTAL_GRID_MINUTES / 15) * SLOT_HEIGHT_PX;

  // Wait for grid to be ready before calculating positions
  useEffect(() => {
    if (!gridContainerRef.current) return;

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const checkGridReady = () => {
      const gridElement = gridContainerRef.current?.querySelector('.grid-cols-8') as HTMLElement;
      if (gridElement && gridElement.getBoundingClientRect().width > 0) {
        setGridReady(true);
      } else {
        requestAnimationFrame(checkGridReady);
      }
    };

    requestAnimationFrame(checkGridReady);

    // Also listen for window resize to recalculate if needed
    const handleResize = () => {
      // Force re-render to recalculate positions
      setGridReady(false);
      requestAnimationFrame(() => {
        setGridReady(true);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert time position to Y pixel position
  const timeToY = (timeMinutes: number): number => {
    const relativeMinutes = timeMinutes - GRID_START_MINUTES;
    return (relativeMinutes / 15) * SLOT_HEIGHT_PX;
  };

  // Convert Y pixel position to time minutes
  const yToTime = (y: number): number => {
    const slotIndex = Math.round(y / SLOT_HEIGHT_PX);
    return GRID_START_MINUTES + slotIndex * 15;
  };

  // Helper to get day column width
  const getDayColumnWidth = (): number => {
    if (!gridContainerRef.current) return 100;
    const gridElement = gridContainerRef.current.querySelector('.grid-cols-8') as HTMLElement;
    if (!gridElement) return 100;
    const gridRect = gridElement.getBoundingClientRect();
    return gridRect.width / 8; // 8 columns total (1 time + 7 days)
  };

  // Convert day of week to X pixel position (relative to grid container)
  const dayToX = (dayOfWeek: number): number => {
    const dayColumnWidth = getDayColumnWidth();
    // X position is (day index + 1) * day column width to skip the time column (first column)
    return (dayOfWeek + 1) * dayColumnWidth;
  };

  // Convert X pixel position to day of week
  const xToDay = (x: number): number => {
    const dayColumnWidth = getDayColumnWidth();
    // Subtract one column width to account for the time column, then divide
    const adjustedX = x - dayColumnWidth;
    const dayIndex = Math.round(adjustedX / dayColumnWidth);
    return Math.max(0, Math.min(6, dayIndex)); // Clamp to 0-6
  };

  // Check if two timeslots overlap (same day and time ranges intersect)
  const timeslotsOverlap = (
    day1: number,
    start1: number,
    end1: number,
    day2: number,
    start2: number,
    end2: number
  ): boolean => {
    // Must be on the same day
    if (day1 !== day2) return false;
    // Time ranges intersect if: start1 < end2 AND end1 > start2
    return start1 < end2 && end1 > start2;
  };

  // Check if a timeslot would overlap with any other timeslot (excluding itself)
  const wouldOverlap = (
    timeslotId: string,
    dayOfWeek: number,
    startMinutes: number,
    endMinutes: number,
    allTimeslots: Timeslot[]
  ): boolean => {
    return allTimeslots.some((slot) => {
      if (slot.id === timeslotId) return false; // Skip self
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      return timeslotsOverlap(dayOfWeek, startMinutes, endMinutes, slot.dayOfWeek, slotStart, slotEnd);
    });
  };

  // Handle drag stop
  const handleDragStop = async (timeslotId: string, position: { x: number; y: number }) => {
    const dayColumnWidth = getDayColumnWidth();
    // Prevent dragging into the time column (first column)
    if (position.x < dayColumnWidth) {
      // If dragged into time column, snap back to the first day column
      position.x = dayColumnWidth;
    }

    const newDay = xToDay(position.x);
    // Ensure day is valid (0-6)
    const validDay = Math.max(0, Math.min(6, newDay));

    const newStartMinutes = snapToGrid(yToTime(position.y));
    const newStartMinutesClamped = Math.max(
      GRID_START_MINUTES,
      Math.min(GRID_END_MINUTES - MIN_SLOT_DURATION, newStartMinutes)
    );

    // Get the current timeslot to preserve duration
    const currentSlot = timeslots.find((slot) => slot.id === timeslotId);
    if (!currentSlot) return;

    const duration = timeToMinutes(currentSlot.endTime) - timeToMinutes(currentSlot.startTime);
    const newEndMinutes = Math.min(
      GRID_END_MINUTES,
      newStartMinutesClamped + duration
    );

    // Check if the new position would overlap with any other timeslot
    if (wouldOverlap(timeslotId, validDay, newStartMinutesClamped, newEndMinutes, timeslots)) {
      // Don't update if there would be an overlap
      return;
    }

    // Update local state optimistically
    const newStartTime = minutesToTime(newStartMinutesClamped);
    const newEndTime = minutesToTime(newEndMinutes);

    setTimeslots((prev) =>
      prev.map((slot) => {
        if (slot.id === timeslotId) {
          return {
            ...slot,
            dayOfWeek: validDay,
            startTime: newStartTime,
            endTime: newEndTime,
          };
        }
        return slot;
      })
    );

    // Save to backend
    setSavingTimeslotId(timeslotId);
    const result = await updateTeacherTimeslot({
      timeslotId,
      dayOfWeek: validDay,
      startTime: newStartTime,
      endTime: newEndTime,
    });

    setSavingTimeslotId(null);

    if (result.error) {
      // Revert on error
      setTimeslots((prev) =>
        prev.map((slot) => {
          if (slot.id === timeslotId) {
            return currentSlot; // Revert to original
          }
          return slot;
        })
      );
      console.error("Failed to save timeslot:", result.error);
    }
  };

  // Handle resize stop
  const handleResizeStop = async (
    timeslotId: string,
    size: { width: number; height: number },
    position: { x: number; y: number }
  ) => {
    const newStartMinutes = snapToGrid(yToTime(position.y));
    const newEndMinutes = snapToGrid(yToTime(position.y + size.height));

    const newStartMinutesClamped = Math.max(GRID_START_MINUTES, newStartMinutes);
    const newEndMinutesClamped = Math.min(GRID_END_MINUTES, newEndMinutes);
    const duration = newEndMinutesClamped - newStartMinutesClamped;

    // Ensure minimum duration
    if (duration < MIN_SLOT_DURATION) {
      return;
    }

    // Get the current timeslot to preserve day of week
    const currentSlot = timeslots.find((slot) => slot.id === timeslotId);
    if (!currentSlot) return;

    // Check if the new size/position would overlap with any other timeslot
    if (wouldOverlap(
      timeslotId,
      currentSlot.dayOfWeek,
      newStartMinutesClamped,
      newEndMinutesClamped,
      timeslots
    )) {
      // Don't update if there would be an overlap
      return;
    }

    // Update local state optimistically
    const newStartTime = minutesToTime(newStartMinutesClamped);
    const newEndTime = minutesToTime(newEndMinutesClamped);

    setTimeslots((prev) =>
      prev.map((slot) => {
        if (slot.id === timeslotId) {
          return {
            ...slot,
            startTime: newStartTime,
            endTime: newEndTime,
          };
        }
        return slot;
      })
    );

    // Save to backend
    setSavingTimeslotId(timeslotId);
    const result = await updateTeacherTimeslot({
      timeslotId,
      dayOfWeek: currentSlot.dayOfWeek,
      startTime: newStartTime,
      endTime: newEndTime,
    });

    setSavingTimeslotId(null);

    if (result.error) {
      // Revert on error
      setTimeslots((prev) =>
        prev.map((slot) => {
          if (slot.id === timeslotId) {
            return currentSlot; // Revert to original
          }
          return slot;
        })
      );
      console.error("Failed to save timeslot:", result.error);
    }
  };

  // Handle view lesson
  const handleViewLesson = async (timeslotId: string) => {
    setLoadingLesson(true);
    setViewDialogOpen(true);
    
    const result = await getLessonByTimeslot(timeslotId);
    
    if (result.error || !result.lesson) {
      console.error("Failed to fetch lesson:", result.error);
      setViewDialogOpen(false);
    } else {
      setViewingLesson({
        lessonId: result.lesson.lesson.id,
        student: result.lesson.student,
        instrument: result.lesson.instrument,
        lessonFormat: result.lesson.lesson.lessonFormat,
      });
    }
    
    setLoadingLesson(false);
  };

  // Handle delete timeslot
  const handleDeleteTimeslot = async (timeslotId: string) => {
    // Optimistically remove from UI
    const deletedTimeslot = timeslots.find((slot) => slot.id === timeslotId);
    setTimeslots((prev) => prev.filter((slot) => slot.id !== timeslotId));
    setEditDialogOpen(false);
    setEditingTimeslot(null);
    setHoveredTimeslotId(null);

    // Persist deletion to backend
    const result = await deleteTeacherTimeslot(timeslotId);

    if (result.error) {
      // Revert on error - add the timeslot back
      if (deletedTimeslot) {
        setTimeslots((prev) => [...prev, deletedTimeslot].sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) {
            return a.dayOfWeek - b.dayOfWeek;
          }
          return a.startTime.localeCompare(b.startTime);
        }));
      }
      console.error("Failed to delete timeslot:", result.error);
    }
  };

  // Group timeslots by day of week for rendering
  const timeslotsByDay: Record<number, Timeslot[]> = {};
  DAYS_OF_WEEK.forEach((day) => {
    timeslotsByDay[day.value] = [];
  });

  timeslots.forEach((timeslot) => {
    if (timeslotsByDay[timeslot.dayOfWeek]) {
      timeslotsByDay[timeslot.dayOfWeek].push(timeslot);
    }
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px] bg-background border border-border rounded-lg">
        {/* Header with day labels */}
        <div className="grid grid-cols-8 border-b border-border sticky top-0 bg-background z-10">
          <div className="p-3 font-semibold text-sm text-muted-foreground border-r border-border">
            Time
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.value}
              className="p-3 font-semibold text-sm text-center border-r border-border last:border-r-0"
            >
              <div className="hidden sm:block">{day.label}</div>
              <div className="sm:hidden">{day.short}</div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative" ref={gridContainerRef}>
          {/* Grid container */}
          <div className="grid grid-cols-8">
            {/* Time column */}
            <div className="border-r border-border">
              {allTimeSlots.map((timeSlot, index) => {
                // Only show hour labels for :00 minutes
                const [hours, minutes] = timeSlot.split(":").map(Number);
                const showLabel = minutes === 0;

                return (
                  <div
                    key={timeSlot}
                    className={cn(
                      showLabel ? "border-t border-border" : "border-t border-border/30"
                    )}
                    style={{ height: `${SLOT_HEIGHT_PX}px` }}
                  >
                    {showLabel && (
                      <div className="p-1 text-xs text-muted-foreground font-medium">
                        {formatTimeAMPM(timeSlot)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.value}
                className="border-r border-border last:border-r-0 relative"
                data-day-column={day.value}
              >
                {/* Background grid cells */}
                {allTimeSlots.map((timeSlot) => {
                  const [hours, minutes] = timeSlot.split(":").map(Number);
                  const showBorder = minutes === 0;
                  const isHovered = hoveredGridCell?.day === day.value && hoveredGridCell?.timeSlot === timeSlot;

                  // Check if there's a timeslot at this position
                  const hasTimeslot = timeslots.some((slot) => {
                    if (slot.dayOfWeek !== day.value) return false;
                    const slotStartMinutes = timeToMinutes(slot.startTime);
                    const slotEndMinutes = timeToMinutes(slot.endTime);
                    const cellMinutes = timeToMinutes(timeSlot + ":00");
                    return cellMinutes >= slotStartMinutes && cellMinutes < slotEndMinutes;
                  });

                  return (
                    <div
                      key={timeSlot}
                      className={cn(
                        "relative",
                        showBorder ? "border-t border-border" : "border-t border-border/30"
                      )}
                      style={{ height: `${SLOT_HEIGHT_PX}px` }}
                      onMouseEnter={() => {
                        if (!hasTimeslot) {
                          setHoveredGridCell({ day: day.value, timeSlot });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredGridCell(null);
                      }}
                    >
                      {/* Add button - appears on hover over empty cells */}
                      {isHovered && !hasTimeslot && (
                        <button
                          className="absolute top-1 right-1 z-30 p-1 rounded bg-background border border-border shadow-sm hover:bg-primary/10 hover:border-primary transition-colors group"
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Calculate the start time from the time slot
                            const [hours, minutes] = timeSlot.split(":").map(Number);
                            const startTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
                            // Create 15-minute timeslot
                            const endHours = minutes + 15 >= 60 ? hours + 1 : hours;
                            const endMinutes = (minutes + 15) % 60;
                            const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}:00`;

                            // Check if this would overlap with any existing timeslot
                            const startMinutes = timeToMinutes(startTime);
                            const endMinutesValue = timeToMinutes(endTime);
                            if (wouldOverlap("", day.value, startMinutes, endMinutesValue, timeslots)) {
                              console.error("Cannot create timeslot: would overlap with existing timeslot");
                              return;
                            }

                            // Create timeslot in backend
                            const result = await createTeacherTimeslot({
                              dayOfWeek: day.value,
                              startTime,
                              endTime,
                              teachingFormat,
                            });

                            if (result.error) {
                              console.error("Failed to create timeslot:", result.error);
                            } else if (result.timeslot) {
                              // Add to local state after successful creation
                              const newTimeslot: Timeslot = {
                                ...result.timeslot,
                                createdAt: result.timeslot.createdAt || new Date(),
                                updatedAt: result.timeslot.updatedAt || new Date(),
                              };
                              setTimeslots((prev) =>
                                [...prev, newTimeslot].sort((a, b) => {
                                  if (a.dayOfWeek !== b.dayOfWeek) {
                                    return a.dayOfWeek - b.dayOfWeek;
                                  }
                                  return a.startTime.localeCompare(b.startTime);
                                })
                              );
                              setHoveredGridCell(null);
                            }
                          }}
                        >
                          <Image
                            src="/svg/add_button.svg"
                            alt="Add"
                            width={16}
                            height={16}
                            className="group-hover:brightness-0 group-hover:saturate-100 group-hover:invert-[0.35] group-hover:sepia-[1] group-hover:hue-rotate-[320deg] transition-all"
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Timeslot events - rendered outside day columns for proper positioning */}
          {gridReady && timeslots.map((timeslot) => {
            const startMinutes = timeToMinutes(timeslot.startTime);
            const endMinutes = timeToMinutes(timeslot.endTime);
            const duration = endMinutes - startMinutes;
            const dayColumnWidth = getDayColumnWidth();
            const x = dayToX(timeslot.dayOfWeek);
            const y = timeToY(startMinutes);
            const width = dayColumnWidth - 8; // Account for padding
            const height = (duration / 15) * SLOT_HEIGHT_PX;

            if (timeslot.isBooked) {
              // Render booked timeslots as static elements (not draggable/resizable)
              const isBookedHovered = hoveredTimeslotId === timeslot.id;
              
              return (
                <div
                  key={timeslot.id}
                  className={cn(
                    "absolute rounded px-1.5 py-0.5 text-xs",
                    "flex flex-col justify-center",
                    "bg-green-500/20 border border-green-500/40 text-green-700 dark:text-green-400"
                  )}
                  style={{
                    left: `${x + 4}px`,
                    width: `${width}px`,
                    top: `${y}px`,
                    height: `${Math.max(height, 24)}px`,
                    minHeight: "24px",
                    zIndex: isBookedHovered ? 25 : 10,
                  }}
                  onMouseEnter={() => {
                    setHoveredTimeslotId(timeslot.id);
                    setHoveredGridCell(null);
                  }}
                  onMouseLeave={() => {
                    setHoveredTimeslotId(null);
                  }}
                >
                  {/* View button - appears on hover */}
                  {isBookedHovered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewLesson(timeslot.id);
                      }}
                      className="absolute top-1 right-1 z-30 p-1 rounded bg-background border border-border shadow-sm hover:bg-primary/10 hover:border-primary transition-colors group"
                    >
                      <Image
                        src="/svg/view_button.svg"
                        alt="View"
                        width={16}
                        height={16}
                        className="group-hover:brightness-0 group-hover:saturate-100 group-hover:invert-[0.35] group-hover:sepia-[1] group-hover:hue-rotate-[320deg] transition-all"
                      />
                    </button>
                  )}
                  
                  <div className="font-medium text-[11px] leading-tight pointer-events-none">
                    {formatTimeAMPM(timeslot.startTime)} - {formatTimeAMPM(timeslot.endTime)}
                  </div>
                  <div className="text-[9px] opacity-75 leading-tight pointer-events-none">
                    Booked · {formatTeachingFormat(timeslot.teachingFormat)}
                  </div>
                </div>
              );
            }

            // Render draggable/resizable timeslots
            const timeColumnWidth = dayColumnWidth;
            const isHovered = hoveredTimeslotId === timeslot.id;

            return (
              <Rnd
                key={timeslot.id}
                size={{ width, height: Math.max(height, (MIN_SLOT_DURATION / 15) * SLOT_HEIGHT_PX) }}
                position={{ x: x + 4, y }}
                bounds={gridContainerRef.current || undefined}
                dragGrid={[dayColumnWidth, SLOT_HEIGHT_PX]}
                resizeGrid={[1, SLOT_HEIGHT_PX]}
                minWidth={width}
                minHeight={(MIN_SLOT_DURATION / 15) * SLOT_HEIGHT_PX}
                maxHeight={totalGridHeight}
                enableResizing={{
                  top: true,
                  right: false,
                  bottom: true,
                  left: false,
                  topRight: false,
                  bottomRight: false,
                  bottomLeft: false,
                  topLeft: false,
                }}
                disableDragging={false}
                onDragStop={(e, d) => {
                  // Ensure position is constrained before handling stop (prevent moving into time column)
                  const constrainedX = Math.max(timeColumnWidth, d.x);
                  handleDragStop(timeslot.id, { x: constrainedX, y: d.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  handleResizeStop(timeslot.id, {
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  }, position);
                }}
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs",
                  "flex flex-col justify-center relative",
                  "bg-primary/20 border border-primary/40 text-primary",
                  "cursor-move",
                  savingTimeslotId === timeslot.id && "opacity-75"
                )}
                style={{
                  zIndex: hoveredTimeslotId === timeslot.id ? 25 : 20,
                }}
                onMouseEnter={() => {
                  setHoveredTimeslotId(timeslot.id);
                  setHoveredGridCell(null); // Clear grid hover when hovering over timeslot
                }}
                onMouseLeave={() => {
                  setHoveredTimeslotId(null);
                }}
              >
                {/* Edit button - appears on hover */}
                {isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTimeslot(timeslot);
                      setEditTeachingFormat(timeslot.teachingFormat as "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE");
                      setEditDialogOpen(true);
                    }}
                    className="absolute top-1 right-1 z-30 p-1 rounded bg-background border border-border shadow-sm hover:bg-primary/10 hover:border-primary transition-colors group"
                  >
                    <Image
                      src="/svg/edit_button.svg"
                      alt="Edit"
                      width={16}
                      height={16}
                      className="group-hover:brightness-0 group-hover:saturate-100 group-hover:invert-[0.35] group-hover:sepia-[1] group-hover:hue-rotate-[320deg] transition-all"
                    />
                  </button>
                )}

                <div className="font-medium text-[11px] leading-tight pointer-events-none">
                  {formatTimeAMPM(timeslot.startTime)} - {formatTimeAMPM(timeslot.endTime)}
                </div>
                <div className="text-[9px] opacity-75 leading-tight pointer-events-none">
                  Available · {formatTeachingFormat(timeslot.teachingFormat)}
                </div>
              </Rnd>
            );
          })}
        </div>
      </div>

      {/* Edit/Delete Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Timeslot</DialogTitle>
            <DialogDescription>
              {editingTimeslot && (
                <span>
                  {DAYS_OF_WEEK.find(d => d.value === editingTimeslot.dayOfWeek)?.label}, {formatTimeAMPM(editingTimeslot.startTime)} - {formatTimeAMPM(editingTimeslot.endTime)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {editingTimeslot && editTeachingFormat && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Teaching Format
                </h3>
                <RadioGroup
                  value={editTeachingFormat}
                  onValueChange={(value) => setEditTeachingFormat(value as "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE")}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="ONLINE_ONLY" id="edit-online" />
                    <Label htmlFor="edit-online" className="font-normal cursor-pointer text-sm">
                      Online
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="IN_PERSON_ONLY" id="edit-inperson" />
                    <Label htmlFor="edit-inperson" className="font-normal cursor-pointer text-sm">
                      In-Person
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IN_PERSON_AND_ONLINE" id="edit-both" />
                    <Label htmlFor="edit-both" className="font-normal cursor-pointer text-sm">
                      Online or In-Person
                    </Label>
                  </div>
                </RadioGroup>
                {(teachingFormat === "ONLINE_ONLY" || teachingFormat === "IN_PERSON_ONLY") &&
                  editTeachingFormat !== teachingFormat &&
                  (editTeachingFormat === "IN_PERSON_AND_ONLINE" ||
                   (teachingFormat === "ONLINE_ONLY" && editTeachingFormat === "IN_PERSON_ONLY") ||
                   (teachingFormat === "IN_PERSON_ONLY" && editTeachingFormat === "ONLINE_ONLY")) && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-700 dark:text-yellow-400">
                      This will also change your preferred teaching format to allow for both, which will have you be searchable by students for both online and in-person lessons.
                    </div>
                  )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Delete Timeslot
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Remove this timeslot from your schedule. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (editingTimeslot) {
                      handleDeleteTimeslot(editingTimeslot.id);
                    }
                  }}
                  className="w-full"
                >
                  Delete Timeslot
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingTimeslot(null);
                setEditTeachingFormat(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editingTimeslot || editTeachingFormat === null) return;

                // Check if we need to update teacher's preferred format
                const needsFormatUpdate = (teachingFormat === "ONLINE_ONLY" || teachingFormat === "IN_PERSON_ONLY") &&
                  editTeachingFormat !== teachingFormat &&
                  (editTeachingFormat === "IN_PERSON_AND_ONLINE" ||
                   (teachingFormat === "ONLINE_ONLY" && editTeachingFormat === "IN_PERSON_ONLY") ||
                   (teachingFormat === "IN_PERSON_ONLY" && editTeachingFormat === "ONLINE_ONLY"));

                // Update timeslot
                const result = await updateTeacherTimeslot({
                  timeslotId: editingTimeslot.id,
                  dayOfWeek: editingTimeslot.dayOfWeek,
                  startTime: editingTimeslot.startTime,
                  endTime: editingTimeslot.endTime,
                  teachingFormat: editTeachingFormat,
                });

                if (result.error) {
                  console.error("Failed to update timeslot:", result.error);
                } else {
                  // Update local state
                  setTimeslots((prev) =>
                    prev.map((slot) =>
                      slot.id === editingTimeslot.id
                        ? { ...slot, teachingFormat: editTeachingFormat }
                        : slot
                    )
                  );

                  // Update teacher's preferred format if needed
                  if (needsFormatUpdate) {
                    const formatResult = await updateTeachingFormat("IN_PERSON_AND_ONLINE");
                    if (!formatResult.error) {
                      setTeachingFormat("IN_PERSON_AND_ONLINE");
                    }
                  }

                  setEditDialogOpen(false);
                  setEditingTimeslot(null);
                  setEditTeachingFormat(null);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lesson Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => {
        setViewDialogOpen(open);
        if (!open) {
          setViewingLesson(null);
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Lesson Details</DialogTitle>
            <DialogDescription>
              Information about the booked lesson
            </DialogDescription>
          </DialogHeader>

          {loadingLesson ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading lesson details...</div>
            </div>
          ) : viewingLesson ? (
            <div className="space-y-6">
              {/* Student Information */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Student
                </h3>
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  {viewingLesson.student.imageUrl ? (
                    <Image
                      src={viewingLesson.student.imageUrl}
                      alt={`${viewingLesson.student.firstName || ''} ${viewingLesson.student.lastName || ''}`}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {(viewingLesson.student.firstName?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {viewingLesson.student.firstName} {viewingLesson.student.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instrument Information */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Instrument
                </h3>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">
                    {viewingLesson.instrument.name}
                  </p>
                </div>
              </div>

              {/* Lesson Format */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Lesson Format
                </h3>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-foreground">
                    {viewingLesson.lessonFormat === "ONLINE" ? "Online" : "In-Person"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">No lesson data available</div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewDialogOpen(false);
                setViewingLesson(null);
              }}
            >
              Close
            </Button>
            {viewingLesson && (
              <Button
                onClick={() => {
                  window.location.href = `/lessons/${viewingLesson.lessonId}`;
                }}
              >
                Go to Lesson
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
