"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { updateAccountName, updateAccountImage, deleteAccount } from "@/app/actions/manage-account";

interface ManageAccountContentProps {
  user: {
    id: string;
    clerkId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: "TEACHER" | "STUDENT" | "PARENT" | null;
    imageUrl: string | null;
  };
  clerkUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    primaryEmail: string;
    imageUrl: string;
  };
}

export default function ManageAccountContent({ user, clerkUser }: ManageAccountContentProps) {
  const router = useRouter();
  const { user: currentClerkUser } = useUser();

  // Name editing state
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Image upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Delete account state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSaveName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter both first and last name");
      return;
    }

    setIsSavingName(true);
    try {
      const result = await updateAccountName(firstName, lastName);
      if (result.error) {
        alert(result.error);
      } else {
        setIsEditingName(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving name:", error);
      alert("Failed to save name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelName = () => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setIsEditingName(false);
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
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size < minSize) {
      alert("Image file is too small. Please select a valid image file.");
      return;
    }
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB. Please compress the image or choose a smaller file.");
      return;
    }

    if (!currentClerkUser) {
      alert("User not loaded");
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload image to Clerk using setProfileImage
      await currentClerkUser.setProfileImage({ file });

      // Get the updated image URL from Clerk
      await currentClerkUser.reload();
      const imageUrl = currentClerkUser.imageUrl;

      if (!imageUrl) {
        throw new Error("Failed to get image URL from Clerk");
      }

      // Update database with new image URL
      const result = await updateAccountImage(imageUrl);
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

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount();
      if (result.error) {
        alert(result.error);
      } else {
        // Redirect to home page after successful deletion
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const displayFirstName = firstName || clerkUser.firstName || "";
  const displayLastName = lastName || clerkUser.lastName || "";
  const displayImageUrl = user.imageUrl || clerkUser.imageUrl || "/images/profile/default_user.png";

  return (
    <div className="space-y-8">
      {/* Profile Picture Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg group">
              <Image
                src={displayImageUrl}
                alt={[displayFirstName, displayLastName].filter(Boolean).join(" ") || "User"}
                fill
                className="object-cover"
                sizes="96px"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={handleUploadClick}
                  disabled={isUploadingImage}
                  className="bg-background/90 hover:bg-background px-2 py-1 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50 text-xs"
                >
                  <Image
                    src="/svg/upload_button.svg"
                    alt="Upload"
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                  <span className="font-medium text-foreground">
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
            <div>
              <p className="text-sm text-muted-foreground">
                Click on your profile picture to upload a new one.
                Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            {isEditingName ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSavingName}
                  />
                  <Input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSavingName}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    size="sm"
                  >
                    {isSavingName ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelName}
                    disabled={isSavingName}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group relative">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <span className="text-foreground">
                    {[displayFirstName, displayLastName].filter(Boolean).join(" ") || "Not set"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="p-3 border rounded-lg bg-muted/30">
              <span className="text-foreground">{user.email}</span>
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed from this page. Please contact support if you need to update your email.
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Account Type</label>
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-foreground capitalize font-medium">
                  {user.role?.toLowerCase() || "Not set"}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Cannot be changed
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your account type is permanent and cannot be modified. Contact support if you need assistance with account type changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. This action cannot be undone.
                All your data will be permanently removed from our servers.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeletingAccount}>
                    {isDeletingAccount ? "Deleting..." : "Delete Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers. You will be immediately signed out
                      and will not be able to recover your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
