import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { IdlePageHintPrompt } from "@/components/walkthrough";
import { useIdlePageHint } from "@/hooks/useIdlePageHint";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_HINT_CONTENT } from "@/config/walkthroughSteps";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddPackageDialog } from "@/components/packages/AddPackageDialog";
import { PackageTable } from "@/components/packages/PackageTable";
import { PackageDetailsDialog } from "@/components/packages/PackageDetailsDialog";
import { MovePackageDialog } from "@/components/packages/MovePackageDialog";
import { BulkPackageActions } from "@/components/packages/BulkPackageActions";
import { usePackages, usePackageStats, PackageWithRecipient } from "@/hooks/usePackages";
import { useUpdatePackage } from "@/hooks/usePackageMutations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const HINT_ID = "package-tracking";

export default function PackageTrackingPage() {
  const { t } = useLanguage();
  const hintContent = PAGE_HINT_CONTENT[HINT_ID];
  const { showHint, dismiss, triggerFullWalkthrough } = useIdlePageHint({
    hintId: HINT_ID,
    content: hintContent ? t(hintContent.en, hintContent.es) : "",
  });

  const [activeTab, setActiveTab] = useState<"pending_pickup" | "picked_up">("pending_pickup");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [packageToMove, setPackageToMove] = useState<PackageWithRecipient | null>(null);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const { data: packages = [], isLoading } = usePackages({
    status: activeTab,
    searchQuery,
    location: locationFilter,
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
  });

  const { data: stats } = usePackageStats();
  const updatePackage = useUpdatePackage();

  const handleSelectPackage = (id: string) => {
    setSelectedPackages((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPackages(packages.map((p) => p.id));
    } else {
      setSelectedPackages([]);
    }
  };

  const handleViewDetails = (pkg: PackageWithRecipient) => {
    setSelectedPackageId(pkg.id);
    setIsDetailsOpen(true);
  };

  const handleMovePackage = (pkg: PackageWithRecipient) => {
    setPackageToMove(pkg);
    setIsMoveDialogOpen(true);
  };

  const handleMarkPickedUp = async (pkg: PackageWithRecipient) => {
    await updatePackage.mutateAsync({
      id: pkg.id,
      status: "picked_up",
    });
  };

  const handleBulkMove = () => {
    setPackageToMove(null);
    setIsMoveDialogOpen(true);
  };

  const handleMoveDialogClose = () => {
    setIsMoveDialogOpen(false);
    setPackageToMove(null);
    setSelectedPackages([]);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const activeFiltersCount = [searchQuery, locationFilter, dateFrom, dateTo].filter(Boolean).length;
  const isMobile = useIsMobile();

  const mobileContent = isMobile && (
    <div className="flex flex-col min-h-0 flex-1 p-4 pb-8">
      <div className="sticky top-0 z-10 bg-background border-b pb-3 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tracking code or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-base min-h-[44px] rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="min-h-[44px] flex-1"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="min-h-[44px] min-w-[44px] shrink-0">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Input
              type="date"
              value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""}
              onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
              className="text-base min-h-[44px]"
            />
            <Input
              type="date"
              value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""}
              onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : undefined)}
              className="text-base min-h-[44px]"
            />
            <Input
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="col-span-2 text-base min-h-[44px]"
            />
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="col-span-2">
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
      <Tabs value={activeTab} onValueChange={(v: "pending_pickup" | "picked_up") => { setActiveTab(v); setSelectedPackages([]); }} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 h-12 shrink-0 rounded-xl">
          <TabsTrigger value="pending_pickup" className="rounded-xl">
            Pending {stats && stats.pending > 0 && `(${stats.pending})`}
          </TabsTrigger>
          <TabsTrigger value="picked_up" className="rounded-xl">Picked Up</TabsTrigger>
        </TabsList>
        <TabsContent value="pending_pickup" className="flex-1 min-h-0 mt-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mb-2" />
              <p className="text-sm">No packages</p>
            </div>
          ) : (
            <div className="space-y-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleViewDetails(pkg)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border bg-card shadow-sm min-h-[44px] transition-all active:scale-[0.99]",
                    selectedPackages.includes(pkg.id) && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-base truncate flex-1">
                      {pkg.recipient_name || pkg.recipient_profile?.full_name || pkg.tracking_code || "—"}
                    </span>
                    <Badge variant={pkg.status === "pending_pickup" ? "default" : "secondary"} className="text-xs shrink-0">
                      {pkg.status === "pending_pickup" ? "Pending" : "Picked up"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{pkg.tracking_code}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pkg.current_location} · {format(new Date(pkg.arrived_at), "MMM d")}</p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="picked_up" className="flex-1 min-h-0 mt-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mb-2" />
              <p className="text-sm">No packages</p>
            </div>
          ) : (
            <div className="space-y-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleViewDetails(pkg)}
                  className="w-full text-left p-4 rounded-xl border bg-card shadow-sm min-h-[44px] transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-base truncate flex-1">
                      {pkg.recipient_name || pkg.recipient_profile?.full_name || pkg.tracking_code || "—"}
                    </span>
                    <Badge variant="secondary" className="text-xs shrink-0">Picked up</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{pkg.tracking_code}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pkg.current_location} · {format(new Date(pkg.arrived_at), "MMM d")}</p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <AddPackageDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} />
      <PackageDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedPackageId(null); }}
        packageId={selectedPackageId}
        onMove={() => {
          const pkg = packages.find((p) => p.id === selectedPackageId);
          if (pkg) { setIsDetailsOpen(false); handleMovePackage(pkg); }
        }}
        onMarkPickedUp={() => {
          const pkg = packages.find((p) => p.id === selectedPackageId);
          if (pkg) { handleMarkPickedUp(pkg); setIsDetailsOpen(false); }
        }}
      />
      <MovePackageDialog
        isOpen={isMoveDialogOpen}
        onClose={handleMoveDialogClose}
        packageIds={selectedPackages.length > 0 ? selectedPackages : packageToMove ? [packageToMove.id] : []}
        currentLocation={packageToMove?.current_location}
      />
      <IdlePageHintPrompt
        visible={showHint}
        content={hintContent ? t(hintContent.en, hintContent.es) : ""}
        onDismiss={dismiss}
        onSeeFullWalkthrough={triggerFullWalkthrough}
      />
    </div>
  );

  return (
    <DashboardLayout title="Package Tracking">
      <div className={cn("p-6 space-y-6", isMobile && "p-0 flex flex-col min-h-0 flex-1")}>
        {isMobile ? mobileContent : (
        <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Manage incoming packages for residents and staff
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Add Package
          </Button>
        </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by tracking code or recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} filter(s)</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {dateTo ? format(dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Tabs and Table */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(v: any) => {
            setActiveTab(v);
            setSelectedPackages([]);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending_pickup">
                Pending Pickup
                {stats && stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="picked_up">Picked Up</TabsTrigger>
            </TabsList>

            <TabsContent value="pending_pickup" className="mt-6">
              <PackageTable
                packages={packages}
                isLoading={isLoading}
                selectedPackages={selectedPackages}
                onSelectPackage={handleSelectPackage}
                onSelectAll={handleSelectAll}
                onViewDetails={handleViewDetails}
                onMovePackage={handleMovePackage}
                onMarkPickedUp={handleMarkPickedUp}
              />
            </TabsContent>

            <TabsContent value="picked_up" className="mt-6">
              <PackageTable
                packages={packages}
                isLoading={isLoading}
                selectedPackages={selectedPackages}
                onSelectPackage={handleSelectPackage}
                onSelectAll={handleSelectAll}
                onViewDetails={handleViewDetails}
                onMovePackage={handleMovePackage}
                onMarkPickedUp={handleMarkPickedUp}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddPackageDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />

      <PackageDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPackageId(null);
        }}
        packageId={selectedPackageId}
        onMove={() => {
          const pkg = packages.find((p) => p.id === selectedPackageId);
          if (pkg) {
            setIsDetailsOpen(false);
            handleMovePackage(pkg);
          }
        }}
        onMarkPickedUp={() => {
          const pkg = packages.find((p) => p.id === selectedPackageId);
          if (pkg) {
            handleMarkPickedUp(pkg);
            setIsDetailsOpen(false);
          }
        }}
      />

      <MovePackageDialog
        isOpen={isMoveDialogOpen}
        onClose={handleMoveDialogClose}
        packageIds={selectedPackages.length > 0 ? selectedPackages : packageToMove ? [packageToMove.id] : []}
        currentLocation={packageToMove?.current_location}
      />

      {/* Bulk Actions Toolbar */}
      <BulkPackageActions
        selectedCount={selectedPackages.length}
        selectedPackageIds={selectedPackages}
        onClearSelection={() => setSelectedPackages([])}
        onBulkMove={handleBulkMove}
      />

      {/* Idle page hint */}
      <IdlePageHintPrompt
        visible={showHint}
        content={hintContent ? t(hintContent.en, hintContent.es) : ""}
        onDismiss={dismiss}
        onSeeFullWalkthrough={triggerFullWalkthrough}
      />
        </>
        )}
      </div>
    </DashboardLayout>
  );
}
