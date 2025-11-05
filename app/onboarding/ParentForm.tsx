"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { saveParentProfile } from "@/app/actions/save-parent-profile";
import { getInstruments } from "@/app/actions/get-instruments-languages";
import { setStudentInstrumentProficiency } from "@/app/actions/manage-instrument-proficiency";

interface ParentFormProps {
  firstName: string;
  lastName: string;
}

type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface InstrumentProficiency {
  instrumentId: number;
  proficiency: ProficiencyLevel;
}

export default function ParentForm({ firstName: defaultFirstName, lastName: defaultLastName }: ParentFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [instruments, setInstruments] = useState<any[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<InstrumentProficiency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInstruments() {
      try {
        const instrumentsList = await getInstruments();
        setInstruments(instrumentsList);
      } catch (err) {
        console.error("Error loading instruments:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInstruments();
  }, []);

  const handleSkip = async () => {
    // If skipping, still save the student profile but without instruments
    if (firstName.trim() && lastName.trim()) {
      setIsSaving(true);
      try {
        const result = await saveParentProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dateOfBirth || undefined,
          instrumentProficiencies: [],
        });

        if (!result.error && result.studentId) {
          router.push("/");
        } else {
          alert("Failed to save profile. Please try again.");
          setIsSaving(false);
        }
      } catch (err) {
        console.error("Error saving profile:", err);
        alert("Failed to save profile");
        setIsSaving(false);
      }
    } else {
      router.push("/");
    }
  };

  const handleAddInstrument = () => {
    if (instruments.length > 0) {
      setSelectedInstruments([
        ...selectedInstruments,
        { instrumentId: instruments[0].id, proficiency: "BEGINNER" },
      ]);
    }
  };

  const handleRemoveInstrument = (index: number) => {
    setSelectedInstruments(selectedInstruments.filter((_, i) => i !== index));
  };

  const handleInstrumentChange = (index: number, instrumentId: number) => {
    const updated = [...selectedInstruments];
    updated[index].instrumentId = instrumentId;
    setSelectedInstruments(updated);
  };

  const handleProficiencyChange = (index: number, proficiency: ProficiencyLevel) => {
    const updated = [...selectedInstruments];
    updated[index].proficiency = proficiency;
    setSelectedInstruments(updated);
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

    // Require at least one instrument when submitting (not skipping)
    if (selectedInstruments.length === 0) {
      setError("Please select at least one instrument");
      setIsSaving(false);
      return;
    }

    try {
      const result = await saveParentProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || undefined,
        instrumentProficiencies: selectedInstruments,
      });

      if (result.error) {
        setError(result.error);
        setIsSaving(false);
        return;
      }

      const studentId = result.studentId;
      if (!studentId) {
        setError("Failed to get student ID");
        setIsSaving(false);
        return;
      }

      // Save instrument proficiencies
      for (const prof of selectedInstruments) {
        const profResult = await setStudentInstrumentProficiency(
          studentId,
          prof.instrumentId,
          prof.proficiency
        );
        if (profResult.error) {
          console.error("Error saving proficiency:", profResult.error);
        }
      }

      router.push("/");
    } catch (err) {
      setError("Failed to save profile");
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Emphasis on adding student profile */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-foreground mb-1">
          Add Your Child's Student Profile
        </p>
        <p className="text-xs text-muted-foreground">
          Please provide information for at least one child who will be learning music. You can add more children later.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">
          Child's First Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter your child's first name"
          required
        />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="lastName">
          Child's Last Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter your child's last name"
          required
        />
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Child's Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
      </div>

      {/* Instrument Proficiencies */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label>
            Instruments to Learn <span className="text-destructive">*</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddInstrument}
            disabled={isLoading || instruments.length === 0}
          >
            Add Instrument
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Select at least one instrument your child wants to learn and their proficiency level.
        </p>

        {selectedInstruments.map((prof, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>Instrument</Label>
              <Select
                value={prof.instrumentId.toString()}
                onValueChange={(value) =>
                  handleInstrumentChange(index, parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((instrument) => (
                    <SelectItem
                      key={instrument.id}
                      value={instrument.id.toString()}
                      disabled={selectedInstruments.some(
                        (p, i) => i !== index && p.instrumentId === instrument.id
                      )}
                    >
                      {instrument.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Proficiency</Label>
              <Select
                value={prof.proficiency}
                onValueChange={(value) =>
                  handleProficiencyChange(index, value as ProficiencyLevel)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveInstrument(index)}
              className="mb-0"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      {/* Save and Skip Buttons */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={handleSkip}
          disabled={isSaving}
        >
          Skip
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
