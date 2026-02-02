import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { selectFrom } from "@/lib/dataApi";
import { MobileChecklistItem, ChecklistItemData } from "@/components/checklists/MobileChecklistItem";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ChecklistTemplate {
  id: string;
  name: string;
  role: string;
  shift_type: string;
  is_active: boolean;
  created_at: string;
}

const TEMPLATE_ROLES: { value: string; label: string }[] = [
  { value: "concierge", label: "Concierge" },
  { value: "female_spa_attendant", label: "Female Spa Attendant" },
  { value: "male_spa_attendant", label: "Male Spa Attendant" },
  { value: "floater", label: "Floater" },
  { value: "trainer", label: "Trainer" },
];

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "concierge": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "female_spa_attendant": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
    case "male_spa_attendant": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "floater": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "trainer": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    default: return "";
  }
}

function getRoleLabel(role: string): string {
  return TEMPLATE_ROLES.find(r => r.value === role)?.label || role;
}

export function TemplateChecklistManager() {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Fetch all templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["all-checklist-templates", showInactive],
    queryFn: async () => {
      const filters = showInactive ? [] : [{ type: "eq" as const, column: "is_active", value: true }];
      const { data, error } = await selectFrom<ChecklistTemplate>("checklist_templates", {
        filters,
        order: { column: "role", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredTemplates = selectedRole
    ? templates?.filter((t) => t.role === selectedRole)
    : templates;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Checklist Templates</h2>
          <p className="text-xs text-muted-foreground tracking-wide mt-1">
            View and manage checklist templates for all roles
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Role Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedRole === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRole(null)}
            >
              All Roles
            </Button>
            {TEMPLATE_ROLES.map((role) => (
              <Button
                key={role.value}
                variant={selectedRole === role.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRole(role.value)}
                className="gap-2"
              >
                {role.label}
              </Button>
            ))}
          </div>
          
          {/* Show Inactive Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-xs cursor-pointer">
              {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTemplates?.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No templates found{selectedRole ? ` for ${getRoleLabel(selectedRole)}` : ""}.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates?.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isExpanded={expandedTemplate === template.id}
              onToggleExpand={() => setExpandedTemplate(
                expandedTemplate === template.id ? null : template.id
              )}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: ChecklistTemplate;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function TemplateCard({ template, isExpanded, onToggleExpand }: TemplateCardProps) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["checklist-template-items", template.id],
    queryFn: async () => {
      const { data, error } = await selectFrom<ChecklistItemData>("checklist_template_items", {
        filters: [{ type: "eq", column: "template_id", value: template.id }],
        order: { column: "sort_order", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: isExpanded,
  });

  return (
    <Card className="border border-border">
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="flex items-center gap-3 text-base">
                {template.name}
                <Badge variant="outline" className={getRoleBadgeColor(template.role)}>
                  {getRoleLabel(template.role)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.shift_type}
                </Badge>
                {!template.is_active && (
                  <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                    Inactive
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                {items?.length || 0} tasks
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-4 border-t">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items?.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No tasks configured for this template.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {items?.map((item) => (
                <MobileChecklistItem
                  key={item.id}
                  item={item}
                  isCompleted={false}
                  disabled={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
