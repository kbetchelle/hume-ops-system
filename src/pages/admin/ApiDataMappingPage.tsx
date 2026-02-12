import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BookOpen, 
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Database
} from "lucide-react";

interface FieldMapping {
  apiField: string;
  dbField: string;
  transformation?: string;
  nullable: boolean;
  notes?: string;
}

interface ApiEndpointInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  edgeFunction: string;
  apiEndpoint: string;
  pagination: string;
  dateRange: {
    ahead: string;
    behind: string;
    default: string;
  };
  targetTable: string;
  stagingTable: string | null;
  limitations: string[];
  fieldsMapped: FieldMapping[];
  fieldsNotPulled: string[];
  nullFields: string[];
  transformations: string[];
}

const API_ENDPOINTS: ApiEndpointInfo[] = [
  {
    id: "arketa_clients",
    name: "Arketa Clients",
    icon: <Users className="h-5 w-5" />,
    description: "Syncs member/client data from Arketa including contact info, tags, and marketing preferences.",
    edgeFunction: "sync-arketa-clients",
    apiEndpoint: "/partnerApi/v0/{partnerId}/clients",
    pagination: "Cursor-based (nextCursor, hasMore)",
    dateRange: {
      ahead: "N/A",
      behind: "N/A (full sync)",
      default: "All records via cursor pagination",
    },
    targetTable: "arketa_clients",
    stagingTable: "arketa_clients_staging",
    limitations: [
      "No date filtering - fetches all clients on each sync",
      "Large datasets may timeout on initial sync",
      "Requires OAuth token refresh before sync",
    ],
    fieldsMapped: [
      { apiField: "id", dbField: "external_id", nullable: false },
      { apiField: "email", dbField: "client_email", nullable: false },
      { apiField: "name / firstName + lastName", dbField: "client_name", transformation: "Combines firstName + lastName if name not provided", nullable: true },
      { apiField: "phone", dbField: "client_phone", nullable: true },
      { apiField: "tags", dbField: "client_tags", transformation: "Stored as text[]", nullable: true },
      { apiField: "customFields", dbField: "custom_fields", transformation: "Stored as JSONB", nullable: true },
      { apiField: "referrer", dbField: "referrer", nullable: true },
      { apiField: "emailMarketingOptIn", dbField: "email_mkt_opt_in", transformation: "Defaults to false if null", nullable: false },
      { apiField: "smsMarketingOptIn", dbField: "sms_mkt_opt_in", transformation: "Defaults to false if null", nullable: false },
      { apiField: "dateOfBirth", dbField: "date_of_birth", nullable: true },
      { apiField: "lifecycleStage", dbField: "lifecycle_stage", nullable: true },
      { apiField: "(full response)", dbField: "raw_data", transformation: "Complete API response stored as JSONB", nullable: true },
    ],
    fieldsNotPulled: [
      "createdAt (available but not mapped)",
      "updatedAt (available but not mapped)",
      "address fields",
      "emergency contact info",
      "payment method details",
    ],
    nullFields: ["referrer", "dateOfBirth", "lifecycleStage"],
    transformations: [
      "Name fallback: Uses 'name' field, or combines 'firstName' + 'lastName'",
      "Boolean defaults: Marketing opt-ins default to false when null",
    ],
  },
  {
    id: "arketa_reservations",
    name: "Arketa Reservations",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Syncs class reservations/bookings including check-in status and client details.",
    edgeFunction: "sync-arketa-reservations",
    apiEndpoint: "/partnerApi/v0/{partnerId}/reservations",
    pagination: "Cursor-based (400 records per page)",
    dateRange: {
      ahead: "Same day (configurable via end_date)",
      behind: "Same day (configurable via start_date)",
      default: "Today only",
    },
    targetTable: "arketa_reservations",
    stagingTable: "arketa_reservations_staging",
    limitations: [
      "Default syncs today only - requires date params for historical",
      "400 records per page per sync",
    ],
    fieldsMapped: [
      { apiField: "id", dbField: "booking_id", nullable: false },
      { apiField: "class_id", dbField: "class_id", nullable: false },
      { apiField: "client_id / client.id", dbField: "client_id", nullable: true },
      { apiField: "client.firstName + lastName", dbField: "client_name", transformation: "Concatenated from nested client object", nullable: true },
      { apiField: "client.email", dbField: "client_email", nullable: true },
      { apiField: "status", dbField: "status", transformation: "Defaults to 'booked'", nullable: true },
      { apiField: "checked_in", dbField: "checked_in", transformation: "Defaults to false", nullable: false },
      { apiField: "checkedInAt / checked_in_at", dbField: "checked_in_at", transformation: "Handles both field names", nullable: true },
      { apiField: "(full response)", dbField: "raw_data", nullable: true },
    ],
    fieldsNotPulled: [
      "Reservation creation timestamp",
      "Cancellation reason",
      "Waitlist position",
      "Payment info associated with reservation",
    ],
    nullFields: ["client_id", "client_name", "client_email", "checked_in_at"],
    transformations: [
      "Client name: Concatenates firstName + lastName from nested client object",
      "Status default: 'booked' when not provided",
      "Check-in field: Handles both 'checkedInAt' and 'checked_in_at' formats",
    ],
  },
  {
    id: "arketa_payments",
    name: "Arketa Payments",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Syncs payment transactions from Arketa /payments endpoint with cursor-based pagination.",
    edgeFunction: "sync-arketa-payments",
    apiEndpoint: "/partnerApiDev/v0/{partnerId}/payments",
    pagination: "Cursor-based (nextStartAfterId, batch size 25)",
    dateRange: {
      ahead: "N/A (full cursor sync)",
      behind: "N/A (full cursor sync)",
      default: "All records via resumable cursor pagination",
    },
    targetTable: "arketa_payments",
    stagingTable: "arketa_payments_staging",
    limitations: [
      "Batch size limited to 25 to avoid API 500 errors",
      "Resumable cursor stored in arketa_payments_sync_state",
      "Up to 8 retries with jittered exponential backoff per page",
    ],
    fieldsMapped: [
      { apiField: "id", dbField: "payment_id", transformation: "Renamed to avoid PK conflict", nullable: false },
      { apiField: "amount", dbField: "amount", nullable: true },
      { apiField: "status", dbField: "status", nullable: true },
      { apiField: "created_at", dbField: "created_at_api", transformation: "Renamed to avoid DB conflict", nullable: true },
      { apiField: "currency", dbField: "currency", nullable: true },
      { apiField: "amount_refunded", dbField: "amount_refunded", nullable: true },
      { apiField: "description", dbField: "description", nullable: true },
      { apiField: "invoice_id", dbField: "invoice_id", nullable: true },
      { apiField: "normalized_category", dbField: "normalized_category", transformation: "Stored as TEXT[] array", nullable: true },
      { apiField: "net_sales", dbField: "net_sales", nullable: true },
      { apiField: "transaction_fees", dbField: "transaction_fees", nullable: true },
      { apiField: "tax", dbField: "tax", nullable: true },
      { apiField: "location_name", dbField: "location_name", nullable: true },
      { apiField: "source", dbField: "source", nullable: true },
      { apiField: "payment_type", dbField: "payment_type", nullable: true },
      { apiField: "promo_code", dbField: "promo_code", nullable: true },
      { apiField: "offering_name", dbField: "offering_name", transformation: "Stored as TEXT[] array", nullable: true },
      { apiField: "seller_name", dbField: "seller_name", nullable: true },
      { apiField: "client.id", dbField: "client_id", transformation: "Flattened from nested client object", nullable: true },
      { apiField: "client.first_name", dbField: "client_first_name", transformation: "Flattened", nullable: true },
      { apiField: "client.last_name", dbField: "client_last_name", transformation: "Flattened", nullable: true },
      { apiField: "client.email", dbField: "client_email", transformation: "Flattened", nullable: true },
      { apiField: "client.phone", dbField: "client_phone", transformation: "Flattened", nullable: true },
      { apiField: "(full response)", dbField: "raw_data", transformation: "Complete API response as JSONB", nullable: true },
    ],
    fieldsNotPulled: [
      "created (unix timestamp — redundant with created_at)",
    ],
    nullFields: ["description", "invoice_id", "normalized_category", "seller_name", "promo_code", "client fields"],
    transformations: [
      "Client flattening: Extracts id, first_name, last_name, email, phone from nested client object",
      "Date rename: API created_at → DB created_at_api to avoid conflict with DB default",
      "ID rename: API id → DB payment_id to avoid conflict with DB uuid primary key",
      "Cursor resumption: Saves cursor after every page for crash recovery",
    ],
  },
  {
    id: "sling_users",
    name: "Sling Users",
    icon: <UserCheck className="h-5 w-5" />,
    description: "Syncs staff/employee records from Sling scheduling system.",
    edgeFunction: "sling-api (action: sync-users)",
    apiEndpoint: "/v1/{orgId}/users",
    pagination: "None (returns all users)",
    dateRange: {
      ahead: "N/A",
      behind: "N/A",
      default: "All active users",
    },
    targetTable: "sling_users",
    stagingTable: null,
    limitations: [
      "No pagination - fetches all users at once",
      "Email matching for profile linking is case-sensitive",
      "Position info limited to single position per user",
    ],
    fieldsMapped: [
      { apiField: "id", dbField: "sling_user_id", nullable: false },
      { apiField: "fname", dbField: "first_name", nullable: true },
      { apiField: "lname / lastname", dbField: "last_name", transformation: "Checks both 'lname' and 'lastname'", nullable: true },
      { apiField: "email", dbField: "email", nullable: true },
      { apiField: "active", dbField: "is_active", transformation: "Defaults to true if not false", nullable: false },
      { apiField: "position.id", dbField: "position_id", nullable: true },
      { apiField: "position.name", dbField: "position_name", nullable: true },
      { apiField: "position.name", dbField: "positions", transformation: "Wrapped in array for multi-position support", nullable: true },
      { apiField: "(full response)", dbField: "raw_data", nullable: true },
    ],
    fieldsNotPulled: [
      "createdAt",
      "phone number",
      "hire date",
      "hourly rate",
      "department/group assignments",
      "availability preferences",
      "time-off balances",
    ],
    nullFields: ["email", "position_id", "position_name", "linked_staff_id"],
    transformations: [
      "Last name: Checks both 'lname' and 'lastname' fields",
      "Active status: Defaults to true unless explicitly false",
      "Positions array: Wraps single position in array for future multi-position support",
      "Profile linking: Attempts email match with profiles table after sync",
    ],
  },
  {
    id: "sling_schedule",
    name: "Sling Schedule",
    icon: <Calendar className="h-5 w-5" />,
    description: "Syncs staff shift schedules from Sling roster endpoint.",
    edgeFunction: "sling-api (action: sync-shifts)",
    apiEndpoint: "/v1/{orgId}/reports/roster?dates={start}/{end}",
    pagination: "None (date-range based)",
    dateRange: {
      ahead: "Same day (configurable)",
      behind: "Same day (configurable)",
      default: "Today only",
    },
    targetTable: "staff_shifts",
    stagingTable: null,
    limitations: [
      "Shift ID format varies: may include date suffix (e.g., '12345:2025-01-30')",
      "Requires pre-existing sling_users records for FK constraint",
      "No pagination - single date range per request",
    ],
    fieldsMapped: [
      { apiField: "id (numeric part)", dbField: "sling_shift_id", transformation: "Extracts numeric ID before colon if present", nullable: false },
      { apiField: "id (full)", dbField: "external_id", nullable: true },
      { apiField: "user.id", dbField: "sling_user_id", transformation: "Only set if user exists in sling_users table", nullable: true },
      { apiField: "(from sling_users)", dbField: "user_name", transformation: "Looked up from sling_users table", nullable: true },
      { apiField: "position.name", dbField: "position", nullable: true },
      { apiField: "dtstart", dbField: "shift_start", nullable: false },
      { apiField: "dtend", dbField: "shift_end", nullable: false },
      { apiField: "status", dbField: "status", transformation: "Defaults to 'scheduled'", nullable: true },
      { apiField: "(full response)", dbField: "raw_data", nullable: true },
    ],
    fieldsNotPulled: [
      "location.id and location.name",
      "break times",
      "notes/comments",
      "approval status",
      "actual clock in/out times",
    ],
    nullFields: ["sling_user_id", "user_name", "position", "location"],
    transformations: [
      "Shift ID extraction: Parses '12345:2025-01-30' format to extract numeric 12345",
      "User name lookup: Pre-fetches sling_users and builds lookup map",
      "FK constraint: Only sets sling_user_id if user exists in sling_users table",
    ],
  },
  {
    id: "toast",
    name: "Toast POS",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Syncs point-of-sale transaction data from Toast (cafe/restaurant sales).",
    edgeFunction: "data-api (Toast endpoints)",
    apiEndpoint: "Toast API (configuration-based)",
    pagination: "Varies by endpoint",
    dateRange: {
      ahead: "N/A",
      behind: "Configurable (typically 7-30 days)",
      default: "Daily batch",
    },
    targetTable: "daily_reports (toast_sales field)",
    stagingTable: "toast_staging",
    limitations: [
      "Requires Toast API credentials configured",
      "Data stored as JSONB within daily_reports, not normalized",
      "Rate limits apply per Toast API documentation",
    ],
    fieldsMapped: [
      { apiField: "(varies)", dbField: "toast_sales (JSONB)", transformation: "Raw transaction data stored as JSON", nullable: true },
    ],
    fieldsNotPulled: [
      "Individual line items (aggregated only)",
      "Server/employee details",
      "Table assignments",
      "Modifier details",
    ],
    nullFields: ["toast_sales"],
    transformations: [
      "Data aggregation: Transaction details stored as JSON blob",
      "Date mapping: Mapped to daily report records",
    ],
  },
];

function FieldMappingTable({ fields }: { fields: FieldMapping[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">API Field</TableHead>
          <TableHead className="w-[180px]">Database Field</TableHead>
          <TableHead className="w-[100px]">Nullable</TableHead>
          <TableHead>Transformation</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field, idx) => (
          <TableRow key={idx}>
            <TableCell className="font-mono text-xs">{field.apiField}</TableCell>
            <TableCell className="font-mono text-xs">{field.dbField}</TableCell>
            <TableCell>
              {field.nullable ? (
                <Badge variant="secondary" className="text-xs">Yes</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">No</Badge>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {field.transformation || "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpointInfo }) {
  return (
    <Card className="border border-border rounded-none">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded">
            {endpoint.icon}
          </div>
          <div>
            <CardTitle className="text-lg">{endpoint.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {endpoint.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Edge Function</p>
            <p className="text-sm font-mono">{endpoint.edgeFunction}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Target Table</p>
            <p className="text-sm font-mono">{endpoint.targetTable}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Staging Table</p>
            <p className="text-sm font-mono">{endpoint.stagingTable || "None"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pagination</p>
            <p className="text-sm">{endpoint.pagination}</p>
          </div>
        </div>

        <Separator />

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Date Range Configuration
          </h4>
          <div className="grid grid-cols-3 gap-4 bg-muted/50 p-3 rounded">
            <div>
              <p className="text-xs text-muted-foreground">Days Ahead</p>
              <p className="text-sm font-medium">{endpoint.dateRange.ahead}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Days Behind</p>
              <p className="text-sm font-medium">{endpoint.dateRange.behind}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Default Behavior</p>
              <p className="text-sm font-medium">{endpoint.dateRange.default}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Accordion Sections */}
        <Accordion type="multiple" className="w-full">
          {/* Limitations */}
          <AccordionItem value="limitations">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Limitations ({endpoint.limitations.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm">
                {endpoint.limitations.map((limitation, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Field Mappings */}
          <AccordionItem value="fields">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Field Mappings ({endpoint.fieldsMapped.length} fields)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <FieldMappingTable fields={endpoint.fieldsMapped} />
            </AccordionContent>
          </AccordionItem>

          {/* Transformations */}
          <AccordionItem value="transformations">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Data Transformations ({endpoint.transformations.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm">
                {endpoint.transformations.map((transform, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{transform}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Fields Not Pulled */}
          <AccordionItem value="not-pulled">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                Available But Not Pulled ({endpoint.fieldsNotPulled.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {endpoint.fieldsNotPulled.map((field, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Null Fields */}
          <AccordionItem value="null-fields">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Frequently Null Fields ({endpoint.nullFields.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {endpoint.nullFields.map((field, idx) => (
                  <Badge key={idx} variant="secondary" className="font-mono text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* API Endpoint */}
        <div className="mt-4 p-3 bg-muted/50 rounded">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">API Endpoint</p>
          <code className="text-xs font-mono break-all">{endpoint.apiEndpoint}</code>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApiDataMappingPage() {
  return (
    <DashboardLayout title="API Data Mapping">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">
            API Data Mapping Reference
          </h2>
          <p className="text-xs text-muted-foreground tracking-wide max-w-2xl">
            Documentation of all API sync functions including field mappings, transformations, 
            limitations, and data availability from external endpoints.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Total Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">{API_ENDPOINTS.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Arketa APIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">
                {API_ENDPOINTS.filter(e => e.id.startsWith("arketa")).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Sling APIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">
                {API_ENDPOINTS.filter(e => e.id.startsWith("sling")).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                Other APIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-normal">
                {API_ENDPOINTS.filter(e => !e.id.startsWith("arketa") && !e.id.startsWith("sling")).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Cards */}
        <div className="space-y-6">
          {API_ENDPOINTS.map((endpoint) => (
            <EndpointCard key={endpoint.id} endpoint={endpoint} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
