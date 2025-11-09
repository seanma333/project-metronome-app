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
import { Calendar as CalendarIcon } from "lucide-react";

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
        return "bg-blue-500";
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
  const [currentView, setCurrentView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

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
      scrollToTime: new Date(1970, 1, 1, 6),
    }),
    []
  );

  // Custom event style getter
  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#3174ad";
    let borderColor = "#3174ad";

    switch (event.resource?.eventType) {
      case "LESSON":
        backgroundColor = "#3b82f6";
        borderColor = "#2563eb";
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
          style={{ height: "100%" }}
          className="calendar-container"
        />
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
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

