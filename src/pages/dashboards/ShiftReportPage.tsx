import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  CalendarIcon,
  History,
  RefreshCw,
  Loader2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useShiftReport,
  useShiftReportHistory,
  useSaveShiftReport,
  FeedbackEntry,
  MembershipRequest,
  CelebratoryEvent,
  TourNote,
  FacilityIssue,
  SystemIssue,
  FutureShiftNote,
} from "@/hooks/useShiftReports";
import { useShiftSystemData, formatSystemDataForReport } from "@/hooks/useShiftSystemData";
import { SystemDataSummary } from "@/components/reports/SystemDataSummary";
import { cn } from "@/lib/utils";

export default function ShiftReportPage() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const currentHour = new Date().getHours();
  const defaultShift = currentHour < 14 ? "AM" : "PM";

  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [shiftType, setShiftType] = useState<"AM" | "PM">(defaultShift as "AM" | "PM");
  const [historyOpen, setHistoryOpen] = useState(false);

  // Form state
  const [memberFeedback, setMemberFeedback] = useState<FeedbackEntry[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<MembershipRequest[]>([]);
  const [celebratoryEvents, setCelebratoryEvents] = useState<CelebratoryEvent[]>([]);
  const [tourNotes, setTourNotes] = useState<TourNote[]>([]);
  const [facilityIssues, setFacilityIssues] = useState<FacilityIssue[]>([]);
  const [busiestAreas, setBusiestAreas] = useState("");
  const [systemIssues, setSystemIssues] = useState<SystemIssue[]>([]);
  const [managementNotes, setManagementNotes] = useState("");
  const [futureShiftNotes, setFutureShiftNotes] = useState<FutureShiftNote[]>([]);

  const dateStr = format(reportDate, "yyyy-MM-dd");
  const { data: existingReport, isLoading: reportLoading } = useShiftReport(
    dateStr,
    shiftType
  );
  const { data: reportHistory } = useShiftReportHistory();
  const { data: systemData, isLoading: systemDataLoading } = useShiftSystemData(dateStr, shiftType);
  const saveReport = useSaveShiftReport();

  // Load existing report data
  useEffect(() => {
    if (existingReport) {
      setMemberFeedback((existingReport.member_feedback as unknown as FeedbackEntry[]) || []);
      setMembershipRequests((existingReport.membership_requests as unknown as MembershipRequest[]) || []);
      setCelebratoryEvents((existingReport.celebratory_events as unknown as CelebratoryEvent[]) || []);
      setTourNotes((existingReport.tour_notes as unknown as TourNote[]) || []);
      setFacilityIssues((existingReport.facility_issues as unknown as FacilityIssue[]) || []);
      setBusiestAreas(existingReport.busiest_areas || "");
      setSystemIssues((existingReport.system_issues as unknown as SystemIssue[]) || []);
      setManagementNotes(existingReport.management_notes || "");
      setFutureShiftNotes((existingReport.future_shift_notes as unknown as FutureShiftNote[]) || []);
    } else {
      // Reset form for new report
      setMemberFeedback([]);
      setMembershipRequests([]);
      setCelebratoryEvents([]);
      setTourNotes([]);
      setFacilityIssues([]);
      setBusiestAreas("");
      setSystemIssues([]);
      setManagementNotes("");
      setFutureShiftNotes([]);
    }
  }, [existingReport]);

  const handleSave = async (submit = false) => {
    if (!user) return;

    // Format system data for saving
    const formattedSystemData = formatSystemDataForReport(systemData);

    await saveReport.mutateAsync({
      id: existingReport?.id,
      report_date: dateStr,
      shift_type: shiftType,
      staff_user_id: user.id,
      staff_name: user.email || "",
      member_feedback: memberFeedback,
      membership_requests: membershipRequests,
      celebratory_events: celebratoryEvents,
      scheduled_tours: [],
      tour_notes: tourNotes,
      facility_issues: facilityIssues,
      busiest_areas: busiestAreas,
      system_issues: systemIssues,
      management_notes: managementNotes,
      future_shift_notes: futureShiftNotes,
      status: submit ? "submitted" : "draft",
      // Include system data from APIs
      arketa_reservations: formattedSystemData.arketa_reservations,
      toast_sales: formattedSystemData.toast_sales,
      sling_shift_data: formattedSystemData.sling_shift_data,
    });
  };

  // Array field handlers
  const addFeedback = () => {
    setMemberFeedback([...memberFeedback, { type: "neutral", content: "" }]);
  };

  const addMembershipRequest = () => {
    setMembershipRequests([
      ...membershipRequests,
      { requestType: "cancel", name: "", email: "", membershipType: "", endDate: "" },
    ]);
  };

  const addCelebratoryEvent = () => {
    setCelebratoryEvents([...celebratoryEvents, { memberName: "", eventType: "", date: "" }]);
  };

  const addTourNote = () => {
    setTourNotes([...tourNotes, { name: "", notesCompleted: false, followUpSent: false }]);
  };

  const addFacilityIssue = () => {
    setFacilityIssues([...facilityIssues, { description: "" }]);
  };

  const addSystemIssue = () => {
    setSystemIssues([...systemIssues, { category: "", description: "" }]);
  };

  const addFutureNote = () => {
    setFutureShiftNotes([
      ...futureShiftNotes,
      { targetDate: today, targetShift: "AM", note: "" },
    ]);
  };

  const isSubmitted = existingReport?.status === "submitted";

  return (
    <DashboardLayout title="Concierge Shift Report">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {format(reportDate, "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              Staff: {user?.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={shiftType}
              onValueChange={(v) => setShiftType(v as "AM" | "PM")}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={reportDate}
                  onSelect={(d) => d && setReportDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Report History</SheetTitle>
                  <SheetDescription>View previous shift reports</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                  <div className="space-y-2">
                    {reportHistory?.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => {
                          setReportDate(new Date(report.report_date));
                          setShiftType(report.shift_type as "AM" | "PM");
                          setHistoryOpen(false);
                        }}
                        className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {format(new Date(report.report_date), "MMM d, yyyy")}
                          </span>
                          <Badge variant="outline">{report.shift_type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.staff_name} •{" "}
                          <Badge
                            variant={
                              report.status === "submitted" ? "default" : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {report.status}
                          </Badge>
                        </p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="icon" disabled>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {reportLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {isSubmitted && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <Badge>Submitted</Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  This report has been submitted and cannot be edited.
                </p>
              </div>
            )}

            {/* System Data Summary - Read-only cards */}
            <SystemDataSummary 
              data={systemData} 
              isLoading={systemDataLoading} 
              shiftType={shiftType} 
            />

            <Separator />

            {/* MEMBERS Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider font-medium">
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Feedback */}
                <div className="space-y-3">
                  <Label className="text-sm">
                    Please report any feedback or issues from members or staff/general
                    shift notes. For general notes, please select neutral:
                  </Label>
                  {memberFeedback.map((fb, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Select
                        value={fb.type}
                        onValueChange={(v) => {
                          const updated = [...memberFeedback];
                          updated[i].type = v as "positive" | "negative" | "neutral";
                          setMemberFeedback(updated);
                        }}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Enter feedback or issue"
                        value={fb.content}
                        onChange={(e) => {
                          const updated = [...memberFeedback];
                          updated[i].content = e.target.value;
                          setMemberFeedback(updated);
                        }}
                        disabled={isSubmitted}
                        className="flex-1"
                      />
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setMemberFeedback(memberFeedback.filter((_, idx) => idx !== i))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isSubmitted && (
                    <Button variant="ghost" size="sm" onClick={addFeedback}>
                      <Plus className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Membership Requests */}
                <div className="space-y-3">
                  <Label className="text-sm">
                    Were there any requests to cancel or pause membership?
                  </Label>
                  {membershipRequests.map((req, i) => (
                    <div key={i} className="flex gap-2 items-start flex-wrap">
                      <Select
                        value={req.requestType}
                        onValueChange={(v) => {
                          const updated = [...membershipRequests];
                          updated[i].requestType = v as "cancel" | "pause";
                          setMembershipRequests(updated);
                        }}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cancel">Cancel</SelectItem>
                          <SelectItem value="pause">Pause</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Name"
                        value={req.name}
                        onChange={(e) => {
                          const updated = [...membershipRequests];
                          updated[i].name = e.target.value;
                          setMembershipRequests(updated);
                        }}
                        disabled={isSubmitted}
                        className="w-36"
                      />
                      <Input
                        placeholder="Email (optional)"
                        value={req.email || ""}
                        onChange={(e) => {
                          const updated = [...membershipRequests];
                          updated[i].email = e.target.value;
                          setMembershipRequests(updated);
                        }}
                        disabled={isSubmitted}
                        className="w-44"
                      />
                      <Select
                        value={req.membershipType || ""}
                        onValueChange={(v) => {
                          const updated = [...membershipRequests];
                          updated[i].membershipType = v;
                          setMembershipRequests(updated);
                        }}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        placeholder="End date"
                        value={req.endDate || ""}
                        onChange={(e) => {
                          const updated = [...membershipRequests];
                          updated[i].endDate = e.target.value;
                          setMembershipRequests(updated);
                        }}
                        disabled={isSubmitted}
                        className="w-36"
                      />
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setMembershipRequests(
                              membershipRequests.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isSubmitted && (
                    <Button variant="ghost" size="sm" onClick={addMembershipRequest}>
                      <Plus className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Celebratory Events */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">
                      Did any members share any celebratory events?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Add any special/giftable events to tracker
                    </p>
                  </div>
                  {celebratoryEvents.map((evt, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input
                        placeholder="Member name"
                        value={evt.memberName}
                        onChange={(e) => {
                          const updated = [...celebratoryEvents];
                          updated[i].memberName = e.target.value;
                          setCelebratoryEvents(updated);
                        }}
                        disabled={isSubmitted}
                        className="flex-1"
                      />
                      <Select
                        value={evt.eventType}
                        onValueChange={(v) => {
                          const updated = [...celebratoryEvents];
                          updated[i].eventType = v;
                          setCelebratoryEvents(updated);
                        }}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select event..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="birthday">Birthday</SelectItem>
                          <SelectItem value="anniversary">Anniversary</SelectItem>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={evt.date || ""}
                        onChange={(e) => {
                          const updated = [...celebratoryEvents];
                          updated[i].date = e.target.value;
                          setCelebratoryEvents(updated);
                        }}
                        disabled={isSubmitted}
                        className="w-36"
                      />
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setCelebratoryEvents(
                              celebratoryEvents.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isSubmitted && (
                    <Button variant="ghost" size="sm" onClick={addCelebratoryEvent}>
                      <Plus className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* TOURS Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-wider font-medium">
                    Tours
                  </CardTitle>
                  <Button variant="ghost" size="sm" disabled>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Sync
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 inline mr-2" />
                  No tours scheduled today (Sling integration pending)
                </div>

                <div className="space-y-3">
                  <Label className="text-sm">Did you tour anyone? (Add notes)</Label>
                  {tourNotes.map((tour, i) => (
                    <div key={i} className="space-y-2 p-3 border rounded-lg">
                      <Input
                        placeholder="Name"
                        value={tour.name}
                        onChange={(e) => {
                          const updated = [...tourNotes];
                          updated[i].name = e.target.value;
                          setTourNotes(updated);
                        }}
                        disabled={isSubmitted}
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={tour.notesCompleted}
                            onCheckedChange={(c) => {
                              const updated = [...tourNotes];
                              updated[i].notesCompleted = !!c;
                              setTourNotes(updated);
                            }}
                            disabled={isSubmitted}
                          />
                          Notes filled out & follow up email sent
                        </label>
                        {!isSubmitted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setTourNotes(tourNotes.filter((_, idx) => idx !== i))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!isSubmitted && (
                    <Button variant="ghost" size="sm" onClick={addTourNote}>
                      <Plus className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* FACILITIES Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider font-medium">
                  Facilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm">
                    Any facility issues? (maintenance, equipment, etc.)
                  </Label>
                  {facilityIssues.map((issue, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input
                        placeholder="Describe the facility issue"
                        value={issue.description}
                        onChange={(e) => {
                          const updated = [...facilityIssues];
                          updated[i].description = e.target.value;
                          setFacilityIssues(updated);
                        }}
                        disabled={isSubmitted}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" disabled>
                        <Upload className="h-4 w-4 mr-1" />
                        Photo
                      </Button>
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setFacilityIssues(facilityIssues.filter((_, idx) => idx !== i))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isSubmitted && (
                    <Button variant="ghost" size="sm" onClick={addFacilityIssue}>
                      <Plus className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    What areas of the gym were busiest and when?
                  </Label>
                  <Textarea
                    placeholder="Describe busy areas and times..."
                    value={busiestAreas}
                    onChange={(e) => setBusiestAreas(e.target.value)}
                    disabled={isSubmitted}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">
                      System Issues & Questions for Management
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Any issues with Arketa, Jolt, Database, or questions for management
                    </p>
                  </div>
                  {systemIssues.map((issue, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Select
                        value={issue.category}
                        onValueChange={(v) => {
                          const updated = [...systemIssues];
                          updated[i].category = v;
                          setSystemIssues(updated);
                        }}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arketa">Arketa</SelectItem>
                          <SelectItem value="jolt">Jolt</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Describe the issue..."
                        value={issue.description}
                        onChange={(e) => {
                          const updated = [...systemIssues];
                          updated[i].description = e.target.value;
                          setSystemIssues(updated);
                        }}
                        disabled={isSubmitted}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" disabled>
                        <Upload className="h-4 w-4 mr-1" />
                        Photo
                      </Button>
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setSystemIssues(systemIssues.filter((_, idx) => idx !== i))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!isSubmitted && (
                    <Button variant="ghost" size="sm" onClick={addSystemIssue}>
                      <Plus className="h-4 w-4 mr-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* MANAGEMENT NOTES Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider font-medium">
                  Management Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter any additional comments, questions, or notes for management review"
                  value={managementNotes}
                  onChange={(e) => setManagementNotes(e.target.value)}
                  disabled={isSubmitted}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* NOTES FOR FUTURE SHIFT Section */}
            <Card>
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-sm uppercase tracking-wider font-medium">
                    Notes for Future Shift
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unfinished tasks, emails etc.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {futureShiftNotes.map((note, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      type="date"
                      value={note.targetDate}
                      onChange={(e) => {
                        const updated = [...futureShiftNotes];
                        updated[i].targetDate = e.target.value;
                        setFutureShiftNotes(updated);
                      }}
                      disabled={isSubmitted}
                      className="w-36"
                    />
                    <Select
                      value={note.targetShift}
                      onValueChange={(v) => {
                        const updated = [...futureShiftNotes];
                        updated[i].targetShift = v as "AM" | "PM";
                        setFutureShiftNotes(updated);
                      }}
                      disabled={isSubmitted}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Enter notes for future shift"
                      value={note.note}
                      onChange={(e) => {
                        const updated = [...futureShiftNotes];
                        updated[i].note = e.target.value;
                        setFutureShiftNotes(updated);
                      }}
                      disabled={isSubmitted}
                      className="flex-1"
                    />
                    {!isSubmitted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setFutureShiftNotes(futureShiftNotes.filter((_, idx) => idx !== i))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {!isSubmitted && (
                  <Button variant="ghost" size="sm" onClick={addFutureNote}>
                    <Plus className="h-4 w-4 mr-1" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            {!isSubmitted && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={saveReport.isPending}
                  className="flex-1"
                >
                  {saveReport.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saveReport.isPending}
                  className="flex-1"
                >
                  {saveReport.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Submit Shift Report
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
