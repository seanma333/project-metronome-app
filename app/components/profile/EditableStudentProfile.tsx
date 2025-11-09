"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import ProfileSection from "./ProfileSection";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { updateStudentName, updateStudentDateOfBirth } from "@/app/actions/update-student-profile";
import { updateStudentImageUrl } from "@/app/actions/update-student-image";
import { getInstruments } from "@/app/actions/get-instruments-languages";
import {
  getStudentInstrumentProficiencies,
  setStudentInstrumentProficiency,
  removeStudentInstrumentProficiency,
} from "@/app/actions/manage-instrument-proficiency";
import ProficiencyBadge from "./ProficiencyBadge";
import { shouldUnoptimizeImages } from "@/lib/utils";

type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface EditableStudentProfileProps {
  student: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: Date | null;
    imageUrl: string | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}

export default function EditableStudentProfile({
  student: initialStudent,
}: EditableStudentProfileProps) {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [firstName, setFirstName] = useState(initialStudent.firstName || "");
  const [lastName, setLastName] = useState(initialStudent.lastName || "");
  // Helper function to format date for input (YYYY-MM-DD) using UTC to avoid timezone issues
  const formatDateForInput = (date: Date | string | null): string => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to format date for display using UTC to avoid timezone issues
  const formatDateForDisplay = (date: Date | string | null): string => {
    if (!date) return "Not set";
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
    const day = d.getUTCDate();
    return `${month} ${day}, ${year}`;
  };

  const [dateOfBirth, setDateOfBirth] = useState(
    formatDateForInput(initialStudent.dateOfBirth)
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isEditingDateOfBirth, setIsEditingDateOfBirth] = useState(false);
  const [isSavingDateOfBirth, setIsSavingDateOfBirth] = useState(false);
  const [syncWithUser, setSyncWithUser] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Instrument proficiency state
  const [instruments, setInstruments] = useState<any[]>([]);
  const [proficiencies, setProficiencies] = useState<any[]>([]);
  const [isLoadingProficiencies, setIsLoadingProficiencies] = useState(true);
  const [isEditingProficiencies, setIsEditingProficiencies] = useState(false);
  const [addingProficiency, setAddingProficiency] = useState(false);
  const [newProficiency, setNewProficiency] = useState<{ instrumentId: number | null; proficiency: ProficiencyLevel }>({
    instrumentId: null,
    proficiency: "BEGINNER",
  });

  useEffect(() => {
    setFirstName(initialStudent.firstName || "");
    setLastName(initialStudent.lastName || "");
    setDateOfBirth(formatDateForInput(initialStudent.dateOfBirth));
  }, [initialStudent]);

  useEffect(() => {
    async function loadData() {
      try {
        const [instrumentsList, proficienciesResult] = await Promise.all([
          getInstruments(),
          getStudentInstrumentProficiencies(initialStudent.id),
        ]);
        setInstruments(instrumentsList);
        if (!proficienciesResult.error && proficienciesResult.proficiencies) {
          setProficiencies(proficienciesResult.proficiencies);
        }
      } catch (err) {
        console.error("Error loading proficiencies:", err);
      } finally {
        setIsLoadingProficiencies(false);
      }
    }
    loadData();
  }, [initialStudent.id]);

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      if (!firstName.trim() || !lastName.trim()) {
        alert("First name and last name are required");
        setIsSavingName(false);
        return;
      }

      const result = await updateStudentName(
        firstName.trim(),
        lastName.trim(),
        syncWithUser
      );
      if (result.error) {
        console.error("Error saving name:", result.error);
        alert("Failed to save name");
      } else {
        setIsEditingName(false);
        if (syncWithUser && isLoaded && clerkUser) {
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
    setFirstName(initialStudent.firstName || "");
    setLastName(initialStudent.lastName || "");
    setIsEditingName(false);
    setSyncWithUser(false);
  };

  const handleSaveDateOfBirth = async () => {
    setIsSavingDateOfBirth(true);
    try {
      const result = await updateStudentDateOfBirth(dateOfBirth || null);
      if (result.error) {
        console.error("Error saving date of birth:", result.error);
        alert("Failed to save date of birth");
      } else {
        setIsEditingDateOfBirth(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Error saving date of birth:", err);
      alert("Failed to save date of birth");
    } finally {
      setIsSavingDateOfBirth(false);
    }
  };

  const handleCancelDateOfBirth = () => {
    setDateOfBirth(formatDateForInput(initialStudent.dateOfBirth));
    setIsEditingDateOfBirth(false);
  };

  const handleAddProficiency = async () => {
    if (!newProficiency.instrumentId) {
      alert("Please select an instrument");
      return;
    }

    try {
      const result = await setStudentInstrumentProficiency(
        initialStudent.id,
        newProficiency.instrumentId,
        newProficiency.proficiency
      );

      if (result.error) {
        alert(result.error);
      } else {
              // Reload proficiencies
              const proficienciesResult = await getStudentInstrumentProficiencies(initialStudent.id);
              if (!proficienciesResult.error && proficienciesResult.proficiencies) {
                setProficiencies(proficienciesResult.proficiencies);
              }
              setAddingProficiency(false);
              setNewProficiency({ instrumentId: null, proficiency: "BEGINNER" });
              setIsEditingProficiencies(false);
      }
    } catch (err) {
      console.error("Error adding proficiency:", err);
      alert("Failed to add proficiency");
    }
  };

  const handleUpdateProficiency = async (instrumentId: number, proficiency: ProficiencyLevel) => {
    try {
      const result = await setStudentInstrumentProficiency(
        initialStudent.id,
        instrumentId,
        proficiency
      );

      if (result.error) {
        alert(result.error);
      } else {
        // Reload proficiencies
        const proficienciesResult = await getStudentInstrumentProficiencies(initialStudent.id);
        if (!proficienciesResult.error && proficienciesResult.proficiencies) {
          setProficiencies(proficienciesResult.proficiencies);
        }
      }
    } catch (err) {
      console.error("Error updating proficiency:", err);
      alert("Failed to update proficiency");
    }
  };

  const handleRemoveProficiency = async (instrumentId: number) => {
    try {
      const result = await removeStudentInstrumentProficiency(
        initialStudent.id,
        instrumentId
      );

      if (result.error) {
        alert(result.error);
      } else {
        // Reload proficiencies
        const proficienciesResult = await getStudentInstrumentProficiencies(initialStudent.id);
        if (!proficienciesResult.error && proficienciesResult.proficiencies) {
          setProficiencies(proficienciesResult.proficiencies);
        }
      }
    } catch (err) {
      console.error("Error removing proficiency:", err);
      alert("Failed to remove proficiency");
    }
  };

  const getProficiencyDisplay = (prof: string) => {
    switch (prof) {
      case "BEGINNER":
        return "Beginner";
      case "INTERMEDIATE":
        return "Intermediate";
      case "ADVANCED":
        return "Advanced";
      default:
        return prof;
    }
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
      const result = await updateStudentImageUrl(imageUrl);
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

  // Use student name if available, otherwise fall back to user name
  const displayFirstName = initialStudent.firstName || initialStudent.user.firstName || "";
  const displayLastName = initialStudent.lastName || initialStudent.user.lastName || "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Side - Profile Info */}
      <div className="md:col-span-1 space-y-4">
        <div className="space-y-4">
          <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-lg group">
            <Image
              src={initialStudent.imageUrl || "/images/profile/default_user.png"}
              alt={[displayFirstName, displayLastName].filter(Boolean).join(" ") || "Student"}
              fill
              className="object-cover"
              sizes="192px"
              unoptimized={shouldUnoptimizeImages()}
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
                  unoptimized={shouldUnoptimizeImages()}
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

          {/* Editable Name */}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    id="syncWithUser"
                    checked={syncWithUser}
                    onChange={(e) => setSyncWithUser(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="syncWithUser" className="cursor-pointer">
                    Sync with account name
                  </label>
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
                    {[displayFirstName, displayLastName].filter(Boolean).join(" ") || "Student"}
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
                      unoptimized={shouldUnoptimizeImages()}
                    />
                  </button>
                </div>
                <p className="text-muted-foreground">{initialStudent.user.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Editable Sections */}
      <div className="md:col-span-2 space-y-6">
        {/* Date of Birth */}
        <ProfileSection
          title="Date of Birth"
          onEdit={() => setIsEditingDateOfBirth(!isEditingDateOfBirth)}
          isEditing={isEditingDateOfBirth}
          showEditButton={true}
        >
          {isEditingDateOfBirth ? (
            <div className="space-y-3">
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="max-w-xs"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDateOfBirth}
                  disabled={isSavingDateOfBirth}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDateOfBirth}
                  disabled={isSavingDateOfBirth}
                >
                  {isSavingDateOfBirth ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {formatDateForDisplay(initialStudent.dateOfBirth)}
            </p>
          )}
        </ProfileSection>

        {/* Instrument Proficiencies */}
        <ProfileSection
          title="Instrument Proficiencies"
          onEdit={() => setIsEditingProficiencies(!isEditingProficiencies)}
          isEditing={isEditingProficiencies}
          showEditButton={true}
        >
          {isLoadingProficiencies ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : isEditingProficiencies ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {proficiencies.length > 0 ? (
                  proficiencies.map((prof) => (
                    <div key={prof.proficiency.id} className="flex items-center gap-2">
                      <ProficiencyBadge
                        instrument={prof.instrument}
                        proficiency={prof.proficiency.proficiency}
                      />
                      <Select
                        value={prof.proficiency.proficiency}
                        onValueChange={(value) =>
                          handleUpdateProficiency(prof.instrument.id, value as ProficiencyLevel)
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                          >
                            <Image
                              src="/svg/delete_button.svg"
                              alt="Remove"
                              width={16}
                              height={16}
                              className="object-contain"
                              unoptimized={shouldUnoptimizeImages()}
                            />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Instrument Proficiency</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this instrument proficiency? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveProficiency(prof.instrument.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove Proficiency
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No instrument proficiencies added yet.</p>
                )}
              </div>
              {!addingProficiency ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingProficiency(true)}
                >
                  Add Instrument
                </Button>
              ) : (
                <div className="space-y-3 border-t pt-3">
                  <div className="flex gap-2">
                    <Select
                      value={newProficiency.instrumentId?.toString() || ""}
                      onValueChange={(value) =>
                        setNewProficiency({ ...newProficiency, instrumentId: parseInt(value) })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select instrument" />
                      </SelectTrigger>
                      <SelectContent>
                        {instruments
                          .filter(
                            (inst) =>
                              !proficiencies.some(
                                (prof) => prof.instrument.id === inst.id
                              )
                          )
                          .map((instrument) => (
                            <SelectItem
                              key={instrument.id}
                              value={instrument.id.toString()}
                            >
                              {instrument.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newProficiency.proficiency}
                      onValueChange={(value) =>
                        setNewProficiency({ ...newProficiency, proficiency: value as ProficiencyLevel })
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
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAddingProficiency(false);
                        setNewProficiency({ instrumentId: null, proficiency: "BEGINNER" });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddProficiency}>
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : proficiencies.length === 0 ? (
            <p className="text-muted-foreground">No instrument proficiencies added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {proficiencies.map((prof) => (
                <ProficiencyBadge
                  key={prof.proficiency.id}
                  instrument={prof.instrument}
                  proficiency={prof.proficiency.proficiency}
                />
              ))}
            </div>
          )}
        </ProfileSection>
      </div>
    </div>
  );
}
