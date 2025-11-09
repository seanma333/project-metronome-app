"use client";

import { useState, useEffect } from "react";
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
import { cn, shouldUnoptimizeImages } from "@/lib/utils";

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

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
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
                  unoptimized={shouldUnoptimizeImages()}
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
    </form>
  );
}
