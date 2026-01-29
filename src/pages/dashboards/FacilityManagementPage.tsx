import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Download, Package, DollarSign, TrendingDown, Building } from "lucide-react";
import { useAssets, Asset, AssetInput } from "@/hooks/useAssets";
import { useExpenses, ExpenseInput } from "@/hooks/useExpenses";
import { AssetDialog } from "@/components/facility/AssetDialog";
import { AssetTable } from "@/components/facility/AssetTable";
import { ExpenseDialog } from "@/components/facility/ExpenseDialog";
import { ExpenseTable } from "@/components/facility/ExpenseTable";
import { ExpenseChart } from "@/components/facility/ExpenseChart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export default function FacilityManagementPage() {
  const [activeTab, setActiveTab] = useState("assets");
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<{ id: string } | null>(null);

  const {
    assets,
    isLoading: assetsLoading,
    createAsset,
    updateAsset,
    deleteAsset,
    calculateCurrentValue,
    getDepreciationSummary
  } = useAssets();

  const {
    expenses,
    isLoading: expensesLoading,
    createExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpensesByLocation,
    getExpensesByMonth,
    getTotalExpenses,
    exportToCSV
  } = useExpenses();

  const depreciation = getDepreciationSummary();
  const totalExpenses = getTotalExpenses();

  const handleSaveAsset = async (data: AssetInput) => {
    if (editingAsset) {
      await updateAsset.mutateAsync({ id: editingAsset.id, ...data });
    } else {
      await createAsset.mutateAsync(data);
    }
    setAssetDialogOpen(false);
    setEditingAsset(null);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetDialogOpen(true);
  };

  const handleDeleteAsset = async () => {
    if (deletingAsset) {
      await deleteAsset.mutateAsync(deletingAsset.id);
      setDeletingAsset(null);
    }
  };

  const handleSaveExpense = async (data: ExpenseInput) => {
    await createExpense.mutateAsync(data);
    setExpenseDialogOpen(false);
  };

  const handleDeleteExpense = async () => {
    if (deletingExpense) {
      await deleteExpense.mutateAsync(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  const isLoading = assetsLoading || expensesLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Facility Management">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Facility Management">
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">
                Total Assets
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">{assets?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground">
                {assets?.filter(a => a.status === 'active').length || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">
                Asset Value
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">
                ${depreciation.totalCurrentValue.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ${depreciation.totalPurchaseValue.toLocaleString()} purchase
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">
                Depreciation
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">
                ${depreciation.totalDepreciation.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {depreciation.totalPurchaseValue > 0 
                  ? ((depreciation.totalDepreciation / depreciation.totalPurchaseValue) * 100).toFixed(1)
                  : 0}% of purchase value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">
                Total Expenses
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">${totalExpenses.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Last 12 months</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="assets" className="text-xs uppercase tracking-widest">
                Assets
              </TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs uppercase tracking-widest">
                Expenses
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs uppercase tracking-widest">
                Reports
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {activeTab === "assets" && (
                <Button onClick={() => { setEditingAsset(null); setAssetDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              )}
              {activeTab === "expenses" && (
                <>
                  <Button variant="outline" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={() => setExpenseDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Expense
                  </Button>
                </>
              )}
              {activeTab === "reports" && (
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="assets" className="mt-6">
            <AssetTable
              assets={assets || []}
              onEdit={handleEditAsset}
              onDelete={setDeletingAsset}
              calculateCurrentValue={calculateCurrentValue}
            />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <ExpenseTable
              expenses={expenses || []}
              onDelete={(exp) => setDeletingExpense({ id: exp.id })}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ExpenseChart
              byCategory={getExpensesByCategory()}
              byLocation={getExpensesByLocation()}
              byMonth={getExpensesByMonth()}
              totalExpenses={totalExpenses}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AssetDialog
        open={assetDialogOpen}
        onOpenChange={(open) => {
          setAssetDialogOpen(open);
          if (!open) setEditingAsset(null);
        }}
        asset={editingAsset}
        onSave={handleSaveAsset}
        isLoading={createAsset.isPending || updateAsset.isPending}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        assets={assets}
        onSave={handleSaveExpense}
        isLoading={createExpense.isPending}
      />

      {/* Delete Confirmations */}
      <AlertDialog open={!!deletingAsset} onOpenChange={() => setDeletingAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAsset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAsset}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingExpense} onOpenChange={() => setDeletingExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
