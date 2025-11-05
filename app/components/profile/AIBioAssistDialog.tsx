"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface AIBioAssistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (generatedBio: string) => void;
  teacherName: string;
}

export default function AIBioAssistDialog({
  isOpen,
  onClose,
  onSave,
  teacherName,
}: AIBioAssistDialogProps) {
  const [credentials, setCredentials] = useState("");
  const [generatedBio, setGeneratedBio] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!credentials.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-bio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credentials, teacherName }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate biography");
      }

      const data = await response.json();
      setGeneratedBio(data.biography);
      setHasGenerated(true);
    } catch (error) {
      console.error("Error generating biography:", error);
      // You could add a toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSave(generatedBio);
    handleClose();
  };

  const handleClose = () => {
    setCredentials("");
    setGeneratedBio("");
    setHasGenerated(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              width="20"
              height="20"
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
            AI Biography Assistant
          </DialogTitle>
          <DialogDescription>
            Provide your credentials, experience, and teaching philosophy below.
            Our AI will create a professional, marketable biography for your
            music teacher profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Your Credentials & Experience
            </label>
            <Textarea
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder="Example: Bachelor's degree in Music Education from XYZ University, 10 years teaching piano, certified in Suzuki method, experience with students ages 5-18, believe in making music fun and accessible..."
              rows={6}
              className="w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Include your education, certifications, years of experience,
              instruments you teach, age groups you work with, and your teaching
              philosophy.
            </p>
          </div>

          {hasGenerated && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Generated Biography
              </label>
              <Textarea
                value={generatedBio}
                onChange={(e) => setGeneratedBio(e.target.value)}
                rows={8}
                className="w-full"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can edit the generated biography before saving it to your
                profile.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>

          {!hasGenerated ? (
            <Button
              onClick={handleGenerate}
              disabled={!credentials.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Biography"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!generatedBio.trim() || isGenerating}
            >
              Save Biography
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
