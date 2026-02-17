import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CheckboxTask,
  YesNoTask,
  ShortEntryTask,
  FreeResponseTask,
  PhotoTask,
  SignatureTask,
  MultipleChoiceTask,
  EmployeeTask,
  HeaderTask,
} from "./ChecklistTaskComponents";

export interface ChecklistItemData {
  id: string;
  task_description: string;
  task_type: string;
  time_hint?: string;
  category?: string;
  color?: string;
  is_high_priority?: boolean;
  required?: boolean;
  sort_order: number;
  label_spanish?: string | null;
}

interface MobileChecklistItemProps {
  item: ChecklistItemData;
  isCompleted: boolean;
  completionValue?: string | null;
  onToggle?: () => void;
  onUpdate?: (value: string) => void;
  disabled?: boolean;
}

export function MobileChecklistItem({
  item,
  isCompleted,
  completionValue,
  onToggle,
  onUpdate,
  disabled,
}: MobileChecklistItemProps) {
  const { t } = useLanguage();
  
  // Get translated task label
  const taskLabel = t(item.task_description, item.label_spanish);
  
  // Header type is non-interactive
  if (item.task_type === "header") {
    return (
      <div className="py-3 border-b">
        <HeaderTask>{taskLabel}</HeaderTask>
      </div>
    );
  }

  // Render appropriate task component based on task_type
  const renderTaskComponent = () => {
    const props = {
      itemId: item.id,
      isCompleted,
      completionValue,
      onToggle,
      onUpdate,
      disabled,
    };

    switch (item.task_type) {
      case "checkbox":
        return <CheckboxTask {...props} />;
      case "yes_no":
        return <YesNoTask {...props} />;
      case "short_entry":
        return <ShortEntryTask {...props} />;
      case "free_response":
        return <FreeResponseTask {...props} />;
      case "photo":
        return <PhotoTask {...props} />;
      case "signature":
        return <SignatureTask {...props} />;
      case "multiple_choice":
        return <MultipleChoiceTask {...props} />;
      case "employee":
        return <EmployeeTask {...props} />;
      default:
        return <CheckboxTask {...props} />;
    }
  };

  // Determine color class based on item color
  const getColorClass = () => {
    if (!item.color) return "";
    
    const colorMap: Record<string, string> = {
      red: "border-l-add-crimson bg-add-crimson/25",
      orange: "border-l-add-amber bg-add-amber/25",
      yellow: "border-l-yellow-500 bg-yellow-500/25",
      green: "border-l-green-500 bg-green-500/25",
      blue: "border-l-add-skyBlue bg-add-skyBlue/25",
      purple: "border-l-purple-500 bg-purple-500/25",
      gray: "border-l-gray-500 bg-gray-500/25",
      teal: "border-l-add-olive bg-add-olive/25",
      pink: "border-l-add-burntOrange bg-add-burntOrange/25",
    };
    
    return colorMap[item.color] || "";
  };

  return (
    <div
      className={cn(
        "p-4 border-b border-l-4 transition-all",
        "hover:bg-muted/50",
        "touch-manipulation", // Optimize for touch devices
        getColorClass(),
        isCompleted && "bg-muted/30 opacity-75"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Task component (checkbox, photo button, etc.) */}
        <div className="flex-shrink-0 pt-1">
          {renderTaskComponent()}
        </div>

        {/* Task description and metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <p
              className={cn(
                "text-sm flex-1",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {taskLabel}
            </p>
            
            {/* Priority indicator */}
            {item.is_high_priority && (
              <Badge variant="destructive" className="flex-shrink-0">
                <AlertCircle className="h-3 w-3 mr-1" />
                Priority
              </Badge>
            )}
            
            {/* Required indicator */}
            {item.required && (
              <Badge variant="secondary" className="flex-shrink-0">
                Required
              </Badge>
            )}
          </div>

          {/* Category badge */}
          {item.category && (
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          )}

          {/* For non-checkbox tasks, show completion value if present */}
          {item.task_type !== "checkbox" &&
            item.task_type !== "yes_no" &&
            item.task_type !== "photo" &&
            item.task_type !== "signature" &&
            item.task_type !== "header" &&
            completionValue && (
              <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                {completionValue}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
