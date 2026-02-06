import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileSpreadsheet } from "lucide-react";
import DataBackfillPage from "@/components/settings/DataBackfillPage";
import { CSVImportMapper } from "@/components/backfill/CSVImportMapper";

export default function BackfillManagerPage() {
  return (
    <DashboardLayout title="Backfill & Import Manager">
      <div className="space-y-6 min-w-0 overflow-hidden px-4 md:px-8 py-4">
        <Tabs defaultValue="data-backfill" className="space-y-4">
          <TabsList>
            <TabsTrigger value="data-backfill" className="gap-2">
              <Database className="h-4 w-4" />
              Data Backfill
            </TabsTrigger>
            <TabsTrigger value="csv-import" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              CSV Import
            </TabsTrigger>
          </TabsList>
          <TabsContent value="data-backfill" className="space-y-4">
            <DataBackfillPage />
          </TabsContent>
          <TabsContent value="csv-import" className="space-y-4">
            <div className="space-y-4">
              <CSVImportMapper />
              <p className="text-sm text-muted-foreground">
                Import data from CSV files with flexible field mapping. Supports Arketa Reservations, Subscriptions, Payments and custom tables.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
