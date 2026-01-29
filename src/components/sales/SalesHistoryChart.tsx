import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSalesHistory } from "@/hooks/useDailySales";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SalesHistoryChartProps {
  className?: string;
}

export function SalesHistoryChart({ className }: SalesHistoryChartProps) {
  const [days, setDays] = useState<7 | 30>(7);
  const { data: salesHistory, isLoading } = useSalesHistory(days);

  const chartData = salesHistory?.map((sale) => ({
    date: format(parseISO(sale.business_date), days === 7 ? "EEE" : "MM/dd"),
    sales: sale.total_sales,
    transactions: sale.total_transactions,
    fullDate: format(parseISO(sale.business_date), "MMM d, yyyy"),
  })) || [];

  // Calculate trend
  const calculateTrend = () => {
    if (!salesHistory || salesHistory.length < 2) return null;
    
    const midpoint = Math.floor(salesHistory.length / 2);
    const firstHalf = salesHistory.slice(0, midpoint);
    const secondHalf = salesHistory.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.total_sales, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.total_sales, 0) / secondHalf.length;
    
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    return percentChange;
  };

  const trend = calculateTrend();
  const totalSales = salesHistory?.reduce((sum, s) => sum + s.total_sales, 0) || 0;
  const avgSales = salesHistory?.length ? totalSales / salesHistory.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullDate: string; sales: number; transactions: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {data.fullDate}
          </p>
          <p className="text-xs font-medium">
            {formatCurrency(data.sales)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {data.transactions} transactions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`border border-border rounded-none ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm uppercase tracking-[0.15em] font-normal">
              Sales Trend
            </CardTitle>
            {trend !== null && (
              <div className="flex items-center gap-2">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-foreground" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
              <span
                className={`text-[10px] tracking-wide ${
                  trend >= 0 ? "text-foreground" : "text-destructive"
                }`}
              >
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}% vs prior period
              </span>
            </div>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant={days === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(7)}
              className="text-[10px] uppercase tracking-widest h-7 px-3"
            >
              7 Days
            </Button>
            <Button
              variant={days === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(30)}
              className="text-[10px] uppercase tracking-widest h-7 px-3"
            >
              30 Days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-xs text-muted-foreground">No sales data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1 border-l border-border pl-4">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Total ({days} days)
                </span>
                <p className="text-lg font-normal">{formatCurrency(totalSales)}</p>
              </div>
              <div className="space-y-1 border-l border-border pl-4">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Daily Average
                </span>
                <p className="text-lg font-normal">{formatCurrency(avgSales)}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--foreground))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "hsl(var(--foreground))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
