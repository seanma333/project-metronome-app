"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import Image from "next/image";
import { saveTeacherProfile } from "@/app/actions/save-teacher-profile";
import { getInstruments, getLanguages } from "@/app/actions/get-instruments-languages";
import { generateUniqueProfileName } from "@/app/actions/generate-profile-name";
import { uploadTeacherProfileImage } from "@/app/actions/update-teacher-image";
import AIBioAssistDialog from "@/app/components/profile/AIBioAssistDialog";
import { cn } from "@/lib/utils";

interface TeacherFormProps {
  firstName: string;
  lastName: string;
  email: string;
}

export default function TeacherForm({ firstName: defaultFirstName, lastName: defaultLastName, email }: TeacherFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(defaultFirstName || "");
  const [lastName, setLastName] = useState(defaultLastName || "");
  const [bio, setBio] = useState("");
  const [profileName, setProfileName] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
  const [instruments, setInstruments] = useState<Array<{ id: number; name: string; imagePath: string }>>([]);
  const [languages, setLanguages] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [timeslotCreation, setTimeslotCreation] = useState<"auto" | "manual">("auto");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [instrumentsData, languagesData] = await Promise.all([
          getInstruments(),
          getLanguages(),
        ]);
        setInstruments(instrumentsData);
        setLanguages(languagesData);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load form data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Update profile name when first or last name changes
    const updateProfileName = async () => {
      if (firstName.trim() && lastName.trim()) {
        try {
          const uniqueName = await generateUniqueProfileName(firstName.trim(), lastName.trim());
          setProfileName(uniqueName);
        } catch (err) {
          console.error("Error generating profile name:", err);
          // Fallback to base name if generation fails
          const baseName = `${firstName.trim()}-${lastName.trim()}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
          setProfileName(baseName);
        }
      } else {
        setProfileName("");
      }
    };

    // Debounce the update
    const timeoutId = setTimeout(updateProfileName, 500);
    return () => clearTimeout(timeoutId);
  }, [firstName, lastName]);

  const toggleInstrument = (instrumentId: number) => {
    setSelectedInstruments((prev) =>
      prev.includes(instrumentId)
        ? prev.filter((id) => id !== instrumentId)
        : [...prev, instrumentId]
    );
  };

  const toggleLanguage = (languageId: number) => {
    setSelectedLanguages((prev) =>
      prev.includes(languageId)
        ? prev.filter((id) => id !== languageId)
        : [...prev, languageId]
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
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

    // Validate file size
    const minSize = 1024; // 1KB
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size < minSize) {
      alert("Image file is too small. Please select a valid image file.");
      return;
    }
    if (file.size > maxSize) {
      alert("Image size must be less than 4MB. Please compress the image or choose a smaller file.");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload image to Vercel Blob
      const result = await uploadTeacherProfileImage(file);
      
      if (result.error) {
        console.error("Error uploading image:", result.error);
        alert(result.error);
      } else {
        // Set preview URL
        setPreviewImageUrl(result.imageUrl || null);
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

  const handleAIBioSave = (generatedBio: string) => {
    setBio(generatedBio);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      setIsSaving(false);
      return;
    }

    try {
      const result = await saveTeacherProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim() || undefined,
        instrumentIds: selectedInstruments,
        languageIds: selectedLanguages,
        createTimeslotsAutomatically: timeslotCreation === "auto",
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Failed to save profile");
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading form...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">
          First Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="lastName">
          Last Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled className="bg-muted" />
      </div>

      {/* Profile Photo */}
      <div className="space-y-2">
        <Label>Profile Photo</Label>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg group">
            <Image
              src={previewImageUrl || "/images/profile/default_user.png"}
              alt={[firstName, lastName].filter(Boolean).join(" ") || "Teacher"}
              fill
              className="object-cover"
              sizes="128px"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploadingImage}
                className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors disabled:opacity-50"
                aria-label="Upload profile photo"
              >
                <Image
                  src="/svg/upload_button.svg"
                  alt="Upload"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUploadClick}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? "Uploading..." : "Upload Photo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPEG, PNG, GIF, or WebP. Max 4MB.
            </p>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bio">Bio</Label>
          <Button
            type="button"
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
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself and your teaching experience..."
          rows={4}
        />
      </div>

      {/* Instruments */}
      <div className="space-y-2">
        <Label>Instruments</Label>
        <div className="flex flex-wrap gap-2">
          {instruments.map((instrument) => {
            const isSelected = selectedInstruments.includes(instrument.id);
            return (
              <button
                key={instrument.id}
                type="button"
                onClick={() => toggleInstrument(instrument.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <Image
                  src={instrument.imagePath}
                  alt={instrument.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span>{instrument.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-2">
          {languages.map((language) => {
            const isSelected = selectedLanguages.includes(language.id);
            return (
              <button
                key={language.id}
                type="button"
                onClick={() => toggleLanguage(language.id)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                {language.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Name */}
      <div className="space-y-2">
        <Label htmlFor="profileName">Profile Name</Label>
        <Input
          id="profileName"
          value={profileName}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Your profile URL will be: /profile/{profileName || "..."}
        </p>
      </div>

      {/* Timeslot Creation Option */}
      <div className="space-y-3">
        <Label>Booking Timeslots</Label>
        <RadioGroup
          value={timeslotCreation}
          onValueChange={(value) => setTimeslotCreation(value as "auto" | "manual")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="auto-timeslots" />
            <Label htmlFor="auto-timeslots" className="font-normal cursor-pointer">
              Create timeslots automatically (45-minute slots every hour from 9am-8pm)
              <span className="block text-xs text-muted-foreground mt-1">
                You can edit these later
              </span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual-timeslots" />
            <Label htmlFor="manual-timeslots" className="font-normal cursor-pointer">
              Create timeslots manually
              <span className="block text-xs text-muted-foreground mt-1">
                You can add timeslots later
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* AI Bio Assist Dialog */}
      <AIBioAssistDialog
        isOpen={isAIDialogOpen}
        onClose={() => setIsAIDialogOpen(false)}
        onSave={handleAIBioSave}
        teacherName={`${firstName} ${lastName}`.trim()}
      />
    </form>
  );
}
