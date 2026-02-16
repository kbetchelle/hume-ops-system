import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AppRole } from "@/types/roles";

interface RoleAssignmentCheckboxesProps {
  value: AppRole[];
  onChange: (roles: AppRole[]) => void;
  disabled?: boolean;
}

const BOH_ROLES: AppRole[] = ["female_spa_attendant", "male_spa_attendant", "floater"];

export function RoleAssignmentCheckboxes({
  value = [],
  onChange,
  disabled = false,
}: RoleAssignmentCheckboxesProps) {
  const isActive = BOH_ROLES.every((role) => value.includes(role));

  const toggle = () => {
    if (isActive) {
      onChange(value.filter((r) => !BOH_ROLES.includes(r)));
    } else {
      const newRoles = [...value];
      BOH_ROLES.forEach((role) => {
        if (!newRoles.includes(role)) newRoles.push(role);
      });
      onChange(newRoles);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant={isActive ? "default" : "outline"}
          size="sm"
          className="rounded-none text-xs h-7"
          onClick={toggle}
          disabled={disabled}
        >
          Back of House
        </Button>
        
      </div>
    </div>
  );
}
