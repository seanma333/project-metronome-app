"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getCalendarEvents } from "@/app/actions/get-calendar-events";
import { Calendar as CalendarIcon, MapPin, Clock, FileText, Mail, User, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { formatTimezone } from "@/lib/timezone-utils";
import { getLessonParticipants } from "@/app/actions/get-lesson-participants";

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

interface CalendarEvent {
  id: string;
  uid: string;
  summary: string;
  description: string | null;
  location: string | null;
  dtStart: string | Date; // Can be ISO string (from server) or Date object
  dtEnd: string | Date; // Can be ISO string (from server) or Date object
  allDay: boolean;
  timezone: string | null;
  rrule: string | null;
  exdates: any;
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  eventType: "LESSON" | "AVAILABILITY" | "PERSONAL" | "OTHER";
  priority: number | null;
  organizerId: string;
  lessonId: string | null;
  timeslotId: string | null;
  sequence: number;
  lastModified: string | Date;
  created: string | Date;
}

interface CalendarContentProps {
  user: User;
}

// Custom event component for styling
const EventComponent = ({ event }: { event: any }) => {
  const getEventColor = () => {
    switch (event.resource?.eventType) {
      case "LESSON":
        // Use burnt orange color (primary color)
        return "bg-primary";
      case "AVAILABILITY":
        return "bg-green-500";
      case "PERSONAL":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className={`${getEventColor()} text-white p-1 rounded text-xs`}>
      <div className="font-semibold truncate">{event.title}</div>
      {event.resource?.location && (
        <div className="text-xs opacity-90 truncate">{event.resource.location}</div>
      )}
    </div>
  );
};

export default function CalendarContent({ user }: CalendarContentProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [participants, setParticipants] = useState<any | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Configure date-fns localizer
  const locales = {
    "en-US": enUS,
  };

  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getCalendarEvents();

        if (result.error) {
          setError(result.error);
        } else {
          // Transform database events to react-big-calendar format
          const transformedEvents = (result.events || []).map((event: CalendarEvent) => {
            // Ensure dates are properly parsed - handle both string and Date objects
            const startDate = typeof event.dtStart === 'string' 
              ? new Date(event.dtStart) 
              : event.dtStart;
            const endDate = typeof event.dtEnd === 'string' 
              ? new Date(event.dtEnd) 
              : event.dtEnd;
            
            return {
              id: event.id,
              title: event.summary,
              start: startDate,
              end: endDate,
              allDay: event.allDay,
              resource: {
                ...event,
                description: event.description,
                location: event.location,
              },
            };
          });

          setEvents(transformedEvents);
        }
      } catch (err) {
        console.error("Error fetching calendar events:", err);
        setError("Failed to load calendar events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const { defaultDate, scrollToTime } = useMemo(
    () => ({
      defaultDate: new Date(),
      scrollToTime: new Date(1970, 1, 1, 8),
    }),
    []
  );

  // Custom event style getter
  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#3174ad";
    let borderColor = "#3174ad";

    switch (event.resource?.eventType) {
      case "LESSON":
        // Use burnt orange color (primary color)
        backgroundColor = "var(--primary)";
        borderColor = "oklch(0.50 0.15 40)"; // Slightly darker for border
        break;
      case "AVAILABILITY":
        backgroundColor = "#10b981";
        borderColor = "#059669";
        break;
      case "PERSONAL":
        backgroundColor = "#a855f7";
        borderColor = "#9333ea";
        break;
      default:
        backgroundColor = "#6b7280";
        borderColor = "#4b5563";
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: "2px",
        borderRadius: "4px",
        opacity: event.resource?.status === "CANCELLED" ? 0.5 : 1,
        color: "white",
        padding: "2px 4px",
      },
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lesson Calendar</h2>
          <p className="text-sm text-muted-foreground">
            {events.length} {events.length === 1 ? "event" : "events"} scheduled
          </p>
        </div>
      </div>

      <div style={{ height: "600px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultDate={defaultDate}
          defaultView="week"
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          scrollToTime={scrollToTime}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
          }}
          onSelectEvent={async (event) => {
            setSelectedEvent(event);
            setIsDialogOpen(true);
            
            // Fetch lesson participants if this is a lesson event
            if (event.resource?.lessonId && event.resource?.eventType === "LESSON") {
              setLoadingParticipants(true);
              try {
                const result = await getLessonParticipants(event.resource.lessonId);
                if (result.error) {
                  console.error("Error fetching participants:", result.error);
                  setParticipants(null);
                } else {
                  setParticipants(result);
                }
              } catch (error) {
                console.error("Error fetching participants:", error);
                setParticipants(null);
              } finally {
                setLoadingParticipants(false);
              }
            } else {
              setParticipants(null);
            }
          }}
          style={{ height: "100%" }}
          className="calendar-container"
        />
      </div>

      {/* Event Details Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // Reset participants when dialog closes
            setParticipants(null);
            setSelectedEvent(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedEvent?.title || "Event Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.resource?.eventType && (
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-muted text-muted-foreground capitalize">
                  {selectedEvent.resource.eventType.toLowerCase()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 mt-4">
              {/* Date and Time */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Date & Time
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.allDay ? (
                      format(new Date(selectedEvent.start), "EEEE, MMMM d, yyyy")
                    ) : (
                      <>
                        {format(new Date(selectedEvent.start), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                        {" - "}
                        {format(new Date(selectedEvent.end), "h:mm a")}
                      </>
                    )}
                  </p>
                  {selectedEvent.resource?.timezone && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Timezone: {formatTimezone(selectedEvent.resource.timezone)}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              {selectedEvent.resource?.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Location
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.resource.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.resource?.description && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedEvent.resource.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Recurrence Info */}
              {selectedEvent.resource?.rrule && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Recurrence
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This is a recurring event
                  </p>
                </div>
              )}

              {/* Status */}
              {selectedEvent.resource?.status && (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      selectedEvent.resource.status === "CONFIRMED"
                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                        : selectedEvent.resource.status === "TENTATIVE"
                        ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                        : "bg-red-500/20 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {selectedEvent.resource.status}
                  </span>
                </div>
              )}

              {/* Lesson Participants - Only show for LESSON events */}
              {selectedEvent.resource?.eventType === "LESSON" && (
                <div className="pt-2 border-t border-border">
                  {loadingParticipants ? (
                    <p className="text-sm text-muted-foreground">Loading participant information...</p>
                  ) : participants ? (
                    <>
                      {user.role === "TEACHER" && (
                        <>
                          <div className="flex items-start gap-3 mb-3">
                            <User className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground mb-1">
                                Student
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {participants.student.fullName}
                              </p>
                            </div>
                          </div>
                          {participants.emailRecipient?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={`mailto:${participants.emailRecipient.email}`}
                                className="text-sm text-primary hover:underline"
                              >
                                Email {participants.emailRecipient.name}
                              </a>
                            </div>
                          )}
                        </>
                      )}
                      {(user.role === "STUDENT" || user.role === "PARENT") && (
                        <>
                          <div className="flex items-start gap-3 mb-3">
                            <User className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground mb-1">
                                Teacher
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {participants.teacher.fullName}
                              </p>
                            </div>
                          </div>
                          {participants.teacher.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a
                                href={`mailto:${participants.teacher.email}`}
                                className="text-sm text-primary hover:underline"
                              >
                                Email {participants.teacher.fullName}
                              </a>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Unable to load participant information</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons - Only for lesson events */}
          {selectedEvent?.resource?.eventType === "LESSON" && selectedEvent?.resource?.lessonId && (
            <DialogFooter className="mt-6">
              <div className="flex gap-2 w-full sm:w-auto">
                {user.role === "TEACHER" && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      // TODO: Implement cancel event functionality
                      console.log("Cancel event clicked");
                    }}
                  >
                    Cancel this Event
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  asChild
                >
                  <Link href={`/lessons/${selectedEvent.resource.lessonId}`} className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Go to Lesson
                  </Link>
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary"></div>
          <span className="text-muted-foreground">Lesson</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-muted-foreground">Availability</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500"></div>
          <span className="text-muted-foreground">Personal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-500"></div>
          <span className="text-muted-foreground">Other</span>
        </div>
      </div>
    </div>
  );
}

