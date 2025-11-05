"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { saveStudentProfile } from "@/app/actions/save-student-profile";
import { getInstruments } from "@/app/actions/get-instruments-languages";
import { setStudentInstrumentProficiency } from "@/app/actions/manage-instrument-proficiency";

interface StudentFormProps {
  firstName: string;
  lastName: string;
  email: string;
}

type ProficiencyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

interface InstrumentProficiency {
  instrumentId: number;
  proficiency: ProficiencyLevel;
}

export default function StudentForm({ firstName: defaultFirstName, lastName: defaultLastName, email }: StudentFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(defaultFirstName || "");
  const [lastName, setLastName] = useState(defaultLastName || "");
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

    if (selectedInstruments.length === 0) {
      setError("Please select at least one instrument");
      setIsSaving(false);
      return;
    }

    try {
      // Save student profile first
      const result = await saveStudentProfile({
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

      // Get the student ID from the result
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

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
          Select at least one instrument you want to learn and your proficiency level.
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

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
