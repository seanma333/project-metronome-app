"use client";

import { useEffect, useState } from "react";
import { getStudentBookingRequests, getTeacherBookingRequests } from "@/app/actions/get-booking-requests";
import StudentParentBookingRequests from "./StudentParentBookingRequests";
import TeacherBookingRequests from "./TeacherBookingRequests";

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

interface BookingRequestsContentProps {
  user: User;
}

export default function BookingRequestsContent({ user }: BookingRequestsContentProps) {
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookingRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (user.role === "TEACHER") {
          result = await getTeacherBookingRequests();
        } else {
          result = await getStudentBookingRequests();
        }

        if (result.error) {
          setError(result.error);
        } else {
          setBookingRequests(result.bookingRequests || []);
        }
      } catch (err) {
        console.error("Error fetching booking requests:", err);
        setError("Failed to load booking requests");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingRequests();
  }, [user.role]);

  const handleStatusUpdate = (requestId: string, newStatus: string) => {
    setBookingRequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? { ...request, bookingStatus: newStatus }
          : request
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
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

  if (user.role === "TEACHER") {
    return (
      <TeacherBookingRequests
        bookingRequests={bookingRequests}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  } else {
    return (
      <StudentParentBookingRequests
        bookingRequests={bookingRequests}
        userRole={user.role}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  }
}
