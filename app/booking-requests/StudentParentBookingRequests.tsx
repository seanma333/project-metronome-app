"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { updateBookingRequestStatus } from "@/app/actions/get-booking-requests";

interface StudentParentBookingRequestsProps {
  bookingRequests: any[];
  userRole: "STUDENT" | "PARENT" | null;
  onStatusUpdate: (requestId: string, newStatus: string) => void;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "outline";
    case "ACCEPTED":
      return "default";
    case "DENIED":
      return "destructive";
    case "CANCELLED":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "ACCEPTED":
      return "Accepted";
    case "DENIED":
      return "Declined";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
};

export default function StudentParentBookingRequests({
  bookingRequests,
  userRole,
  onStatusUpdate
}: StudentParentBookingRequestsProps) {
  const [cancellingRequests, setCancellingRequests] = useState<Set<string>>(new Set());

  // Group booking requests by student
  const requestsByStudent = bookingRequests.reduce((acc, request) => {
    const studentId = request.student.id;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: request.student,
        requests: []
      };
    }
    acc[studentId].requests.push(request);
    return acc;
  }, {} as Record<string, { student: any; requests: any[] }>);

  const handleCancelRequest = async (requestId: string) => {
    if (cancellingRequests.has(requestId)) return;

    setCancellingRequests(prev => new Set(prev).add(requestId));

    try {
      const result = await updateBookingRequestStatus(requestId, "CANCELLED");

      if (result.error) {
        alert(result.error);
      } else {
        onStatusUpdate(requestId, "CANCELLED");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert("Failed to cancel request. Please try again.");
    } finally {
      setCancellingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (bookingRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Booking Requests</h3>
          <p className="text-muted-foreground">
            You haven't made any booking requests yet. Start by searching for teachers and requesting lessons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(requestsByStudent).map(([studentId, studentData]) => {
        const { student, requests } = studentData as { student: any; requests: any[] };
        return (
        <div key={studentId} className="space-y-4">
          <div className="flex items-center gap-3">
            {student.imageUrl && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                <Image
                  src={student.imageUrl}
                  alt={`${student.firstName} ${student.lastName}`}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {requests.length} booking request{requests.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => {
              const teacherImage = request.teacher.imageUrl || request.teacherUser.imageUrl;
              const teacherName = `${request.teacherUser.firstName || ''} ${request.teacherUser.lastName || ''}`.trim() || 'Teacher';
              const studentName = `${request.student.firstName || ''} ${request.student.lastName || ''}`.trim();
              const dayName = DAYS_OF_WEEK[request.timeslot.dayOfWeek];
              const startTime = formatTime(request.timeslot.startTime);
              const endTime = formatTime(request.timeslot.endTime);
              const instrumentName = request.instrument.name;
              const lessonFormat = request.lessonFormat === "ONLINE" ? "online" : "in-person";

              return (
                <Card key={request.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {teacherImage && (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={teacherImage}
                            alt={teacherName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight">
                          {teacherName} with {studentName} for {instrumentName} lessons ({lessonFormat})
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dayName}s, {startTime} - {endTime}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <Badge variant={getStatusColor(request.bookingStatus)}>
                      {getStatusText(request.bookingStatus)}
                    </Badge>

                    {request.bookingStatus === "PENDING" && (
                      <div className="flex flex-col gap-2">
                        {request.teacherUser.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full"
                          >
                            <a href={`mailto:${request.teacherUser.email}`} className="flex items-center gap-2">
                              <Image
                                src="/svg/email_button.svg"
                                alt="Email"
                                width={16}
                                height={16}
                                className="w-4 h-4"
                              />
                              Contact Teacher
                            </a>
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancellingRequests.has(request.id)}
                          className="w-full"
                        >
                          {cancellingRequests.has(request.id) ? "Cancelling..." : "Cancel"}
                        </Button>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}
