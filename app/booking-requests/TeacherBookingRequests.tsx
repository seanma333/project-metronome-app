"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { acceptBookingRequest, declineBookingRequest } from "@/app/actions/get-booking-requests";

interface TeacherBookingRequestsProps {
  bookingRequests: any[];
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

export default function TeacherBookingRequests({
  bookingRequests,
  onStatusUpdate
}: TeacherBookingRequestsProps) {
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  // Group booking requests by timeslot
  const requestsByTimeslot = bookingRequests.reduce((acc, request) => {
    const timeslotKey = `${request.timeslot.dayOfWeek}-${request.timeslot.startTime}-${request.timeslot.endTime}`;
    if (!acc[timeslotKey]) {
      acc[timeslotKey] = {
        timeslot: request.timeslot,
        requests: []
      };
    }
    acc[timeslotKey].requests.push(request);
    return acc;
  }, {} as Record<string, { timeslot: any; requests: any[] }>);

  const handleAcceptRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      const result = await acceptBookingRequest(requestId);

      if (result.error) {
        alert(result.error);
      } else {
        onStatusUpdate(requestId, "ACCEPTED");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request. Please try again.");
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      const result = await declineBookingRequest(requestId);

      if (result.error) {
        alert(result.error);
      } else {
        onStatusUpdate(requestId, "DENIED");
      }
    } catch (error) {
      console.error("Error declining request:", error);
      alert("Failed to decline request. Please try again.");
    } finally {
      setProcessingRequests(prev => {
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
            You don't have any booking requests at the moment. Students and parents will be able to request lessons from your available time slots.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Recommendation notice */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Recommendation
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              We recommend connecting directly with students or parents before accepting booking requests.
              Use the email button on each request to discuss lesson goals, expectations, and logistics.
            </p>
          </div>
        </div>
      </div>

      {Object.entries(requestsByTimeslot).map(([timeslotKey, timeslotData]) => {
        const { timeslot, requests } = timeslotData as { timeslot: any; requests: any[] };
        const dayName = DAYS_OF_WEEK[timeslot.dayOfWeek];
        const startTime = formatTime(timeslot.startTime);
        const endTime = formatTime(timeslot.endTime);

        return (
          <div key={timeslotKey} className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h2 className="text-xl font-semibold">
                {dayName}s, {startTime} - {endTime}
              </h2>
              <p className="text-sm text-muted-foreground">
                {requests.length} booking request{requests.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => {
                // Determine the requesting user and their image
                const requestingUser = request.requestingUser;
                const userImage = requestingUser?.imageUrl;
                const studentName = `${request.student.firstName || ''} ${request.student.lastName || ''}`.trim();
                const parentName = requestingUser && request.student.parentId
                  ? `${requestingUser.firstName || ''} ${requestingUser.lastName || ''}`.trim()
                  : null;
                const instrumentName = request.instrument.name;
                const lessonFormat = request.lessonFormat === "ONLINE" ? "online" : "in-person";
                const userEmail = requestingUser?.email;

                // Create title based on whether there's a parent
                const title = parentName
                  ? `${studentName} (parent: ${parentName}) for ${instrumentName} lessons (${lessonFormat})`
                  : `${studentName} for ${instrumentName} lessons (${lessonFormat})`;

                return (
                  <Card key={request.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {userImage && (
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={userImage}
                              alt={parentName || studentName}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-tight">
                            {title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      <Badge variant={getStatusColor(request.bookingStatus)}>
                        {getStatusText(request.bookingStatus)}
                      </Badge>

                      {request.bookingStatus === "PENDING" && (
                        <div className="flex flex-col gap-2">
                          {userEmail && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="w-full"
                            >
                              <a href={`mailto:${userEmail}`} className="flex items-center gap-2">
                                <Image
                                  src="/svg/email_button.svg"
                                  alt="Email"
                                  width={16}
                                  height={16}
                                  className="w-4 h-4"
                                />
                                Contact
                              </a>
                            </Button>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={processingRequests.has(request.id)}
                              className="flex-1"
                            >
                              {processingRequests.has(request.id) ? "..." : "Accept"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeclineRequest(request.id)}
                              disabled={processingRequests.has(request.id)}
                              className="flex-1"
                            >
                              {processingRequests.has(request.id) ? "..." : "Decline"}
                            </Button>
                          </div>
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
