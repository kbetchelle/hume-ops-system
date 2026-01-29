import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { 
  validateSessionToken, 
  validateStaffToken, 
  getTokenFromRequest, 
  getStaffTokenFromRequest, 
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse
} from '../_shared/auth.ts';

const TABLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  'daily_reports': { management: ['select', 'insert', 'update'], concierge: ['select'] },
  'daily_schedules': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'member_checkins': { management: ['select', 'insert', 'update'], concierge: ['select'] },
  'class_schedule': { management: ['select', 'insert', 'update'], concierge: ['select'], staff: ['select'] },
  'scheduled_tours': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select', 'update'] },
  'members': { management: ['select', 'insert', 'update'], concierge: ['select'] },
  'sling_users': { management: ['select', 'insert', 'update', 'delete'] },
  'api_sync_status': { management: ['select', 'insert', 'update'] },
  'api_logs': { management: ['select'] },
  'api_endpoints': { management: ['select', 'insert', 'update', 'delete'] },
  'system_alerts': { management: ['select', 'insert', 'update', 'delete'] },
  'announcements': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'documents': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'checklists': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'checklist_items': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'checklist_completions': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select', 'insert', 'update'], staff: ['select', 'insert', 'update'] },
  'daily_report_history': { management: ['select', 'insert', 'update'], concierge: ['select', 'insert', 'update'] },
  'trainer_assignments': { management: ['select', 'insert', 'update', 'delete'], trainer: ['select'] },
  'training_plans': { management: ['select', 'insert', 'update', 'delete'], trainer: ['select', 'insert', 'update', 'delete'] },
  'training_plan_content': { management: ['select', 'insert', 'update', 'delete'], trainer: ['select', 'insert', 'update', 'delete'] },
  'member_notes': { management: ['select', 'insert', 'update', 'delete'], trainer: ['select', 'insert', 'update', 'delete'] },
  'member_communications': { management: ['select', 'insert', 'delete'], concierge: ['select', 'insert'], trainer: ['select', 'insert'] },
  'email_templates': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], trainer: ['select'] },
  'assets': { management: ['select', 'insert', 'update', 'delete'] },
  'expenses': { management: ['select', 'insert', 'update', 'delete'] },
  // Phase 2 tables
  'staff_announcements': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'staff_announcement_reads': { management: ['select', 'insert'], concierge: ['select', 'insert'], staff: ['select', 'insert'] },
  'staff_messages': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select', 'insert'], staff: ['select', 'insert'] },
  'staff_message_reads': { management: ['select', 'insert'], concierge: ['select', 'insert'], staff: ['select', 'insert'] },
  'shift_reports': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select', 'insert', 'update'] },
  'club_policies': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'staff_qa': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select', 'insert'], staff: ['select', 'insert'] },
  'staff_notifications': { management: ['select', 'insert', 'update'], concierge: ['select', 'update'], staff: ['select', 'update'] },
  // Phase 3 tables
  'response_templates': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'quick_links': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
  'lost_and_found': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select', 'insert', 'update'] },
  'staff_documents': { management: ['select', 'insert', 'update', 'delete'], concierge: ['select'], staff: ['select'] },
};

function normalizeRole(role: string | undefined): string {
  if (!role) return 'staff';
  const lowerRole = role.toLowerCase();
  if (['admin', 'manager'].includes(lowerRole)) return 'management';
  if (lowerRole === 'concierge') return 'concierge';
  if (lowerRole === 'trainer') return 'trainer';
  return 'staff';
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const sessionValidation = await validateSessionToken(getTokenFromRequest(req));
  const staffValidation = await validateStaffToken(getStaffTokenFromRequest(req));

  if (!sessionValidation.valid && !staffValidation.valid) {
    return createUnauthorizedResponse('Authentication required', corsHeaders);
  }

  const rawRole = sessionValidation.valid ? sessionValidation.role : 'staff';
  const effectiveRole = normalizeRole(rawRole);

  try {
    const { action, table, data, filters, select, order, limit } = await req.json();

    if (!table || !action) {
      return createErrorResponse('Missing required fields: table and action', corsHeaders, 400);
    }

    const tablePerms = TABLE_PERMISSIONS[table];
    if (!tablePerms) {
      return createErrorResponse(`Table '${table}' is not accessible`, corsHeaders, 403);
    }

    const rolePerms = tablePerms[effectiveRole] || [];
    if (!rolePerms.includes(action)) {
      return createErrorResponse(
        `Action '${action}' not allowed for role '${effectiveRole}' on table '${table}'`,
        corsHeaders,
        403
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let result;

    switch (action) {
      case 'select': {
        let query: any = supabase.from(table).select(select || '*');
        if (filters) {
          for (const f of filters) {
            if (f.type === 'eq') query = query.eq(f.column, f.value);
            else if (f.type === 'neq') query = query.neq(f.column, f.value);
            else if (f.type === 'gt') query = query.gt(f.column, f.value);
            else if (f.type === 'gte') query = query.gte(f.column, f.value);
            else if (f.type === 'lt') query = query.lt(f.column, f.value);
            else if (f.type === 'lte') query = query.lte(f.column, f.value);
            else if (f.type === 'like') query = query.like(f.column, f.value);
            else if (f.type === 'ilike') query = query.ilike(f.column, f.value);
            else if (f.type === 'is') query = query.is(f.column, f.value);
            else if (f.type === 'in') query = query.in(f.column, f.value);
            else if (f.type === 'contains') query = query.contains(f.column, f.value);
            else if (f.type === 'containedBy') query = query.containedBy(f.column, f.value);
          }
        }
        if (order) {
          const orderConfig = Array.isArray(order) ? order : [order];
          for (const o of orderConfig) {
            query = query.order(o.column, { ascending: o.ascending ?? false });
          }
        }
        if (limit) query = query.limit(limit);
        result = await query;
        break;
      }
      case 'insert': {
        result = await supabase.from(table).insert(data).select();
        break;
      }
      case 'update': {
        let query: any = supabase.from(table).update(data);
        if (filters) {
          for (const f of filters) {
            if (f.type === 'eq') query = query.eq(f.column, f.value);
            else if (f.type === 'neq') query = query.neq(f.column, f.value);
            else if (f.type === 'in') query = query.in(f.column, f.value);
          }
        }
        result = await query.select();
        break;
      }
      case 'delete': {
        let query: any = supabase.from(table).delete();
        if (filters) {
          for (const f of filters) {
            if (f.type === 'eq') query = query.eq(f.column, f.value);
            else if (f.type === 'in') query = query.in(f.column, f.value);
          }
        }
        result = await query;
        break;
      }
      case 'upsert': {
        const upsertData = data.records || data;
        const options: { onConflict?: string; ignoreDuplicates?: boolean } = {};
        if (data.onConflict) options.onConflict = data.onConflict;
        if (data.ignoreDuplicates !== undefined) options.ignoreDuplicates = data.ignoreDuplicates;
        result = await supabase.from(table).upsert(upsertData, options).select();
        break;
      }
      default:
        return createErrorResponse(`Unknown action: ${action}`, corsHeaders, 400);
    }

    if (result.error) {
      console.error(`Database error on ${table}/${action}:`, result.error);
      return createErrorResponse(result.error.message, corsHeaders, 500);
    }

    return createSuccessResponse(result.data, corsHeaders);
  } catch (error) {
    console.error('Data API error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      corsHeaders,
      500
    );
  }
});
