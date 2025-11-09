import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getStudentById } from "@/app/actions/get-student-profile";
import Navbar from "@/app/components/common/Navbar";
import Footer from "@/app/components/common/Footer";
import Image from "next/image";

interface StudentViewPageProps {
  params: Promise<{ studentId: string }>;
}

export default async function StudentViewPage({ params }: StudentViewPageProps) {
  const { studentId } = await params;
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Check if user is a teacher
  const role = clerkUser.publicMetadata?.role as string | undefined;
  if (role !== "TEACHER") {
    redirect("/");
  }

  const student = await getStudentById(studentId);

  if (!student) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-lg shadow-lg p-8 space-y-6">
              {/* Student Image */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                  <Image
                    src={student.imageUrl || "/images/profile/default_user.png"}
                    alt={
                      [student.firstName, student.lastName]
                        .filter(Boolean)
                        .join(" ") || "Student"
                    }
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                </div>
              </div>

              {/* Student Name */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {[student.firstName, student.lastName]
                    .filter(Boolean)
                    .join(" ") || "Student"}
                </h1>
              </div>

              {/* Student Details */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                    Date of Birth
                  </h3>
                  <p className="text-foreground">
                    {student.dateOfBirth
                      ? (() => {
                          const d = new Date(student.dateOfBirth);
                          const year = d.getUTCFullYear();
                          const month = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
                          const day = d.getUTCDate();
                          return `${month} ${day}, ${year}`;
                        })()
                      : "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
