import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AppRole } from "@/types/roles";

interface RoleAssignmentCheckboxesProps {
  value: AppRole[];
  onChange: (roles: AppRole[]) => void;
  disabled?: boolean;
}

const ASSIGNABLE_ROLES: { role: AppRole; label: string }[] = [
  { role: "concierge", label: "Concierge" },
  { role: "female_spa_attendant", label: "Female Spa" },
  { role: "male_spa_attendant", label: "Male Spa" },
  { role: "floater", label: "Floater" },
  { role: "cafe", label: "Cafe" },
];

// Role group definitions
const ROLE_GROUPS = {
  all: ASSIGNABLE_ROLES.map((r) => r.role),
  foh: ["concierge"] as AppRole[],
  boh: ["female_spa_attendant", "male_spa_attendant", "floater"] as AppRole[],
  cafe: ["cafe"] as AppRole[],
};

export function RoleAssignmentCheckboxes({
  value = [],
  onChange,
  disabled = false,
}: RoleAssignmentCheckboxesProps) {
  const toggle = (role: AppRole) => {
    if (value.includes(role)) {
      onChange(value.filter((r) => r !== role));
    } else {
      onChange([...value, role]);
    }
  };

  const toggleGroup = (groupRoles: AppRole[]) => {
    // Check if all roles in the group are selected
    const allSelected = groupRoles.every((role) => value.includes(role));

    if (allSelected) {
      // Deselect all roles in the group
      onChange(value.filter((role) => !groupRoles.includes(role)));
    } else {
      // Select all roles in the group
      const newRoles = [...value];
      groupRoles.forEach((role) => {
        if (!newRoles.includes(role)) {
          newRoles.push(role);
        }
      });
      onChange(newRoles);
    }
  };

  const isGroupActive = (groupRoles: AppRole[]) => {
    return groupRoles.every((role) => value.includes(role));
  };

  return (
    <div className="space-y-3">
      {/* Individual role toggles */}
      <div className="flex flex-wrap gap-1">
        {ASSIGNABLE_ROLES.map(({ role, label }) => (
          <Button
            key={role}
            type="button"
            variant={value.includes(role) ? "default" : "outline"}
            size="sm"
            className="rounded-none text-xs h-7"
            onClick={() => toggle(role)}
            disabled={disabled}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Quick group toggles */}
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant={isGroupActive(ROLE_GROUPS.all) ? "default" : "outline"}
          size="sm"
          className="rounded-none text-[10px] h-6"
          onClick={() => toggleGroup(ROLE_GROUPS.all)}
          disabled={disabled}
        >
          All
        </Button>
        <Button
          type="button"
          variant={isGroupActive(ROLE_GROUPS.foh) ? "default" : "outline"}
          size="sm"
          className="rounded-none text-[10px] h-6"
          onClick={() => toggleGroup(ROLE_GROUPS.foh)}
          disabled={disabled}
        >
          FoH
        </Button>
        <Button
          type="button"
          variant={isGroupActive(ROLE_GROUPS.boh) ? "default" : "outline"}
          size="sm"
          className="rounded-none text-[10px] h-6"
          onClick={() => toggleGroup(ROLE_GROUPS.boh)}
          disabled={disabled}
        >
          BoH
        </Button>
        <Button
          type="button"
          variant={isGroupActive(ROLE_GROUPS.cafe) ? "default" : "outline"}
          size="sm"
          className="rounded-none text-[10px] h-6"
          onClick={() => toggleGroup(ROLE_GROUPS.cafe)}
          disabled={disabled}
        >
          Cafe
        </Button>
      </div>
    </div>
  );
}
