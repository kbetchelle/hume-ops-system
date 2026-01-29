import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAnalytics, DateRange } from "@/hooks/useAnalytics";
import { format, subMonths, startOfMonth } from "date-fns";
import { Loader2, Users, UserCheck, Activity, TrendingUp, Calendar, MapPin, Dumbbell } from "lucide-react";

type ViewType = "all" | "trainer" | "location";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#FFBB28"
];

export default function AnalyticsDashboard() {
  const [viewType, setViewType] = useState<ViewType>("all");
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfMonth(subMonths(new Date(), 11)),
    end: new Date()
  });

  const {
    isLoading,
    getMemberGrowth,
    getTrainerMetrics,
    getLocationMetrics,
    getSummaryStats,
    getLocations,
    getTrainers
  } = useAnalytics(dateRange, viewType, viewType === "trainer" ? selectedTrainer : selectedLocation);

  const stats = getSummaryStats();
  const memberGrowth = getMemberGrowth();
  const trainerMetrics = getTrainerMetrics();
  const locationMetrics = getLocationMetrics();
  const locations = getLocations();
  const trainers = getTrainers();

  if (isLoading) {
    return (
      <DashboardLayout title="Analytics Dashboard">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics Dashboard">
      <div className="space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 p-6 border border-border bg-card">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest">View</Label>
            <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data</SelectItem>
                <SelectItem value="trainer">By Trainer</SelectItem>
                <SelectItem value="location">By Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewType === "trainer" && (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest">Trainer</Label>
              <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select trainer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trainers</SelectItem>
                  {trainers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {viewType === "location" && (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest">Start Date</Label>
            <Input
              type="date"
              value={format(dateRange.start, "yyyy-MM-dd")}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
              className="w-[160px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest">End Date</Label>
            <Input
              type="date"
              value={format(dateRange.end, "yyyy-MM-dd")}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
              className="w-[160px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange({
                start: startOfMonth(subMonths(new Date(), 2)),
                end: new Date()
              })}
            >
              Last 3 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange({
                start: startOfMonth(subMonths(new Date(), 5)),
                end: new Date()
              })}
            >
              Last 6 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange({
                start: startOfMonth(subMonths(new Date(), 11)),
                end: new Date()
              })}
            >
              Last 12 Months
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">{stats.totalMembers}</p>
              <p className="text-[10px] text-muted-foreground">
                +{stats.newMembersInPeriod} in selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">
                Growth Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">
                {stats.growthRate > 0 ? "+" : ""}{stats.growthRate}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                Over selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">
                Active Trainers
              </CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">{stats.totalTrainers}</p>
              <p className="text-[10px] text-muted-foreground">
                {stats.totalAssignments} client assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest font-normal text-muted-foreground">
                Total Activities
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">{stats.totalActivities}</p>
              <p className="text-[10px] text-muted-foreground">
                Logged in period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Data */}
        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList>
            <TabsTrigger value="growth" className="text-xs uppercase tracking-widest">
              Member Growth
            </TabsTrigger>
            <TabsTrigger value="trainers" className="text-xs uppercase tracking-widest">
              Trainer Performance
            </TabsTrigger>
            <TabsTrigger value="locations" className="text-xs uppercase tracking-widest">
              Location Metrics
            </TabsTrigger>
          </TabsList>

          {/* Member Growth Tab */}
          <TabsContent value="growth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Growth Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {memberGrowth.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={memberGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0"
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalMembers" 
                        name="Total Members"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newMembers" 
                        name="New Members"
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly New Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={memberGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0"
                        }}
                      />
                      <Bar dataKey="newMembers" name="New Members" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {memberGrowth.slice(-6).map((item, index) => (
                      <div key={item.month} className="flex items-center justify-between">
                        <span className="text-sm">{item.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            +{item.newMembers} new
                          </span>
                          <span className="text-sm font-medium w-16 text-right">
                            {item.totalMembers} total
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trainer Performance Tab */}
          <TabsContent value="trainers" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Trainer Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {trainerMetrics.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">No trainer data available</p>
                  ) : (
                    <div className="border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px] uppercase tracking-widest">Trainer</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest text-right">Clients</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest text-right">Active Plans</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest text-right">Templates</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest">Retention</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trainerMetrics.map((trainer) => (
                            <TableRow key={trainer.trainerId}>
                              <TableCell className="font-medium">{trainer.trainerName}</TableCell>
                              <TableCell className="text-right">{trainer.totalClients}</TableCell>
                              <TableCell className="text-right">{trainer.activePlans}</TableCell>
                              <TableCell className="text-right">{trainer.templatesCreated}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={trainer.avgClientRetention} className="h-2 w-20" />
                                  <span className="text-xs text-muted-foreground w-10">
                                    {trainer.avgClientRetention}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clients per Trainer</CardTitle>
                </CardHeader>
                <CardContent>
                  {trainerMetrics.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={trainerMetrics} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis 
                          type="category" 
                          dataKey="trainerName" 
                          tick={{ fontSize: 10 }} 
                          stroke="hsl(var(--muted-foreground))"
                          width={100}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0"
                          }}
                        />
                        <Bar dataKey="totalClients" name="Clients" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plans Created</CardTitle>
                </CardHeader>
                <CardContent>
                  {trainerMetrics.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={trainerMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="trainerName" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0"
                          }}
                        />
                        <Legend />
                        <Bar dataKey="activePlans" name="Active Plans" fill="hsl(var(--primary))" />
                        <Bar dataKey="templatesCreated" name="Templates" fill="hsl(var(--secondary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Location Metrics Tab */}
          <TabsContent value="locations" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Activity by Location</CardTitle>
                </CardHeader>
                <CardContent>
                  {locationMetrics.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">No location data available</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={locationMetrics}
                          dataKey="totalVisits"
                          nameKey="location"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ location, percent }) => 
                            `${location.slice(0, 15)}${location.length > 15 ? '...' : ''} (${(percent * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {locationMetrics.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
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

              <Card>
                <CardHeader>
                  <CardTitle>Location Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {locationMetrics.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">No data</p>
                  ) : (
                    <div className="space-y-4">
                      {locationMetrics.slice(0, 8).map((loc, index) => (
                        <div key={loc.location} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{loc.location}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {loc.totalVisits} visits • {loc.uniqueMembers} members
                            </div>
                          </div>
                          <Progress 
                            value={(loc.totalVisits / (locationMetrics[0]?.totalVisits || 1)) * 100} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Location Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {locationMetrics.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={locationMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="location" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0"
                          }}
                        />
                        <Legend />
                        <Bar dataKey="totalVisits" name="Total Visits" fill="hsl(var(--primary))" />
                        <Bar dataKey="uniqueMembers" name="Unique Members" fill="hsl(var(--secondary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
