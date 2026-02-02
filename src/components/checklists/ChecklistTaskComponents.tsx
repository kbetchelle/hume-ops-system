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
      className="h-6 w-6"
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

// Photo Task - Camera/upload with thumbnail preview
export function PhotoTask({
  itemId,
  completionValue,
  onUpdate,
  disabled,
}: TaskComponentProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Generate unique completion ID for this photo
      const completionId = crypto.randomUUID();
      
      // Create date-based path structure: checklist/{year}/{month}/{day}/{completion_id}_photo.jpg
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${completionId}_photo.${fileExt}`;
      const filePath = `checklist/${year}/${month}/${day}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("checklist-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("checklist-photos")
        .getPublicUrl(filePath);

      onUpdate?.(data.publicUrl);
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          {uploading ? "Uploading..." : completionValue ? "Retake Photo" : "Take Photo"}
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

// Signature Task - Full signature capture
export function SignatureTask({
  completionValue,
  onUpdate,
  disabled,
}: TaskComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempSignature, setTempSignature] = useState(completionValue || "");

  const handleSave = () => {
    onUpdate?.(tempSignature);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempSignature(completionValue || "");
    setIsEditing(false);
  };

  if (!isEditing && completionValue) {
    return (
      <div className="space-y-2">
        <div className="p-3 border rounded-lg bg-muted/50 font-signature text-lg">
          {completionValue}
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Pen className="h-4 w-4" />
            Update Signature
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={tempSignature}
        onChange={(e) => setTempSignature(e.target.value)}
        placeholder="Enter your full name"
        disabled={disabled}
        className="font-signature text-lg"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!tempSignature.trim() || disabled}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Sign
        </Button>
        {completionValue && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
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
