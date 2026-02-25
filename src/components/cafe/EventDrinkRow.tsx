import React, { useState, useRef, useCallback } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  ChevronDown,
  Flag,
  AlertTriangle,
  Upload,
  FileText,
  Archive,
  ArchiveRestore,
  Save,
  X,
  Plus,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type EventDrink,
  hasMenuWarning,
  useEventDrinkMutations,
  useCafeStaffNames,
  getEmailThreadSignedUrl,
} from "@/hooks/useEventDrinks";
import { toast } from "sonner";
import { getPSTToday } from "@/lib/dateUtils";

interface EventDrinkRowProps {
  drink: EventDrink;
  isArchived: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayStr(): string {
  return getPSTToday();
}

function firstLine(text: string | null): string {
  if (!text) return "";
  const line = text.split("\n")[0];
  return line.length > 60 ? line.slice(0, 57) + "..." : line;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EventDrinkRow({ drink, isArchived }: EventDrinkRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { updateEventDrink, archiveEventDrink, restoreEventDrink, uploadEmailThread } =
    useEventDrinkMutations();

  const menuWarning = hasMenuWarning(drink);

  const save = useCallback(
    (updates: Record<string, unknown>) => {
      updateEventDrink.mutate({ id: drink.id, ...updates } as any);
    },
    [drink.id, updateEventDrink]
  );

  return (
    <React.Fragment>
      {/* Main row */}
      <TableRow
        className={cn(
          "group",
          menuWarning && "bg-amber-50 dark:bg-amber-950/20"
        )}
      >
        {/* Expand */}
        <TableCell className="p-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>

        {/* Flags */}
        <TableCell className="p-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => save({ needs_followup: !drink.needs_followup })}
              title={drink.needs_followup ? "Remove follow-up flag" : "Flag for follow-up"}
            >
              <Flag
                className={cn(
                  "h-4 w-4",
                  drink.needs_followup ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                )}
              />
            </Button>
            {menuWarning && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
          </div>
        </TableCell>

        {/* Event Name */}
        <TableCell className="p-1">
          <InlineTextInput
            value={drink.event_name ?? ""}
            placeholder="Event name"
            onSave={(v) => save({ event_name: v || null })}
          />
        </TableCell>

        {/* Event Type */}
        <TableCell className="p-1">
          <EventTypeCell drink={drink} onSave={save} />
        </TableCell>

        {/* Drink Name */}
        <TableCell className="p-1">
          <InlineTextInput
            value={drink.drink_name}
            placeholder="Drink name *"
            onSave={(v) => save({ drink_name: v })}
          />
        </TableCell>

        {/* Event Date */}
        <TableCell className="p-1">
          <DatePickerCell
            value={drink.event_date}
            onChange={(d) => save({ event_date: d })}
          />
        </TableCell>

        {/* Staff */}
        <TableCell className="p-1">
          <StaffCell staff={drink.staff ?? []} onSave={(s) => save({ staff: s })} />
        </TableCell>

        {/* Supplies Ordered */}
        <TableCell className="p-1">
          <CheckboxDateCell
            checked={drink.supplies_ordered}
            dateValue={drink.supplies_ordered_at}
            onToggle={(checked) => {
              const updates: Record<string, unknown> = { supplies_ordered: checked };
              if (checked && !drink.supplies_ordered_at) {
                updates.supplies_ordered_at = todayStr();
              }
              save(updates);
            }}
            onDateChange={(d) => save({ supplies_ordered_at: d })}
          />
        </TableCell>

        {/* Photoshoot */}
        <TableCell className="p-1">
          <TriStateDateCell
            value={drink.photoshoot}
            dateValue={drink.photoshoot_at}
            onValueChange={(v) => save({ photoshoot: v })}
            onDateChange={(d) => save({ photoshoot_at: d })}
          />
        </TableCell>

        {/* Menu Printed */}
        <TableCell className="p-1">
          <TriStateDateCell
            value={drink.menu_printed}
            dateValue={drink.menu_printed_at}
            onValueChange={(v) => save({ menu_printed: v })}
            onDateChange={(d) => save({ menu_printed_at: d })}
          />
        </TableCell>

        {/* Staff Notified */}
        <TableCell className="p-1">
          <CheckboxDateCell
            checked={drink.staff_notified}
            dateValue={drink.staff_notified_at}
            onToggle={(checked) => {
              const updates: Record<string, unknown> = { staff_notified: checked };
              if (checked && !drink.staff_notified_at) {
                updates.staff_notified_at = todayStr();
              }
              save(updates);
            }}
            onDateChange={(d) => save({ staff_notified_at: d })}
          />
        </TableCell>

        {/* Email Thread */}
        <TableCell className="p-1">
          <EmailThreadCell drink={drink} onUpload={uploadEmailThread} />
        </TableCell>

        {/* Archive / Restore */}
        <TableCell className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              if (isArchived) {
                restoreEventDrink.mutate(drink.id);
                toast.success("Restored");
              } else {
                archiveEventDrink.mutate(drink.id);
                toast.success("Archived");
              }
            }}
            title={isArchived ? "Restore" : "Archive"}
          >
            {isArchived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>

      {/* Expanded detail row */}
      {expanded && (
        <TableRow>
          <TableCell colSpan={13} className="bg-muted/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CollapsibleTextSection
                label="Recipe"
                value={drink.recipe}
                onSave={(v) => save({ recipe: v })}
              />
              <CollapsibleTextSection
                label="Food"
                value={drink.food}
                onSave={(v) => save({ food: v })}
              />
              <CollapsibleTextSection
                label="Supplies Needed"
                value={drink.supplies_needed}
                onSave={(v) => save({ supplies_needed: v })}
              />
              <CollapsibleTextSection
                label="Additional Notes"
                value={drink.additional_notes}
                onSave={(v) => save({ additional_notes: v })}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Inline text input that saves on blur */
function InlineTextInput({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const prev = useRef(value);

  // Sync from parent if value changes externally
  if (value !== prev.current) {
    prev.current = value;
    setLocal(value);
  }

  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) {
          onSave(local);
          prev.current = local;
        }
      }}
      placeholder={placeholder}
      className="h-8 rounded-none text-sm border-transparent hover:border-border focus:border-border bg-transparent"
    />
  );
}

/** Event type dropdown + optional custom notes input */
function EventTypeCell({
  drink,
  onSave,
}: {
  drink: EventDrink;
  onSave: (u: Record<string, unknown>) => void;
}) {
  const isOther = drink.event_type === "Other";
  return (
    <div className="space-y-1">
      <Select
        value={drink.event_type ?? "Saturday Social"}
        onValueChange={(v) => onSave({ event_type: v })}
      >
        <SelectTrigger className="h-8 rounded-none text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          <SelectItem value="Saturday Social">Saturday Social</SelectItem>
          <SelectItem value="Private Event">Private Event</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
      {isOther && (
        <InlineTextInput
          value={drink.event_type_notes ?? ""}
          placeholder="Notes..."
          onSave={(v) => onSave({ event_type_notes: v || null })}
        />
      )}
    </div>
  );
}

/** Date picker in a popover */
function DatePickerCell({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (d: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 w-full justify-start rounded-none text-sm font-normal px-2",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {value ? formatDate(value) : "Pick date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-none" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              const iso = d.toISOString().split("T")[0];
              onChange(iso);
            } else {
              onChange(null);
            }
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/** Staff multi-select with chips */
function StaffCell({
  staff,
  onSave,
}: {
  staff: string[];
  onSave: (s: string[]) => void;
}) {
  const { data: cafeStaff } = useCafeStaffNames();
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");

  const available = ((cafeStaff ?? []) as string[]).filter((n) => !staff.includes(n));

  const addName = (name: string) => {
    if (name && !staff.includes(name)) {
      onSave([...staff, name]);
    }
    setCustomName("");
    setShowAdd(false);
  };

  const removeName = (name: string) => {
    onSave(staff.filter((n) => n !== name));
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {staff.map((name) => (
        <Badge key={name} variant="secondary" className="text-xs rounded-none gap-1 pr-1">
          {name}
          <button onClick={() => removeName(name)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {showAdd ? (
        <Popover open onOpenChange={(o) => !o && setShowAdd(false)}>
          <PopoverTrigger asChild>
            <span />
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 rounded-none" align="start">
            <div className="space-y-1">
              {available.map((name) => (
                <Button
                  key={name}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7 rounded-none"
                  onClick={() => addName(name)}
                >
                  {name}
                </Button>
              ))}
              <div className="flex gap-1">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Other name..."
                  className="h-7 text-xs rounded-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customName.trim()) {
                      addName(customName.trim());
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-7 rounded-none text-xs"
                  disabled={!customName.trim()}
                  onClick={() => addName(customName.trim())}
                >
                  Add
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1 text-xs text-muted-foreground rounded-none"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-3 w-3 mr-0.5" />
          Add
        </Button>
      )}
    </div>
  );
}

/** Checkbox with auto-date stamp */
function CheckboxDateCell({
  checked,
  dateValue,
  onToggle,
  onDateChange,
}: {
  checked: boolean;
  dateValue: string | null;
  onToggle: (c: boolean) => void;
  onDateChange: (d: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={(c) => onToggle(!!c)} />
      {checked && (
        <DatePickerCell value={dateValue} onChange={onDateChange} />
      )}
    </div>
  );
}

/** Tri-state select (blank / Yes / NA) with conditional date */
function TriStateDateCell({
  value,
  dateValue,
  onValueChange,
  onDateChange,
}: {
  value: string | null;
  dateValue: string | null;
  onValueChange: (v: string | null) => void;
  onDateChange: (d: string | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Select
        value={value ?? "__blank__"}
        onValueChange={(v) => {
          const newVal = v === "__blank__" ? null : v;
          onValueChange(newVal);
          if (newVal === "Yes" && !dateValue) {
            onDateChange(todayStr());
          }
        }}
      >
        <SelectTrigger className="h-8 rounded-none text-sm">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          <SelectItem value="__blank__">—</SelectItem>
          <SelectItem value="Yes">Yes</SelectItem>
          <SelectItem value="NA">N/A</SelectItem>
        </SelectContent>
      </Select>
      {value === "Yes" && (
        <DatePickerCell value={dateValue} onChange={onDateChange} />
      )}
    </div>
  );
}

/** Email thread upload / view */
function EmailThreadCell({
  drink,
  onUpload,
}: {
  drink: EventDrink;
  onUpload: ReturnType<typeof useEventDrinkMutations>["uploadEmailThread"];
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleView = async () => {
    if (!drink.email_thread_path) return;
    const url = await getEmailThreadSignedUrl(drink.email_thread_path);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Could not load file");
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload.mutate(
      { drinkId: drink.id, file },
      {
        onSuccess: () => toast.success("File uploaded"),
        onError: () => toast.error("Upload failed"),
      }
    );
    // Reset the input
    if (fileRef.current) fileRef.current.value = "";
  };

  if (drink.email_thread_path) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-none text-xs gap-1"
        onClick={handleView}
        title={drink.email_thread_filename ?? "View file"}
      >
        <FileText className="h-4 w-4 text-green-600" />
        View
      </Button>
    );
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.eml,.msg,.txt"
        className="hidden"
        onChange={handleUpload}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-none text-xs gap-1"
        onClick={() => fileRef.current?.click()}
        disabled={onUpload.isPending}
      >
        <Upload className="h-4 w-4" />
        Upload
      </Button>
    </>
  );
}

/** Collapsible text section for the expanded row */
function CollapsibleTextSection({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | null;
  onSave: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [dirty, setDirty] = useState(false);

  const handleSave = () => {
    onSave(draft || null);
    setDirty(false);
    toast.success(`${label} saved`);
  };

  return (
    <div className="border rounded-none">
      <button
        className="w-full flex items-center justify-between p-2 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
        </div>
        {!open && value && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {firstLine(value)}
          </span>
        )}
      </button>
      {open && (
        <div className="p-2 pt-0 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDirty(true);
            }}
            rows={4}
            className="rounded-none text-sm resize-y"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant={dirty ? "default" : "outline"}
              className="rounded-none text-xs gap-1"
              disabled={!dirty}
              onClick={handleSave}
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
