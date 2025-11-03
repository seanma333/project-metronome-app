"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TimezoneSelect from "react-timezone-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { StateSelect } from "@/app/components/ui/state-select";
import { updatePreferredTimezone } from "@/app/actions/update-user-preferences";
import {
  updateAcceptingStudents,
  updateTeachingFormat,
  updateAgePreference,
} from "@/app/actions/update-teacher-preferences";
import { addAddress } from "@/app/actions/add-address";
import { linkUserToAddress, unlinkUserFromAddress } from "@/app/actions/link-user-address";

interface PreferencesFormProps {
  preferences: {
    user: {
      preferredTimezone: string | null;
    };
    teacher?: {
      acceptingStudents: boolean;
      teachingFormat: "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE";
      agePreference: "ALL_AGES" | "13+" | "ADULTS_ONLY";
    };
    addresses: Array<{
      id: string;
      address: any;
      addressFormatted: string;
    }>;
  };
  role?: string;
  currentTimezone?: string;
}

interface AddressFormData {
  streetAddress?: string;
  aptUnit?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  [key: string]: string | undefined;
}

export default function PreferencesForm({
  preferences,
  role,
  currentTimezone,
}: PreferencesFormProps) {
  const router = useRouter();
  const isTeacher = role === "TEACHER";

  // Timezone state - initialize with saved preference, set browser timezone on client only
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    const tz = preferences.user.preferredTimezone || currentTimezone || "UTC";
    return { value: tz, label: tz };
  });
  const [isClient, setIsClient] = useState(false);

  // Set browser timezone on client mount if no preference is saved
  useEffect(() => {
    setIsClient(true);
    if (!preferences.user.preferredTimezone && !currentTimezone) {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setSelectedTimezone({ value: browserTimezone, label: browserTimezone });
    }
  }, [preferences.user.preferredTimezone, currentTimezone]);

  // Teacher preferences state
  const [acceptingStudents, setAcceptingStudents] = useState(
    preferences.teacher?.acceptingStudents || false
  );
  const [teachingFormat, setTeachingFormat] = useState<
    "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE"
  >(preferences.teacher?.teachingFormat || "ONLINE_ONLY");
  const [agePreference, setAgePreference] = useState<"ALL_AGES" | "13+" | "ADULTS_ONLY">(
    preferences.teacher?.agePreference || "ALL_AGES"
  );

  // Address states
  const [teacherAddresses, setTeacherAddresses] = useState<
    Array<{ id: string; data: AddressFormData; saved: boolean }>
  >(
    preferences.addresses.map((addr) => ({
      id: addr.id,
      data: addr.address as AddressFormData,
      saved: true,
    }))
  );
  const [studentAddress, setStudentAddress] = useState<AddressFormData | null>(
    preferences.addresses.length > 0
      ? (preferences.addresses[0].address as AddressFormData)
      : null
  );
  const [studentAddressId, setStudentAddressId] = useState<string | null>(
    preferences.addresses.length > 0 ? preferences.addresses[0].id : null
  );

  const [newAddressForm, setNewAddressForm] = useState<AddressFormData>({
    streetAddress: "",
    aptUnit: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });

  const [studentAddressForm, setStudentAddressForm] = useState<AddressFormData>({
    streetAddress: studentAddress?.streetAddress || "",
    aptUnit: studentAddress?.aptUnit || "",
    city: studentAddress?.city || "",
    state: studentAddress?.state || "",
    postalCode: studentAddress?.postalCode || "",
    country: studentAddress?.country || "United States",
  });

  // State for showing/hiding the add address form (teachers only)
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // State for editing student/parent address
  const [isEditingStudentAddress, setIsEditingStudentAddress] = useState(false);

  // Save timezone
  const handleSaveTimezone = async () => {
    const result = await updatePreferredTimezone(selectedTimezone.value);
    if (result.error) {
      alert("Failed to update timezone");
    } else {
      router.refresh();
    }
  };

  // Save teacher preferences
  const handleSaveAcceptingStudents = async (checked: boolean) => {
    setAcceptingStudents(checked);
    const result = await updateAcceptingStudents(checked);
    if (result.error) {
      alert("Failed to update accepting students");
      setAcceptingStudents(!checked);
    }
  };

  const handleSaveTeachingFormat = async (value: "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE") => {
    setTeachingFormat(value);
    const result = await updateTeachingFormat(value);
    if (result.error) {
      alert("Failed to update teaching format");
    }
  };

  const handleSaveAgePreference = async (value: "ALL_AGES" | "13+" | "ADULTS_ONLY") => {
    setAgePreference(value);
    const result = await updateAgePreference(value);
    if (result.error) {
      alert("Failed to update age preference");
    }
  };

  // Add teacher address
  const handleAddTeacherAddress = async () => {
    const result = await addAddress(newAddressForm);
    if (result.error) {
      alert("Failed to add address");
      return;
    }

    // Link address to user
    if (result.addressId) {
      const linkResult = await linkUserToAddress(result.addressId);
      if (linkResult.error) {
        alert("Failed to link address");
        return;
      }

      // Add to local state
      setTeacherAddresses([
        ...teacherAddresses,
        {
          id: result.addressId,
          data: { ...newAddressForm },
          saved: true,
        },
      ]);

      // Reset form and hide it
      setNewAddressForm({
        streetAddress: "",
        aptUnit: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      });
      setShowAddAddressForm(false);

      router.refresh();
    }
  };

  // Remove teacher address
  const handleRemoveTeacherAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to remove this address?")) {
      return;
    }

    const result = await unlinkUserFromAddress(addressId);
    if (result.error) {
      alert("Failed to remove address");
      return;
    }

    setTeacherAddresses(teacherAddresses.filter((addr) => addr.id !== addressId));
    router.refresh();
  };

  // Save student/parent address
  const handleSaveStudentAddress = async () => {
    const result = await addAddress(studentAddressForm);
    if (result.error) {
      alert("Failed to save address");
      return;
    }

    if (result.addressId) {
      // If there was a previous address, unlink it
      if (studentAddressId) {
        await unlinkUserFromAddress(studentAddressId);
      }

      // Link new address
      const linkResult = await linkUserToAddress(result.addressId);
      if (linkResult.error) {
        alert("Failed to link address");
        return;
      }

      setStudentAddressId(result.addressId);
      setStudentAddress({ ...studentAddressForm });
      setIsEditingStudentAddress(false);
      router.refresh();
    }
  };

  // Remove student/parent address
  const handleRemoveStudentAddress = async () => {
    if (!studentAddressId) return;

    if (!confirm("Are you sure you want to remove your address?")) {
      return;
    }

    const result = await unlinkUserFromAddress(studentAddressId);
    if (result.error) {
      alert("Failed to remove address");
      return;
    }

    setStudentAddress(null);
    setStudentAddressId(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Timezone Selector - All Users */}
      <Card>
        <CardHeader>
          <CardTitle>Preferred Timezone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Select your timezone</Label>
            {isClient ? (
              <TimezoneSelect
                value={selectedTimezone}
                onChange={(tz) => setSelectedTimezone(tz as { value: string; label: string })}
                className="w-full"
              />
            ) : (
              <div className="w-full p-2 border border-border rounded-md text-sm text-muted-foreground">
                {selectedTimezone.label || "Loading..."}
              </div>
            )}
          </div>
          <Button onClick={handleSaveTimezone} disabled={!isClient}>
            Save Timezone
          </Button>
        </CardContent>
      </Card>

      {isTeacher ? (
        <>
          {/* Teacher Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Teaching Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Accepting Students */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accepting-students"
                  checked={acceptingStudents}
                  onCheckedChange={handleSaveAcceptingStudents}
                />
                <Label htmlFor="accepting-students" className="cursor-pointer">
                  I am accepting new students
                </Label>
              </div>

              {/* Teaching Format */}
              <div className="space-y-3">
                <Label>Teaching Format</Label>
                <RadioGroup value={teachingFormat} onValueChange={handleSaveTeachingFormat}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ONLINE_ONLY" id="online-only" />
                    <Label htmlFor="online-only" className="cursor-pointer">
                      Online Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IN_PERSON_ONLY" id="in-person-only" />
                    <Label htmlFor="in-person-only" className="cursor-pointer">
                      In-Person Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="IN_PERSON_AND_ONLINE" id="both" />
                    <Label htmlFor="both" className="cursor-pointer">
                      Both In-Person and Online
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Age Preference */}
              <div className="space-y-3">
                <Label>Preferred Student Age</Label>
                <RadioGroup value={agePreference} onValueChange={handleSaveAgePreference}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALL_AGES" id="all-ages" />
                    <Label htmlFor="all-ages" className="cursor-pointer">
                      All Ages
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="13+" id="thirteen-plus" />
                    <Label htmlFor="thirteen-plus" className="cursor-pointer">
                      13+
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ADULTS_ONLY" id="adults-only" />
                    <Label htmlFor="adults-only" className="cursor-pointer">
                      Adults Only
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

            {/* Teacher Addresses */}
            <Card>
              <CardHeader>
                <CardTitle>Addresses</CardTitle>
                <CardDescription>
                  Your addresses are kept private but are required for in-person teachers to be
                  searchable by potential students. You can add multiple addresses. Addresses are currently limited to the United States.
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing Addresses */}
              {teacherAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="border border-border rounded-lg p-4 space-y-2"
                >
                  <div className="text-sm text-muted-foreground">
                    {addr.data.streetAddress}
                    {addr.data.aptUnit && `, ${addr.data.aptUnit}`}
                    {addr.data.city && `, ${addr.data.city}`}
                    {addr.data.state && `, ${addr.data.state}`}
                    {addr.data.postalCode && ` ${addr.data.postalCode}`}
                    {addr.data.country && `, ${addr.data.country}`}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveTeacherAddress(addr.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {/* Add Address Button - Only shown when form is hidden */}
              {!showAddAddressForm && (
                <button
                  onClick={() => setShowAddAddressForm(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Image
                    src="/svg/add_button.svg"
                    alt="Add"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                  <span>Add Address</span>
                </button>
              )}

              {/* Add New Address Form - Only shown when showAddAddressForm is true */}
              {showAddAddressForm && (
                <div className="border border-border rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Add New Address</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddAddressForm(false);
                        // Reset form when canceling
                        setNewAddressForm({
                          streetAddress: "",
                          aptUnit: "",
                          city: "",
                          state: "",
                          postalCode: "",
                          country: "United States",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Addresses are currently limited to the United States.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="street-address">Street Address</Label>
                      <Input
                        id="street-address"
                        value={newAddressForm.streetAddress}
                        onChange={(e) =>
                          setNewAddressForm({ ...newAddressForm, streetAddress: e.target.value })
                        }
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apt-unit">Apt/Unit (Optional)</Label>
                      <Input
                        id="apt-unit"
                        value={newAddressForm.aptUnit}
                        onChange={(e) =>
                          setNewAddressForm({ ...newAddressForm, aptUnit: e.target.value })
                        }
                        placeholder="Apt 4B"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={newAddressForm.city}
                          onChange={(e) =>
                            setNewAddressForm({ ...newAddressForm, city: e.target.value })
                          }
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <StateSelect
                          id="state"
                          value={newAddressForm.state}
                          onChange={(value) =>
                            setNewAddressForm({ ...newAddressForm, state: value })
                          }
                          placeholder="Select state..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal-code">ZIP Code</Label>
                      <Input
                        id="postal-code"
                        value={newAddressForm.postalCode}
                        onChange={(e) =>
                          setNewAddressForm({ ...newAddressForm, postalCode: e.target.value })
                        }
                        placeholder="12345"
                      />
                    </div>
                    <Input
                      type="hidden"
                      value="United States"
                      onChange={() => {}}
                    />
                    <Button onClick={handleAddTeacherAddress}>Save Address</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Student/Parent Address */
        <Card>
          <CardHeader>
            <CardTitle>Address (Optional)</CardTitle>
            <CardDescription>
              Your address is kept private. This is optional for students and parents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {studentAddress && !isEditingStudentAddress ? (
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="text-sm text-muted-foreground">
                  {studentAddress.streetAddress}
                  {studentAddress.aptUnit && `, ${studentAddress.aptUnit}`}
                  {studentAddress.city && `, ${studentAddress.city}`}
                  {studentAddress.state && `, ${studentAddress.state}`}
                  {studentAddress.postalCode && ` ${studentAddress.postalCode}`}
                  {studentAddress.country && `, ${studentAddress.country}`}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => {
                    setIsEditingStudentAddress(true);
                    setStudentAddressForm({
                      streetAddress: studentAddress.streetAddress || "",
                      aptUnit: studentAddress.aptUnit || "",
                      city: studentAddress.city || "",
                      state: studentAddress.state || "",
                      postalCode: studentAddress.postalCode || "",
                      country: studentAddress.country || "",
                    });
                  }}>
                    Edit Address
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleRemoveStudentAddress}>
                    Remove Address
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Addresses are currently limited to the United States.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="student-street-address">Street Address</Label>
                  <Input
                    id="student-street-address"
                    value={studentAddressForm.streetAddress}
                    onChange={(e) =>
                      setStudentAddressForm({
                        ...studentAddressForm,
                        streetAddress: e.target.value,
                      })
                    }
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-apt-unit">Apt/Unit (Optional)</Label>
                  <Input
                    id="student-apt-unit"
                    value={studentAddressForm.aptUnit}
                    onChange={(e) =>
                      setStudentAddressForm({
                        ...studentAddressForm,
                        aptUnit: e.target.value,
                      })
                    }
                    placeholder="Apt 4B"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-city">City</Label>
                    <Input
                      id="student-city"
                      value={studentAddressForm.city}
                      onChange={(e) =>
                        setStudentAddressForm({
                          ...studentAddressForm,
                          city: e.target.value,
                        })
                      }
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-state">State</Label>
                    <StateSelect
                      id="student-state"
                      value={studentAddressForm.state}
                      onChange={(value) =>
                        setStudentAddressForm({
                          ...studentAddressForm,
                          state: value,
                        })
                      }
                      placeholder="Select state..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-postal-code">ZIP Code</Label>
                  <Input
                    id="student-postal-code"
                    value={studentAddressForm.postalCode}
                    onChange={(e) =>
                      setStudentAddressForm({
                        ...studentAddressForm,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="12345"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveStudentAddress}>
                    {studentAddress ? "Update Address" : "Save Address"}
                  </Button>
                  {studentAddress && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingStudentAddress(false);
                        // Reset form to saved address
                        setStudentAddressForm({
                          streetAddress: studentAddress.streetAddress || "",
                          aptUnit: studentAddress.aptUnit || "",
                          city: studentAddress.city || "",
                          state: studentAddress.state || "",
                          postalCode: studentAddress.postalCode || "",
                          country: studentAddress.country || "United States",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
