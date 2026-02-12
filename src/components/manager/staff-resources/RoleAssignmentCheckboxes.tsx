import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AppRole } from "@/types/roles";

interface RoleAssignmentCheckboxesProps {
  value: AppRole[];
  onChange: (roles: AppRole[]) => void;
}

const ASSIGNABLE_ROLES: { role: AppRole; label: string }[] = [
  { role: "concierge", label: "Concierge" },
  { role: "female_spa_attendant", label: "Female Spa" },
  { role: "male_spa_attendant", label: "Male Spa" },
  { role: "floater", label: "Floater" },
  { role: "cafe", label: "Cafe" },
  { role: "trainer", label: "Trainer" },
];

export function RoleAssignmentCheckboxes({
  value,
  onChange,
}: RoleAssignmentCheckboxesProps) {
  const toggle = (role: AppRole) => {
    if (value.includes(role)) {
      onChange(value.filter((r) => r !== role));
    } else {
      onChange([...value, role]);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {ASSIGNABLE_ROLES.map(({ role, label }) => (
        <div key={role} className="flex items-center gap-2">
          <Checkbox
            id={`role-${role}`}
            checked={value.includes(role)}
            onCheckedChange={() => toggle(role)}
          />
          <Label
            htmlFor={`role-${role}`}
            className="text-xs uppercase tracking-wider cursor-pointer"
          >
            {label}
          </Label>
        </div>
      ))}
    </div>
  );
}
