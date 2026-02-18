import { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload, Pen, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { PhotoUpload } from "@/components/ui/PhotoUpload";

// Common props interface
interface TaskComponentProps {
  itemId: string;
  isCompleted: boolean;
  completionValue?: string | null;
  onToggle?: () => void;
  onUpdate?: (value: string) => void;
  disabled?: boolean;
}

// Checkbox Task - Simple toggle
export function CheckboxTask({ isCompleted, onToggle, disabled }: TaskComponentProps) {
  return (
    <Checkbox
      checked={isCompleted}
      onCheckedChange={onToggle}
      disabled={disabled}
      className="h-[18px] w-[18px]"
    />
  );
}

// Yes/No Toggle Task
export function YesNoTask({ isCompleted, onToggle, disabled }: TaskComponentProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isCompleted}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
      <span className="text-sm font-medium">
        {isCompleted ? "Yes" : "No"}
      </span>
    </div>
  );
}

// Short Entry Task - Single line text input
export function ShortEntryTask({
  completionValue,
  onUpdate,
  disabled,
}: TaskComponentProps) {
  return (
    <Input
      value={completionValue || ""}
      onChange={(e) => onUpdate?.(e.target.value)}
      placeholder="Enter value..."
      disabled={disabled}
      className="max-w-md"
    />
  );
}

// Free Response Task - Multi-line textarea
export function FreeResponseTask({
  completionValue,
  onUpdate,
  disabled,
}: TaskComponentProps) {
  return (
    <Textarea
      value={completionValue || ""}
      onChange={(e) => onUpdate?.(e.target.value)}
      placeholder="Enter your response..."
      disabled={disabled}
      className="min-h-[100px]"
    />
  );
}

// Photo Task - Camera/upload with thumbnail preview and compression
export function PhotoTask({
  itemId,
  completionValue,
  onUpdate,
  disabled,
}: TaskComponentProps) {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Generate date-based storage path
  const getStoragePath = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `checklist/${year}/${month}/${day}`;
  };

  const handlePhotoSave = (photoUrl: string) => {
    onUpdate?.(photoUrl);
    setIsPhotoModalOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Photo capture modal */}
      <PhotoUpload
        isOpen={isPhotoModalOpen}
        onSave={handlePhotoSave}
        onCancel={() => setIsPhotoModalOpen(false)}
        storagePath={getStoragePath()}
        title={completionValue ? "Retake Photo" : "Take Photo"}
      />
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsPhotoModalOpen(true)}
          disabled={disabled}
          className="gap-2 text-[12.75px] p-[5px] min-h-0 min-w-0"
        >
          <Camera className="h-4 w-4" />
          {completionValue ? "Retake Photo" : "Take Photo"}
        </Button>
      </div>

      {completionValue && (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
          <img
            src={completionValue}
            alt="Task photo"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

// Signature Task - Full canvas-based signature capture
export function SignatureTask({
  completionValue,
  onUpdate,
  disabled,
}: TaskComponentProps) {
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const handleSignatureSave = (signatureData: string) => {
    onUpdate?.(signatureData);
    setIsSignatureModalOpen(false);
  };

  // Check if the value is a base64 image (canvas signature) or text (legacy)
  const isImageSignature = completionValue?.startsWith("data:image/");

  return (
    <div className="space-y-2">
      {/* Signature pad modal */}
      <SignaturePad
        isOpen={isSignatureModalOpen}
        onSave={handleSignatureSave}
        onCancel={() => setIsSignatureModalOpen(false)}
        title={completionValue ? "Update Signature" : "Sign Below"}
      />

      {/* Show existing signature */}
      {completionValue && (
        <div className="space-y-2">
          {isImageSignature ? (
            <div className="p-2 border rounded-lg bg-white inline-block">
              <img
                src={completionValue}
                alt="Signature"
                className="max-h-[100px] w-auto"
              />
            </div>
          ) : (
            <div className="p-3 border rounded-lg bg-muted/50 font-signature text-lg">
              {completionValue}
            </div>
          )}
        </div>
      )}

      {/* Sign/Update button */}
      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsSignatureModalOpen(true)}
          className="gap-2 text-[12.75px] p-[5px] min-h-0 min-w-0"
        >
          <Pen className="h-3 w-3" />
          {completionValue ? "Update Signature" : "Sign"}
        </Button>
      )}
    </div>
  );
}

// Multiple Choice Task - Radio group
export function MultipleChoiceTask({
  completionValue,
  onUpdate,
  disabled,
}: TaskComponentProps & { options?: string[] }) {
  const options = ["Option 1", "Option 2", "Option 3"]; // TODO: Make configurable

  return (
    <RadioGroup
      value={completionValue || ""}
      onValueChange={onUpdate}
      disabled={disabled}
    >
      {options.map((option) => (
        <div key={option} className="flex items-center space-x-2">
          <RadioGroupItem value={option} id={option} />
          <Label htmlFor={option}>{option}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}

// Employee Selector Task - Staff picker
export function EmployeeTask({
  completionValue,
  onUpdate,
  disabled,
}: TaskComponentProps) {
  // TODO: Fetch actual staff list from database
  const employees = ["Staff 1", "Staff 2", "Staff 3"];

  return (
    <Select value={completionValue || ""} onValueChange={onUpdate} disabled={disabled}>
      <SelectTrigger className="max-w-md">
        <SelectValue placeholder="Select staff member..." />
      </SelectTrigger>
      <SelectContent>
        {employees.map((employee) => (
          <SelectItem key={employee} value={employee}>
            {employee}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Header Task - Non-interactive section divider
export function HeaderTask({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-2">
      <h3 className="text-lg font-semibold text-foreground">{children}</h3>
    </div>
  );
}
