"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import ProfileSection from "./ProfileSection";
import InstrumentBadge from "./InstrumentBadge";
import LanguageBadge from "./LanguageBadge";
import AIBioAssistDialog from "./AIBioAssistDialog";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  updateTeacherBio,
  toggleTeacherInstrument,
  toggleTeacherLanguage,
} from "@/app/actions/update-teacher-profile";
import { updateTeacherName } from "@/app/actions/update-teacher-name";
import { updateTeacherImageUrl } from "@/app/actions/update-teacher-image";
import { getInstruments, getLanguages } from "@/app/actions/get-instruments-languages";
import { shouldUnoptimizeImages } from "@/lib/utils";

interface EditableTeacherProfileProps {
  teacher: {
    id: string;
    bio: string | null;
    imageUrl: string | null;
    profileName: string;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
    instruments: Array<{ id: number; name: string; imagePath: string }>;
    languages: Array<{ id: number; name: string; code: string }>;
  };
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export default function EditableTeacherProfile({
  teacher: initialTeacher,
  firstName,
  lastName,
  email,
}: EditableTeacherProfileProps) {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [bio, setBio] = useState(initialTeacher.bio || "");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState(firstName || "");
  const [editedLastName, setEditedLastName] = useState(lastName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<number[]>(
    initialTeacher.instruments.map((i) => i.id)
  );
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>(
    initialTeacher.languages.map((l) => l.id)
  );

  // Sync state when initialTeacher changes (e.g., after refresh)
  useEffect(() => {
    setSelectedInstruments(initialTeacher.instruments.map((i) => i.id));
    setSelectedLanguages(initialTeacher.languages.map((l) => l.id));
    setBio(initialTeacher.bio || "");
    setEditedFirstName(firstName || "");
    setEditedLastName(lastName || "");
  }, [initialTeacher.instruments, initialTeacher.languages, initialTeacher.bio, firstName, lastName]);
  const [isEditingInstruments, setIsEditingInstruments] = useState(false);
  const [isEditingLanguages, setIsEditingLanguages] = useState(false);
  const [allInstruments, setAllInstruments] = useState<
    Array<{ id: number; name: string; imagePath: string }>
  >([]);
  const [allLanguages, setAllLanguages] = useState<
    Array<{ id: number; name: string; code: string }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [instrumentsData, languagesData] = await Promise.all([
          getInstruments(),
          getLanguages(),
        ]);
        setAllInstruments(instrumentsData);
        setAllLanguages(languagesData);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const result = await updateTeacherBio(bio);
      if (result.error) {
        console.error("Error saving bio:", result.error);
        alert("Failed to save bio");
      } else {
        setIsEditingBio(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Error saving bio:", err);
      alert("Failed to save bio");
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleAIBioSave = (generatedBio: string) => {
    setBio(generatedBio);
  };

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      if (!editedFirstName.trim() || !editedLastName.trim()) {
        alert("First name and last name are required");
        setIsSavingName(false);
        return;
      }

      const result = await updateTeacherName(editedFirstName.trim(), editedLastName.trim());
      if (result.error) {
        console.error("Error saving name:", result.error);
        alert("Failed to save name");
      } else {
        setIsEditingName(false);
        // Refresh Clerk user data
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
    setEditedFirstName(firstName || "");
    setEditedLastName(lastName || "");
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
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert("Invalid file extension. Please upload a JPEG, PNG, GIF, WebP, or SVG image.");
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
      const result = await updateTeacherImageUrl(imageUrl);
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

  const handleToggleInstrument = async (instrumentId: number) => {
    try {
      const result = await toggleTeacherInstrument(instrumentId);
      if (result.error) {
        console.error("Error toggling instrument:", result.error);
        alert("Failed to update instrument");
      } else {
        setSelectedInstruments((prev) =>
          result.added ? [...prev, instrumentId] : prev.filter((id) => id !== instrumentId)
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Error toggling instrument:", err);
      alert("Failed to update instrument");
    }
  };

  const handleToggleLanguage = async (languageId: number) => {
    try {
      const result = await toggleTeacherLanguage(languageId);
      if (result.error) {
        console.error("Error toggling language:", result.error);
        alert("Failed to update language");
      } else {
        setSelectedLanguages((prev) =>
          result.added ? [...prev, languageId] : prev.filter((id) => id !== languageId)
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Error toggling language:", err);
      alert("Failed to update language");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Side - Profile Info */}
      <div className="md:col-span-1 space-y-4">
        <div className="space-y-4">
          <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-lg group">
            <Image
              src={initialTeacher.imageUrl || "/images/profile/default_user.png"}
              alt={[firstName, lastName].filter(Boolean).join(" ") || "Teacher"}
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
                    value={editedFirstName}
                    onChange={(e) => setEditedFirstName(e.target.value)}
                    placeholder="First Name"
                    className="flex-1 text-center"
                  />
                  <Input
                    value={editedLastName}
                    onChange={(e) => setEditedLastName(e.target.value)}
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
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isSavingName}
                  >
                    {isSavingName ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {[firstName, lastName].filter(Boolean).join(" ") || "Teacher"}
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
                <p className="text-muted-foreground">{email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link
            href={`/teacher-profiles/${initialTeacher.profileName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline text-sm transition-colors"
          >
            View Public Profile
          </Link>
        </div>
      </div>

      {/* Right Side - Editable Sections */}
      <div className="md:col-span-2 space-y-6">
        {/* Bio */}
        <ProfileSection
          title="Biography"
          onEdit={() => setIsEditingBio(!isEditingBio)}
          isEditing={isEditingBio}
          showEditButton={true}
        >
          {isEditingBio ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Tell us about yourself and your teaching experience
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAIDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-primary"
                  >
                    <path
                      d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828l.645-1.937zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.734 1.734 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.734 1.734 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.734 1.734 0 0 0 3.407 2.31l.387-1.162zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z"
                      fill="currentColor"
                    />
                  </svg>
                  AI Assist
                </Button>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself and your teaching experience..."
                rows={6}
                className="w-full"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBio(initialTeacher.bio || "");
                    setIsEditingBio(false);
                  }}
                  disabled={isSavingBio}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveBio} disabled={isSavingBio}>
                  {isSavingBio ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {bio || "No biography available. Click edit to add one."}
            </p>
          )}
        </ProfileSection>

        {/* Instruments */}
        <ProfileSection
          title="Instruments"
          onEdit={() => setIsEditingInstruments(!isEditingInstruments)}
          isEditing={isEditingInstruments}
          showEditButton={true}
        >
          {isEditingInstruments ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {isLoadingData ? (
                  <p className="text-muted-foreground text-sm">Loading instruments...</p>
                ) : (
                  allInstruments.map((instrument) => {
                    const isSelected = selectedInstruments.includes(instrument.id);
                    return (
                      <InstrumentBadge
                        key={instrument.id}
                        instrument={instrument}
                        isSelected={isSelected}
                        onClick={() => handleToggleInstrument(instrument.id)}
                      />
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on instruments to add or remove them from your profile.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedInstruments.length > 0 ? (
                initialTeacher.instruments.map((instrument) => (
                  <InstrumentBadge key={instrument.id} instrument={instrument} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No instruments listed.</p>
              )}
            </div>
          )}
        </ProfileSection>

        {/* Languages */}
        <ProfileSection
          title="Languages"
          onEdit={() => setIsEditingLanguages(!isEditingLanguages)}
          isEditing={isEditingLanguages}
          showEditButton={true}
        >
          {isEditingLanguages ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {isLoadingData ? (
                  <p className="text-muted-foreground text-sm">Loading languages...</p>
                ) : (
                  allLanguages.map((language) => {
                    const isSelected = selectedLanguages.includes(language.id);
                    return (
                      <LanguageBadge
                        key={language.id}
                        language={language}
                        isSelected={isSelected}
                        onClick={() => handleToggleLanguage(language.id)}
                      />
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on languages to add or remove them from your profile.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedLanguages.length > 0 ? (
                initialTeacher.languages.map((language) => (
                  <LanguageBadge key={language.id} language={language} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No languages listed.</p>
              )}
            </div>
          )}
        </ProfileSection>
      </div>

      {/* Acknowledgements */}
      <div className="md:col-span-3 mt-12 pt-6 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1 text-center max-w-2xl mx-auto">
          <div>
            Icons made by{" "}
            <a
              href="https://www.flaticon.com/authors/flat-icons"
              title="Flat Icons"
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Flat Icons
            </a>{" "}
            from{" "}
            <a
              href="https://www.flaticon.com/"
              title="Flaticon"
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.flaticon.com
            </a>
          </div>
          <div>
            Icons made by{" "}
            <a
              href="https://www.freepik.com"
              title="Freepik"
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Freepik
            </a>{" "}
            from{" "}
            <a
              href="https://www.flaticon.com/"
              title="Flaticon"
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.flaticon.com
            </a>
          </div>
        </div>
      </div>

      {/* AI Bio Assist Dialog */}
      <AIBioAssistDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        onSave={handleAIBioSave}
        teacherName={`${editedFirstName} ${editedLastName}`.trim()}
      />
    </div>
  );
}
