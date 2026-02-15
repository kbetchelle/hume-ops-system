import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Package as PackageIcon } from "lucide-react";
import { BarcodeScanner } from "./BarcodeScanner";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { useCheckDuplicatePackage, useSearchUsers } from "@/hooks/usePackages";
import { useCreatePackage } from "@/hooks/usePackageMutations";
import { format } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddPackageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "scan" | "duplicate-check" | "recipient" | "location" | "photo" | "notes";

export function AddPackageDialog({ isOpen, onClose }: AddPackageDialogProps) {
  const [step, setStep] = useState<Step>("scan");
  const [trackingCode, setTrackingCode] = useState("");
  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);

  const { data: duplicatePackage } = useCheckDuplicatePackage(trackingCode);
  const { data: searchResults = [] } = useSearchUsers(userSearchQuery);
  const createPackage = useCreatePackage();

  // When tracking code is scanned, automatically move to duplicate check step
  // This ensures the query has time to update with the new tracking code
  useEffect(() => {
    if (trackingCode && step === "scan") {
      setStep("duplicate-check");
    }
  }, [trackingCode, step]);

  const handleScanSuccess = (code: string) => {
    setTrackingCode(code);
    // The useEffect above will handle moving to duplicate-check step
  };

  const handleDuplicateDecision = (createNew: boolean) => {
    if (createNew) {
      setStep("recipient");
    } else {
      // Close and optionally navigate to the existing package
      handleClose();
    }
  };

  const handleRecipientSelect = (userId: string, fullName: string | null, email: string) => {
    setRecipientUserId(userId);
    setRecipientName(fullName || "");
    setRecipientEmail(email);
    setShowUserSearch(false);
    setStep("location");
  };

  const handleManualRecipientEntry = () => {
    if (recipientName.trim()) {
      setRecipientUserId(null);
      setStep("location");
    }
  };

  const handlePhotoSave = (url: string) => {
    setPhotoUrl(url);
    setShowPhotoUpload(false);
    setStep("notes");
  };

  const handleSubmit = async () => {
    if (!trackingCode || !location || !photoUrl) {
      return;
    }

    try {
      await createPackage.mutateAsync({
        tracking_code: trackingCode,
        recipient_user_id: recipientUserId,
        recipient_name: recipientUserId ? null : recipientName,
        current_location: location,
        location_photo_url: photoUrl,
        notes: notes || undefined,
      });
      
      handleClose();
    } catch (error) {
      console.error("Error creating package:", error);
    }
  };

  const handleClose = () => {
    // Reset all state
    setStep("scan");
    setTrackingCode("");
    setRecipientUserId(null);
    setRecipientName("");
    setRecipientEmail("");
    setLocation("");
    setPhotoUrl("");
    setNotes("");
    setShowPhotoUpload(false);
    setUserSearchQuery("");
    setShowUserSearch(false);
    onClose();
  };

  const handleBack = () => {
    if (step === "duplicate-check") setStep("scan");
    else if (step === "recipient") setStep("scan");
    else if (step === "location") setStep("recipient");
    else if (step === "photo") setStep("location");
    else if (step === "notes") setStep("photo");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Add New Package
          </DialogTitle>
          <DialogDescription>
            {step === "scan" && "Scan the barcode or enter tracking code manually"}
            {step === "duplicate-check" && "Check for existing package"}
            {step === "recipient" && "Select or enter package recipient"}
            {step === "location" && "Enter package storage location"}
            {step === "photo" && "Take a photo of the package location"}
            {step === "notes" && "Add optional notes (final step)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step !== "scan" && step !== "duplicate-check" && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          {step === "scan" && (
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onCancel={handleClose}
            />
          )}

          {step === "duplicate-check" && (
            <div className="space-y-4">
              {duplicatePackage ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Duplicate Package Found</p>
                    <p className="text-sm mb-2">
                      A package with tracking code <span className="font-mono">{trackingCode}</span> already exists
                      with status: <span className="font-semibold">{duplicatePackage.status.replace("_", " ")}</span>
                    </p>
                    <p className="text-sm">Do you want to create a new entry or view the existing one?</p>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    No duplicate found. Tracking code: <span className="font-mono">{trackingCode}</span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {duplicatePackage && (
                  <Button variant="outline" onClick={() => handleDuplicateDecision(false)} className="flex-1">
                    View Existing
                  </Button>
                )}
                <Button onClick={() => handleDuplicateDecision(true)} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === "recipient" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search for Recipient (User)</Label>
                <Popover open={showUserSearch} onOpenChange={setShowUserSearch}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {recipientEmail || "Select recipient..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search by name or email..." 
                        value={userSearchQuery}
                        onValueChange={setUserSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {searchResults.map((user) => (
                            <CommandItem
                              key={user.user_id}
                              onSelect={() => handleRecipientSelect(user.user_id, user.full_name, user.email)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  recipientUserId === user.user_id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{user.full_name || "No name"}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-recipient">Recipient Name (Non-User)</Label>
                <Input
                  id="manual-recipient"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Enter recipient name"
                />
              </div>

              <Button 
                onClick={handleManualRecipientEntry} 
                className="w-full"
                disabled={!recipientName.trim() && !recipientUserId}
              >
                Continue
              </Button>
            </div>
          )}

          {step === "location" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Package Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Front Desk, Mailroom, Storage Room"
                  required
                />
              </div>

              <Button 
                onClick={() => setStep("photo")} 
                className="w-full"
                disabled={!location.trim()}
              >
                Continue to Photo
              </Button>
            </div>
          )}

          {step === "photo" && (
            <div className="space-y-4">
              {!photoUrl ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      A photo of the package location is required
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => setShowPhotoUpload(true)} className="w-full">
                    Take Photo
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Location Photo</Label>
                    <img src={photoUrl} alt="Package location" className="w-full rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPhotoUpload(true)} className="flex-1">
                      Retake Photo
                    </Button>
                    <Button onClick={() => setStep("notes")} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === "notes" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this package"
                  rows={4}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p><strong>Tracking Code:</strong> {trackingCode}</p>
                <p><strong>Recipient:</strong> {recipientEmail || recipientName}</p>
                <p><strong>Location:</strong> {location}</p>
                <p><strong>Date:</strong> {format(new Date(), "PPP")}</p>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createPackage.isPending}
              >
                {createPackage.isPending ? "Adding Package..." : "Add Package"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      <PhotoUpload
        isOpen={showPhotoUpload}
        onSave={handlePhotoSave}
        onCancel={() => setShowPhotoUpload(false)}
        storageBucket="package-photos"
        storagePath={`packages/${format(new Date(), "yyyy/MM/dd")}`}
        title="Photo of Package Location"
      />
    </Dialog>
  );
}
