"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import ProfileSection from "./ProfileSection";
import InstrumentBadge from "./InstrumentBadge";
import LanguageBadge from "./LanguageBadge";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  updateTeacherBio,
  toggleTeacherInstrument,
  toggleTeacherLanguage,
} from "@/app/actions/update-teacher-profile";
import { updateTeacherName } from "@/app/actions/update-teacher-name";
import { getInstruments, getLanguages } from "@/app/actions/get-instruments-languages";

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
          <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
            <Image
              src={initialTeacher.imageUrl || "/images/profile/default_user.png"}
              alt={[firstName, lastName].filter(Boolean).join(" ") || "Teacher"}
              fill
              className="object-cover"
              sizes="192px"
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
            href={`/teachers/${initialTeacher.profileName}`}
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
    </div>
  );
}
