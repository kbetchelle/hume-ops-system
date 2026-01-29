import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface ExpenseChartProps {
  byCategory: { category: string; amount: number }[];
  byLocation: { location: string; amount: number }[];
  byMonth: { month: string; amount: number }[];
  totalExpenses: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#FFBB28"
];

export function ExpenseChart({ byCategory, byLocation, byMonth, totalExpenses }: ExpenseChartProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Monthly Trend */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Expense Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {byMonth.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No expense data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Expenses"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0"
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* By Category */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {byCategory.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No expense data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, percent }) => 
                    `${category.slice(0, 12)}${category.length > 12 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {byCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* By Location */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Location</CardTitle>
        </CardHeader>
        <CardContent>
          {byLocation.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No expense data</p>
          ) : (
            <div className="space-y-3">
              {byLocation.slice(0, 8).map((item, index) => {
                const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                return (
                  <div key={item.location} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate">{item.location}</span>
                      <span className="font-medium">${item.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
