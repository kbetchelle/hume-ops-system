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

const ROLE_BUTTONS: { key: string; label: string; roles: AppRole[] }[] = [
  { key: "concierge", label: "Concierge", roles: ["concierge"] },
  { key: "boh", label: "Back of House", roles: BOH_ROLES },
  { key: "cafe", label: "Cafe", roles: ["cafe"] },
];

export function RoleAssignmentCheckboxes({
  value = [],
  onChange,
  disabled = false,
}: RoleAssignmentCheckboxesProps) {
  const toggleGroup = (roles: AppRole[]) => {
    const allActive = roles.every((r) => value.includes(r));
    if (allActive) {
      onChange(value.filter((r) => !roles.includes(r)));
    } else {
      const newRoles = [...value];
      roles.forEach((role) => {
        if (!newRoles.includes(role)) newRoles.push(role);
      });
      onChange(newRoles);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {ROLE_BUTTONS.map((group) => {
          const isActive = group.roles.every((r) => value.includes(r));
          return (
            <Button
              key={group.key}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="rounded-none text-xs h-7"
              onClick={() => toggleGroup(group.roles)}
              disabled={disabled}
            >
              {group.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
