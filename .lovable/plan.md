
# API Management Infrastructure

## Overview
This plan implements a comprehensive database-driven API management system for tracking integrations with Arketa, Sling, Toast, and Calendly. The system includes endpoint configuration, sync status tracking, comprehensive logging, system alerts, and staging tables for raw API data before promotion to production tables.

## Database Schema

### 1. API Management Tables (4 tables)

**api_endpoints**
- Database-driven URL configuration for all external APIs
- Supports dynamic endpoint path templating (e.g., `/{partner_id}/classes`)
- Includes rate limiting and date range constraints per endpoint
- Pre-populated with all known endpoints for Arketa, Sling, Toast, and Calendly

**api_sync_status**
- Tracks last sync time, success state, and error messages per API
- Configurable sync frequency per integration
- Enable/disable toggle for each API

**api_logs**
- Comprehensive request/response logging
- Tracks duration, records processed/inserted, response status
- Supports triggered_by field: 'manual', 'cron', 'webhook'

**system_alerts**
- Alert types: 'api_failure', 'sync_stale', 'rate_limit'
- Severity levels: 'info', 'warning', 'critical'
- Resolution tracking with optional auto-resolve on successful sync

### 2. Staging Tables (6 tables)

**sling_staging** / **sling_shifts_staging**
- Raw staff user data and shift schedules from GetSling
- Batch ID tracking for data lineage

**toast_staging**
- Daily sales aggregates from Toast POS
- Preserves raw_data JSONB for debugging

**arketa_classes_staging** / **arketa_reservations_staging** / **arketa_clients_staging**
- Class schedules, reservations, and client data from Arketa
- Status tracking for reservations (reserved, checked_in, cancelled, no_show)

**calendly_events_staging**
- Tour booking events
- Invitee contact info and event status

### 3. Target/Production Tables (6 tables)

**sling_users** / **daily_schedules**
- Promoted Sling data with optional staff linkage

**daily_reports**
- Aggregated daily metrics from all sources
- Combined Arketa check-ins, class attendance, sales
- Toast cafe sales

**member_checkins** / **class_schedule**
- Promoted Arketa reservation and class data

**scheduled_tours**
- Promoted Calendly events with staff assignment

## Security (RLS Policies)

| Table | Admin/Manager | Other Roles |
|-------|--------------|-------------|
| api_endpoints | Full CRUD | Read-only |
| api_sync_status | Full CRUD | Read-only |
| api_logs | Full access | No access |
| system_alerts | Full CRUD | No access |
| All staging tables | Full access | No access |
| daily_reports | Full access | Concierge: Read |
| member_checkins | Full access | Trainer: Assigned only |
| class_schedule | Full access | Concierge: Read |
| scheduled_tours | Full access | Concierge: Read |
| sling_users | Full access | No access |
| daily_schedules | Full access | Concierge: Read |

## Implementation Steps

### Phase 1: Database Migration
1. Create all 16 new tables with proper constraints
2. Apply RLS policies for each table
3. Create indexes for performance (api_name, sync_batch_id, dates)
4. Insert default API endpoint configurations
5. Initialize api_sync_status for each API

### Phase 2: Edge Functions (4 functions)
1. **sync-sling** - Fetch users and shifts, stage data, promote to target tables
2. **sync-arketa-classes** - Fetch classes and reservations, update class_schedule and member_checkins
3. **sync-toast** - Fetch daily orders, aggregate sales metrics
4. **sync-calendly** - Fetch scheduled events, populate scheduled_tours

Each function will:
- Read endpoint config from api_endpoints table
- Create api_logs entry with timing
- Update api_sync_status on completion
- Create system_alerts on failure
- Use batch IDs for data versioning in staging tables

### Phase 3: Frontend Components

**API Status Dashboard** (`/dashboard/api-status`)
- Card for each API showing sync status, last sync time, health indicator
- Manual sync trigger buttons
- Error message display

**System Alerts Panel**
- Real-time alert list with severity badges
- Resolve/acknowledge actions
- Filter by API and severity

**API Logs Viewer**
- Paginated log table with search
- Duration and record count columns
- Expandable rows for response details

### Phase 4: Hooks and Services

**useApiSyncStatus** - Fetch and manage sync status
**useApiLogs** - Query logs with pagination
**useSystemAlerts** - CRUD for alerts with real-time updates
**useApiEndpoints** - Manage endpoint configurations

## Technical Details

### Edge Function Pattern
```text
+------------------+     +------------------+     +------------------+
|   api_endpoints  | --> |  Edge Function   | --> |  staging_table   |
|  (get config)    |     |  (fetch & log)   |     |  (raw data)      |
+------------------+     +------------------+     +------------------+
                                |                         |
                                v                         v
                         +------------------+     +------------------+
                         |   api_logs       |     |  target_table    |
                         |  (log request)   |     |  (promoted data) |
                         +------------------+     +------------------+
                                |
                                v
                         +------------------+
                         | api_sync_status  |
                         |  (update state)  |
                         +------------------+
```

### Batch ID Strategy
Each sync run generates a UUID batch ID. Staging tables store this ID to:
- Track which records came from which sync
- Enable rollback if needed
- Support data quality auditing

### New Secrets Required
- SLING_API_KEY
- TOAST_API_KEY
- TOAST_LOCATION_GUID (for Toast API)
- CALENDLY_API_KEY

## File Changes Summary

**New Files:**
- `supabase/migrations/[timestamp]_api_management.sql` - All 16 tables
- `supabase/functions/sync-sling/index.ts`
- `supabase/functions/sync-arketa-classes/index.ts`
- `supabase/functions/sync-toast/index.ts`
- `supabase/functions/sync-calendly/index.ts`
- `src/hooks/useApiSyncStatus.ts`
- `src/hooks/useApiLogs.ts`
- `src/hooks/useSystemAlerts.ts`
- `src/pages/dashboards/ApiStatusPage.tsx`
- `src/components/api/ApiStatusCard.tsx`
- `src/components/api/SystemAlertsPanel.tsx`
- `src/components/api/ApiLogsTable.tsx`

**Modified Files:**
- `src/App.tsx` - Add API status route
- `src/pages/dashboards/ManagerDashboard.tsx` - Add API status card
- `src/components/layout/DashboardLayout.tsx` - Add nav item for managers

## Notes
- The existing `sync-members` edge function and `member_sync_log` table will continue to work alongside the new system
- The new `api_logs` table provides more comprehensive logging than `member_sync_log`
- Consider migrating `sync-members` to use the new logging pattern in a future update
