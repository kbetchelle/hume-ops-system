import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { useEventDrinks } from "@/hooks/useEventDrinks";
import { EventDrinkRow } from "./EventDrinkRow";
import { AddEventDrinkDialog } from "./AddEventDrinkDialog";

export function EventDrinksView() {
  const [isArchived, setIsArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: drinks, isLoading } = useEventDrinks(isArchived);

  const filtered = (drinks ?? []).filter((d) =>
    d.drink_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drinks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Active / Archived toggle */}
          <div className="flex gap-1">
            <Button
              variant={!isArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setIsArchived(false)}
              className="rounded-none text-xs uppercase tracking-wider"
            >
              Active
            </Button>
            <Button
              variant={isArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setIsArchived(true)}
              className="rounded-none text-xs uppercase tracking-wider"
            >
              Archived
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="rounded-none text-xs uppercase tracking-wider"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Event Drink
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {search
            ? "No drinks match your search."
            : isArchived
            ? "No archived event drinks."
            : "No active event drinks. Click \"Add Event Drink\" to get started."}
        </div>
      ) : (
        <div className="border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" /> {/* Expand */}
                <TableHead className="w-16">Flags</TableHead>
                <TableHead className="min-w-[140px]">Event Name</TableHead>
                <TableHead className="min-w-[150px]">Event Type</TableHead>
                <TableHead className="min-w-[140px]">Drink Name</TableHead>
                <TableHead className="min-w-[120px]">Event Date</TableHead>
                <TableHead className="min-w-[180px]">Staff</TableHead>
                <TableHead className="min-w-[130px]">Supplies</TableHead>
                <TableHead className="min-w-[110px]">Photoshoot</TableHead>
                <TableHead className="min-w-[120px]">Menu Printed</TableHead>
                <TableHead className="min-w-[120px]">Staff Notified</TableHead>
                <TableHead className="min-w-[100px]">Email</TableHead>
                <TableHead className="w-10" /> {/* Archive */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((drink) => (
                <EventDrinkRow
                  key={drink.id}
                  drink={drink}
                  isArchived={isArchived}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddEventDrinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
