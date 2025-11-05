"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import ProfileSection from "./ProfileSection";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { updateTeacherName } from "@/app/actions/update-teacher-name";
import {
  addParentStudent,
  updateParentStudent,
  removeParentStudent,
} from "@/app/actions/manage-parent-students";
import { updateParentImageUrl } from "@/app/actions/update-parent-image";
import { getInstruments } from "@/app/actions/get-instruments-languages";
import {
  getStudentInstrumentProficiencies,
  setStudentInstrumentProficiency,
  removeStudentInstrumentProficiency,
} from "@/app/actions/manage-instrument-proficiency";
import ProficiencyBadge from "./ProficiencyBadge";

type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface EditableParentProfileProps {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
  };
  students: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: Date | null;
    imageUrl: string | null;
  }>;
}

export default function EditableParentProfile({
  user: initialUser,
  students: initialStudents,
}: EditableParentProfileProps) {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [firstName, setFirstName] = useState(initialUser.firstName || "");
  const [lastName, setLastName] = useState(initialUser.lastName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [students, setStudents] = useState(initialStudents);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Instrument proficiency state
  const [instruments, setInstruments] = useState<any[]>([]);
  const [studentProficiencies, setStudentProficiencies] = useState<Record<string, any[]>>({});
  const [editingProficienciesFor, setEditingProficienciesFor] = useState<string | null>(null);
  const [addingProficiencyFor, setAddingProficiencyFor] = useState<string | null>(null);
  const [newProficiencies, setNewProficiencies] = useState<Record<string, { instrumentId: number | null; proficiency: ProficiencyLevel }>>({});

  useEffect(() => {
    setFirstName(initialUser.firstName || "");
    setLastName(initialUser.lastName || "");
    setStudents(initialStudents);
  }, [initialUser, initialStudents]);

  useEffect(() => {
    async function loadData() {
      try {
        const instrumentsList = await getInstruments();
        setInstruments(instrumentsList);

        // Load proficiencies for all students
        const proficienciesMap: Record<string, any[]> = {};
        for (const student of initialStudents) {
          const result = await getStudentInstrumentProficiencies(student.id);
          if (!result.error && result.proficiencies) {
            proficienciesMap[student.id] = result.proficiencies;
          }
        }
        setStudentProficiencies(proficienciesMap);
      } catch (err) {
        console.error("Error loading proficiencies:", err);
      }
    }
    loadData();
  }, [initialStudents]);

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      if (!firstName.trim() || !lastName.trim()) {
        alert("First name and last name are required");
        setIsSavingName(false);
        return;
      }

      const result = await updateTeacherName(firstName.trim(), lastName.trim());
      if (result.error) {
        console.error("Error saving name:", result.error);
        alert("Failed to save name");
      } else {
        setIsEditingName(false);
        if (isLoaded && clerkUser) {
          await clerkUser.reload();
        }
        router.refresh();
      }
    } catch (err) {
      console.error("Error saving name:", err);
      alert("Failed to save name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelName = () => {
    setFirstName(initialUser.firstName || "");
    setLastName(initialUser.lastName || "");
    setIsEditingName(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type - check for specific image MIME types
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size - minimum 1KB (to prevent empty/corrupted files)
    const minSize = 1024; // 1KB
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size < minSize) {
      alert("Image file is too small. Please select a valid image file.");
      return;
    }

    // Validate file size - maximum 5MB
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB. Please compress the image or choose a smaller file.");
      return;
    }

    // Validate file extension as additional check
    const fileExtension = file.name.toLowerCase().split(".").pop();
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert("Invalid file extension. Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }

    if (!isLoaded || !clerkUser) {
      alert("User not loaded");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload image to Clerk using setProfileImage
      await clerkUser.setProfileImage({ file });

      // Get the updated image URL from Clerk
      await clerkUser.reload();
      const imageUrl = clerkUser.imageUrl;

      if (!imageUrl) {
        throw new Error("Failed to get image URL from Clerk");
      }

      // Update database with new image URL
      const result = await updateParentImageUrl(imageUrl);
      if (result.error) {
        console.error("Error saving image URL:", result.error);
        alert("Failed to save image");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddStudent = async (
    firstName: string,
    lastName: string,
    dateOfBirth?: string
  ) => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("First name and last name are required");
      return;
    }

    try {
      const result = await addParentStudent(firstName.trim(), lastName.trim(), dateOfBirth);
      if (result.error) {
        console.error("Error adding student:", result.error);
        alert("Failed to add student");
      } else {
        setAddingStudent(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Error adding student:", err);
      alert("Failed to add student");
    }
  };

  const handleUpdateStudent = async (
    studentId: string,
    firstName: string,
    lastName: string,
    dateOfBirth?: string
  ) => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("First name and last name are required");
      return;
    }

    try {
      const result = await updateParentStudent(studentId, firstName.trim(), lastName.trim(), dateOfBirth);
      if (result.error) {
        console.error("Error updating student:", result.error);
        alert("Failed to update student");
      } else {
        setEditingStudentId(null);
        router.refresh();
      }
    } catch (err) {
      console.error("Error updating student:", err);
      alert("Failed to update student");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student profile?")) {
      return;
    }

    try {
      const result = await removeParentStudent(studentId);
      if (result.error) {
        console.error("Error removing student:", result.error);
        alert("Failed to remove student");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error removing student:", err);
      alert("Failed to remove student");
    }
  };

  const handleAddProficiency = async (studentId: string) => {
    const newProf = newProficiencies[studentId];
    if (!newProf || !newProf.instrumentId) {
      alert("Please select an instrument");
      return;
    }

    try {
      const result = await setStudentInstrumentProficiency(
        studentId,
        newProf.instrumentId,
        newProf.proficiency
      );

      if (result.error) {
        alert(result.error);
      } else {
        // Reload proficiencies
        const proficienciesResult = await getStudentInstrumentProficiencies(studentId);
        if (!proficienciesResult.error && proficienciesResult.proficiencies) {
          setStudentProficiencies({
            ...studentProficiencies,
            [studentId]: proficienciesResult.proficiencies,
          });
        }
        setAddingProficiencyFor(null);
        setNewProficiencies({
          ...newProficiencies,
          [studentId]: { instrumentId: null, proficiency: "BEGINNER" },
        });
      }
    } catch (err) {
      console.error("Error adding proficiency:", err);
      alert("Failed to add proficiency");
    }
  };

  const handleUpdateProficiency = async (studentId: string, instrumentId: number, proficiency: ProficiencyLevel) => {
    try {
      const result = await setStudentInstrumentProficiency(studentId, instrumentId, proficiency);

      if (result.error) {
        alert(result.error);
      } else {
        // Reload proficiencies
        const proficienciesResult = await getStudentInstrumentProficiencies(studentId);
        if (!proficienciesResult.error && proficienciesResult.proficiencies) {
          setStudentProficiencies({
            ...studentProficiencies,
            [studentId]: proficienciesResult.proficiencies,
          });
        }
      }
    } catch (err) {
      console.error("Error updating proficiency:", err);
      alert("Failed to update proficiency");
    }
  };

  const handleRemoveProficiency = async (studentId: string, instrumentId: number) => {
    if (!confirm("Are you sure you want to remove this instrument proficiency?")) {
      return;
    }

    try {
      const result = await removeStudentInstrumentProficiency(studentId, instrumentId);

      if (result.error) {
        alert(result.error);
      } else {
        // Reload proficiencies
        const proficienciesResult = await getStudentInstrumentProficiencies(studentId);
        if (!proficienciesResult.error && proficienciesResult.proficiencies) {
          setStudentProficiencies({
            ...studentProficiencies,
            [studentId]: proficienciesResult.proficiencies,
          });
        }
      }
    } catch (err) {
      console.error("Error removing proficiency:", err);
      alert("Failed to remove proficiency");
    }
  };

  return (
    <div className="space-y-8">
      {/* Parent Name Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="text-center space-y-4">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-lg group">
              <Image
                src={initialUser.imageUrl || "/images/profile/default_user.png"}
                alt={[firstName, lastName].filter(Boolean).join(" ") || "Parent"}
                fill
                className="object-cover"
                sizes="192px"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={handleUploadClick}
                  disabled={isUploadingImage}
                  className="bg-background/90 hover:bg-background px-3 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Image
                    src="/svg/upload_button.svg"
                    alt="Upload"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span className="text-sm font-medium text-foreground">
                    {isUploadingImage ? "Uploading..." : "Upload"}
                  </span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="relative group text-center">
              {isEditingName ? (
                <div className="space-y-3 max-w-[192px] mx-auto">
                  <div className="flex gap-2">
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="flex-1 text-center"
                    />
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="flex-1 text-center"
                    />
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelName}
                      disabled={isSavingName}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveName} disabled={isSavingName}>
                      {isSavingName ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {[firstName, lastName].filter(Boolean).join(" ") || "Parent"}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
                      aria-label="Edit name"
                    >
                      <Image
                        src="/svg/edit_button.svg"
                        alt="Edit"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </button>
                  </div>
                  <p className="text-muted-foreground">{initialUser.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="md:col-span-2"></div>
      </div>

      {/* Student Profiles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Student Profiles</h2>
          <button
            onClick={() => setAddingStudent(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Image
              src="/svg/add_button.svg"
              alt="Add"
              width={20}
              height={20}
              className="object-contain"
            />
            <span>Add Student</span>
          </button>
        </div>

        {/* Add Student Form */}
        {addingStudent && (
          <div className="border border-border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Add New Student</h3>
            <StudentForm
              onSubmit={(firstName, lastName, dateOfBirth) => {
                handleAddStudent(firstName, lastName, dateOfBirth);
              }}
              onCancel={() => setAddingStudent(false)}
            />
          </div>
        )}

        {/* Existing Student Profiles */}
        {students.map((student) => (
          <div key={student.id} className="border border-border rounded-lg p-6">
            {editingStudentId === student.id ? (
              <StudentForm
                initialFirstName={student.firstName || ""}
                initialLastName={student.lastName || ""}
                    initialDateOfBirth={
                  student.dateOfBirth
                    ? (() => {
                        const d = new Date(student.dateOfBirth);
                        const year = d.getUTCFullYear();
                        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
                        const day = String(d.getUTCDate()).padStart(2, "0");
                        return `${year}-${month}-${day}`;
                      })()
                    : ""
                }
                onSubmit={(firstName, lastName, dateOfBirth) => {
                  handleUpdateStudent(student.id, firstName, lastName, dateOfBirth);
                }}
                onCancel={() => setEditingStudentId(null)}
                onRemove={() => handleRemoveStudent(student.id)}
                showRemove={true}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {[student.firstName, student.lastName]
                        .filter(Boolean)
                        .join(" ") || "Student"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {student.dateOfBirth
                        ? `Date of Birth: ${(() => {
                            const d = new Date(student.dateOfBirth);
                            const year = d.getUTCFullYear();
                            const month = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
                            const day = d.getUTCDate();
                            return `${month} ${day}, ${year}`;
                          })()}`
                        : "Date of Birth: Not set"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingStudentId(student.id)}
                      className="p-2 hover:bg-accent rounded transition-colors"
                      aria-label="Edit student"
                    >
                      <Image
                        src="/svg/edit_button.svg"
                        alt="Edit"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </button>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      className="p-2 hover:bg-destructive/10 rounded transition-colors"
                      aria-label="Remove student"
                    >
                      <Image
                        src="/svg/delete_button.svg"
                        alt="Delete"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </button>
                  </div>
                </div>

                {/* Instrument Proficiencies */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Instrument Proficiencies</h4>
                    {editingProficienciesFor === student.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingProficienciesFor(null);
                          setAddingProficiencyFor(null);
                        }}
                      >
                        Done
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProficienciesFor(student.id)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  {editingProficienciesFor === student.id ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {studentProficiencies[student.id]?.length > 0 ? (
                          studentProficiencies[student.id]?.map((prof) => (
                            <div key={prof.proficiency.id} className="flex items-center gap-2">
                              <ProficiencyBadge
                                instrument={prof.instrument}
                                proficiency={prof.proficiency.proficiency}
                              />
                              <Select
                                value={prof.proficiency.proficiency}
                                onValueChange={(value) =>
                                  handleUpdateProficiency(student.id, prof.instrument.id, value as ProficiencyLevel)
                                }
                              >
                                <SelectTrigger className="h-8 w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProficiency(student.id, prof.instrument.id)}
                                className="h-8 px-2"
                              >
                                <Image
                                  src="/svg/delete_button.svg"
                                  alt="Remove"
                                  width={16}
                                  height={16}
                                  className="object-contain"
                                />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No instrument proficiencies added yet.</p>
                        )}
                      </div>
                      {!addingProficiencyFor ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddingProficiencyFor(student.id);
                            if (!newProficiencies[student.id]) {
                              setNewProficiencies({
                                ...newProficiencies,
                                [student.id]: { instrumentId: null, proficiency: "BEGINNER" },
                              });
                            }
                          }}
                        >
                          Add Instrument
                        </Button>
                      ) : (
                        <div className="space-y-3 border-t pt-3">
                          <div className="flex gap-2 items-end">
                            <Select
                              value={newProficiencies[student.id]?.instrumentId?.toString() || ""}
                              onValueChange={(value) =>
                                setNewProficiencies({
                                  ...newProficiencies,
                                  [student.id]: { ...newProficiencies[student.id], instrumentId: parseInt(value) },
                                })
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select instrument" />
                              </SelectTrigger>
                              <SelectContent>
                                {instruments
                                  .filter(
                                    (inst) =>
                                      !studentProficiencies[student.id]?.some(
                                        (prof) => prof.instrument.id === inst.id
                                      )
                                  )
                                  .map((instrument) => (
                                    <SelectItem key={instrument.id} value={instrument.id.toString()}>
                                      {instrument.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={newProficiencies[student.id]?.proficiency || "BEGINNER"}
                              onValueChange={(value) =>
                                setNewProficiencies({
                                  ...newProficiencies,
                                  [student.id]: { ...newProficiencies[student.id], proficiency: value as ProficiencyLevel },
                                })
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BEGINNER">Beginner</SelectItem>
                                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                                <SelectItem value="ADVANCED">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAddingProficiencyFor(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleAddProficiency(student.id)}>
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : studentProficiencies[student.id]?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No instrument proficiencies added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {studentProficiencies[student.id]?.map((prof) => (
                        <ProficiencyBadge
                          key={prof.proficiency.id}
                          instrument={prof.instrument}
                          proficiency={prof.proficiency.proficiency}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {students.length === 0 && !addingStudent && (
          <p className="text-muted-foreground text-center py-8">
            No student profiles yet. Click "Add Student" to create one.
          </p>
        )}
      </div>
    </div>
  );
}

// Student Form Component
interface StudentFormProps {
  initialFirstName?: string;
  initialLastName?: string;
  initialDateOfBirth?: string;
  onSubmit: (firstName: string, lastName: string, dateOfBirth?: string) => void;
  onCancel: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

function StudentForm({
  initialFirstName = "",
  initialLastName = "",
  initialDateOfBirth = "",
  onSubmit,
  onCancel,
  onRemove,
  showRemove = false,
}: StudentFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(firstName, lastName, dateOfBirth || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            First Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Last Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Date of Birth</label>
        <Input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        {showRemove && onRemove && (
          <Button type="button" variant="destructive" onClick={onRemove}>
            Remove
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
