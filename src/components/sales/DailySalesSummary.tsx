import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTodaySales, useSyncToastSales } from "@/hooks/useDailySales";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { RefreshCw, DollarSign, Receipt, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DailySalesSummaryProps {
  compact?: boolean;
}

export function DailySalesSummary({ compact = false }: DailySalesSummaryProps) {
  const { data: sales, isLoading } = useTodaySales();
  const syncMutation = useSyncToastSales();
  const { isManagerOrAdmin } = usePermissions();
  const canSync = isManagerOrAdmin();

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync(undefined);
      toast.success(`Synced sales for ${result.businessDate}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sync sales");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (compact) {
    return (
      <Card className="border border-border rounded-none">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Today's Sales
            </CardTitle>
            {canSync && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="h-6 px-2"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : !sales ? (
            <p className="text-xs text-muted-foreground py-4">No sales data available</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Total
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(sales.total_sales)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Transactions
                  </span>
                </div>
                <span className="text-sm font-medium">{sales.total_transactions}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border rounded-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-[0.15em] font-normal">
            Today's Sales
          </CardTitle>
          {canSync && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="text-[10px] uppercase tracking-widest"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Syncing
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Sync from Toast
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground tracking-wide">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !sales ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No sales data available</p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Click sync to fetch today's sales from Toast
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 border-l border-border pl-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Total Sales
                  </span>
                </div>
                <p className="text-2xl font-normal">{formatCurrency(sales.total_sales)}</p>
              </div>
              <div className="space-y-2 border-l border-border pl-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Transactions
                  </span>
                </div>
                <p className="text-2xl font-normal">{sales.total_transactions}</p>
              </div>
            </div>

            {/* Payment Breakdown */}
            {sales.payment_breakdown && Object.keys(sales.payment_breakdown).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Payment Methods
                  </h4>
                </div>
                <div className="space-y-2 pl-5">
                  {Object.entries(sales.payment_breakdown).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-xs tracking-wide capitalize">
                        {method.toLowerCase().replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Items */}
            {sales.top_items && sales.top_items.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Top Selling Items
                </h4>
                <div className="space-y-2">
                  {sales.top_items.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground w-4">
                          {index + 1}.
                        </span>
                        <span className="text-xs tracking-wide">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium">{formatCurrency(item.revenue)}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">
                          ×{item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Synced */}
            <p className="text-[10px] text-muted-foreground tracking-wide">
              Last synced: {format(new Date(sales.synced_at), "h:mm a")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
