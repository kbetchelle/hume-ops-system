import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Department groups that map to app_role values
export const DEPARTMENT_GROUPS = {
  concierge: { label: "All Concierge", roles: ["concierge"] },
  female_spa: { label: "All Female Spa", roles: ["female_spa_attendant"] },
  male_spa: { label: "All Male Spa", roles: ["male_spa_attendant"] },
  floaters: { label: "All Floaters", roles: ["floater"] },
  trainers: { label: "All Trainers", roles: ["trainer"] },
  management: { label: "Management", roles: ["manager", "admin"] },
  cafe: { label: "All Cafe", roles: ["cafe"] },
} as const;

export type DepartmentKey = keyof typeof DEPARTMENT_GROUPS;

interface AnnouncementTargetSelectorProps {
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  className?: string;
}

type TargetMode = "everyone" | "by_department";

export function AnnouncementTargetSelector({
  value,
  onChange,
  className,
}: AnnouncementTargetSelectorProps) {
  // Determine initial mode based on value
  const getInitialMode = (): TargetMode => {
    if (!value || value.length === 0) return "everyone";
    return "by_department";
  };

  const [mode, setMode] = useState<TargetMode>(getInitialMode);

  // Get selected departments from the value (roles)
  const getSelectedDepartments = (): DepartmentKey[] => {
    if (!value || value.length === 0) return [];
    
    const selected: DepartmentKey[] = [];
    for (const [key, group] of Object.entries(DEPARTMENT_GROUPS)) {
      if (group.roles.some((role) => value.includes(role))) {
        selected.push(key as DepartmentKey);
      }
    }
    return selected;
  };

  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentKey[]>(
    getSelectedDepartments
  );

  const handleModeChange = (newMode: TargetMode) => {
    setMode(newMode);
    if (newMode === "everyone") {
      onChange(null);
      setSelectedDepartments([]);
    }
  };

  const handleDepartmentToggle = (departmentKey: DepartmentKey, checked: boolean) => {
    let newSelected: DepartmentKey[];
    
    if (checked) {
      newSelected = [...selectedDepartments, departmentKey];
    } else {
      newSelected = selectedDepartments.filter((d) => d !== departmentKey);
    }
    
    setSelectedDepartments(newSelected);

    // Convert to roles
    if (newSelected.length === 0) {
      onChange(null);
    } else {
      const roles = newSelected.flatMap((key) => DEPARTMENT_GROUPS[key].roles);
      onChange(roles);
    }
  };

  const getTargetSummary = (): string => {
    if (mode === "everyone" || !value || value.length === 0) {
      return "Everyone";
    }
    
    const deptLabels = selectedDepartments.map((key) => DEPARTMENT_GROUPS[key].label);
    if (deptLabels.length <= 2) {
      return deptLabels.join(", ");
    }
    return `${deptLabels.length} departments selected`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        Target Audience
      </Label>

      <RadioGroup
        value={mode}
        onValueChange={(v) => handleModeChange(v as TargetMode)}
        className="grid grid-cols-2 gap-2"
      >
        <Label
          htmlFor="mode-everyone"
          className={cn(
            "flex items-center gap-2 p-3 border cursor-pointer transition-colors",
            mode === "everyone" && "border-primary bg-primary/5"
          )}
        >
          <RadioGroupItem value="everyone" id="mode-everyone" />
          <Users className="h-4 w-4" />
          <span className="text-sm">Everyone</span>
        </Label>

        <Label
          htmlFor="mode-department"
          className={cn(
            "flex items-center gap-2 p-3 border cursor-pointer transition-colors",
            mode === "by_department" && "border-primary bg-primary/5"
          )}
        >
          <RadioGroupItem value="by_department" id="mode-department" />
          <Building2 className="h-4 w-4" />
          <span className="text-sm">By Department</span>
        </Label>
      </RadioGroup>

      {mode === "by_department" && (
        <div className="space-y-2 p-3 border bg-muted/30">
          <p className="text-xs text-muted-foreground mb-3">
            Select which departments should see this announcement:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(DEPARTMENT_GROUPS).map(([key, group]) => (
              <Label
                key={key}
                className={cn(
                  "flex items-center gap-2 p-2 border cursor-pointer transition-colors text-sm",
                  selectedDepartments.includes(key as DepartmentKey) && "border-primary bg-primary/5"
                )}
              >
                <Checkbox
                  checked={selectedDepartments.includes(key as DepartmentKey)}
                  onCheckedChange={(checked) =>
                    handleDepartmentToggle(key as DepartmentKey, !!checked)
                  }
                />
                {group.label}
              </Label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <UserCheck className="h-3 w-3" />
        <span>Target:</span>
        <Badge variant="secondary" className="font-normal">
          {getTargetSummary()}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Get display label for target departments
 */
// eslint-disable-next-line react-refresh/only-export-components -- Component and getTargetLabel helper exported for use by announcement UI
export function getTargetLabel(targetDepartments: string[] | null): string {
  if (!targetDepartments || targetDepartments.length === 0) {
    return "Everyone";
  }

  const labels: string[] = [];
  for (const [key, group] of Object.entries(DEPARTMENT_GROUPS)) {
    if (group.roles.some((role) => targetDepartments.includes(role))) {
      labels.push(group.label);
    }
  }

  if (labels.length === 0) {
    return `${targetDepartments.length} role(s)`;
  }
  
  if (labels.length <= 2) {
    return labels.join(", ");
  }
  
  return `${labels.length} departments`;
}
