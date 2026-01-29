import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const SLING_BASE_URL = 'https://api.getsling.com/v1';

interface SlingUser {
  id: number;
  name?: string;
  fname?: string;
  lname?: string;
  lastname?: string;
  email?: string;
  active?: boolean;
  position?: { id: number; name: string };
  createdAt?: string;
}

interface SlingShift {
  id: number;
  user?: { id: number; name?: string; email?: string };
  position?: { id: number; name?: string };
  location?: { id: number; name?: string };
  dtstart?: string;
  dtend?: string;
  status?: string;
}

interface ActionRequest {
  action: string;
  date?: string;
  shiftType?: 'AM' | 'PM';
}

// Helper to make authenticated requests to Sling API
async function slingFetch(endpoint: string, authToken: string, orgId: string): Promise<Response> {
  const url = `${SLING_BASE_URL}${endpoint}`;
  console.log(`[Sling API] Fetching: ${url}`);
  
  return await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json',
    },
  });
}

// Get all users from Sling
async function getUsers(authToken: string, orgId: string): Promise<SlingUser[]> {
  const response = await slingFetch(`/${orgId}/users`, authToken, orgId);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Get shift schedule (roster) for date range
async function getRoster(authToken: string, orgId: string, startDate: string, endDate: string): Promise<SlingShift[]> {
  const endpoint = `/${orgId}/reports/roster?dates=${startDate}/${endDate}`;
  const response = await slingFetch(endpoint, authToken, orgId);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch roster: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Get groups (positions/roles)
async function getGroups(authToken: string, orgId: string): Promise<any[]> {
  const response = await slingFetch(`/${orgId}/groups`, authToken, orgId);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Get who's working on a specific date
async function getWorkingOnDate(authToken: string, orgId: string, date: string): Promise<any> {
  const endpoint = `/${orgId}/calendar/working?date=${date}`;
  const response = await slingFetch(endpoint, authToken, orgId);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch working: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Format name from Sling user object
function formatUserName(user: SlingUser): string {
  if (user.name) return user.name;
  const first = user.fname || '';
  const last = user.lname || user.lastname || '';
  return `${first} ${last}`.trim() || 'Unknown';
}

// Parse shift to determine AM/PM
function getShiftType(shiftStart: string): 'AM' | 'PM' {
  const hour = new Date(shiftStart).getHours();
  return hour < 12 ? 'AM' : 'PM';
}

// Check if a time is within a shift
function isCurrentlyWorking(shiftStart: string, shiftEnd: string): boolean {
  const now = new Date();
  const start = new Date(shiftStart);
  const end = new Date(shiftEnd);
  return now >= start && now <= end;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const SLING_AUTH_TOKEN = Deno.env.get('SLING_AUTH_TOKEN');
    const SLING_ORG_ID = Deno.env.get('SLING_ORG_ID');

    if (!SLING_AUTH_TOKEN || !SLING_ORG_ID) {
      return new Response(
        JSON.stringify({ error: 'Sling API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, date, shiftType } = await req.json() as ActionRequest;
    const today = date || new Date().toISOString().split('T')[0];

    console.log(`[Sling API] Action: ${action}, Date: ${today}, ShiftType: ${shiftType}`);

    switch (action) {
      case 'get-current-workers': {
        // Get shifts for today from database
        const now = new Date();
        const { data: shifts, error } = await supabase
          .from('staff_shifts')
          .select('*')
          .eq('shift_date', today);

        if (error) throw error;

        const currentlyWorking = (shifts || []).filter(s => 
          isCurrentlyWorking(s.shift_start, s.shift_end)
        );

        const details = currentlyWorking.map(s => ({
          slingUserId: s.sling_user_id,
          staffId: s.id,
          name: s.user_name || s.staff_name || 'Unknown',
          position: s.position || s.position_name,
          shiftStart: s.shift_start,
          shiftEnd: s.shift_end,
        }));

        return new Response(
          JSON.stringify({
            success: true,
            currentlyWorking: currentlyWorking.map(s => s.id),
            details,
            totalShiftsToday: shifts?.length || 0,
            currentTime: now.toISOString(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-todays-schedule': {
        const { data: shifts, error } = await supabase
          .from('staff_shifts')
          .select('*')
          .eq('shift_date', today)
          .order('shift_start', { ascending: true });

        if (error) throw error;

        const schedule = (shifts || []).map(s => ({
          slingUserId: s.sling_user_id,
          staffId: s.id,
          name: s.user_name || s.staff_name || 'Unknown',
          position: s.position || s.position_name,
          location: s.location || s.location_name,
          shiftStart: s.shift_start,
          shiftEnd: s.shift_end,
          isCurrentlyWorking: isCurrentlyWorking(s.shift_start, s.shift_end),
        }));

        return new Response(
          JSON.stringify({ success: true, schedule, date: today }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-foh-shift-staff': {
        if (!shiftType) {
          return new Response(
            JSON.stringify({ error: 'shiftType parameter required (AM or PM)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: shifts, error } = await supabase
          .from('staff_shifts')
          .select('*')
          .eq('shift_date', today);

        if (error) throw error;

        // Filter by shift type (AM = before noon start, PM = noon or after)
        const filteredShifts = (shifts || []).filter(s => {
          const shiftStartType = getShiftType(s.shift_start);
          return shiftStartType === shiftType;
        });

        const staffNames = filteredShifts.map(s => s.user_name || s.staff_name || 'Unknown');

        return new Response(
          JSON.stringify({ success: true, staffNames, shiftType, count: staffNames.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync-users': {
        console.log('[Sling API] Starting user sync...');
        
        // Fetch users from Sling API
        const users = await getUsers(SLING_AUTH_TOKEN, SLING_ORG_ID);
        console.log(`[Sling API] Fetched ${users.length} users from Sling`);

        let matchedCount = 0;
        const syncedUsers = [];

        for (const user of users) {
          const firstName = user.fname || '';
          const lastName = user.lname || user.lastname || '';
          const fullName = formatUserName(user);
          const email = user.email || null;

          // Upsert to sling_users table
          const { data: upserted, error } = await supabase
            .from('sling_users')
            .upsert({
              sling_user_id: user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              is_active: user.active !== false,
              position_id: user.position?.id || null,
              position_name: user.position?.name || null,
              positions: user.position?.name ? [user.position.name] : [],
              raw_data: user,
              last_synced_at: new Date().toISOString(),
            }, {
              onConflict: 'sling_user_id',
            })
            .select()
            .single();

          if (error) {
            console.error(`[Sling API] Failed to upsert user ${user.id}:`, error);
            continue;
          }

          // Try to match with profiles by email
          if (email) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, user_id')
              .eq('email', email)
              .maybeSingle();

            if (profile) {
              matchedCount++;
              // Update linked_staff_id
              await supabase
                .from('sling_users')
                .update({ linked_staff_id: profile.user_id })
                .eq('sling_user_id', user.id);
            }
          }

          syncedUsers.push({
            slingUserId: user.id,
            name: fullName,
            email: email,
            isActive: user.active !== false,
          });
        }

        // Update sync status
        await supabase
          .from('api_sync_status')
          .upsert({
            api_name: 'sling',
            last_sync_at: new Date().toISOString(),
            last_sync_success: true,
            last_records_processed: users.length,
            last_records_inserted: syncedUsers.length,
          }, { onConflict: 'api_name' });

        return new Response(
          JSON.stringify({
            success: true,
            users: syncedUsers,
            matchedCount,
            totalSlingUsers: users.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync-shifts': {
        const startDate = date || today;
        const endDate = date || today;

        console.log(`[Sling API] Syncing shifts for ${startDate} to ${endDate}...`);
        
        // Fetch roster from Sling API
        const roster = await getRoster(SLING_AUTH_TOKEN, SLING_ORG_ID, startDate, endDate);
        console.log(`[Sling API] Fetched ${roster.length} shifts from Sling`);

        const syncedShifts = [];

        for (const shift of roster) {
          if (!shift.dtstart || !shift.dtend) continue;

          const shiftDate = new Date(shift.dtstart).toISOString().split('T')[0];
          const userName = shift.user?.name || 'Unknown';

          // Upsert to staff_shifts table
          const { data: upserted, error } = await supabase
            .from('staff_shifts')
            .upsert({
              sling_shift_id: shift.id,
              sling_user_id: shift.user?.id || 0,
              external_id: String(shift.id),
              user_name: userName,
              user_email: shift.user?.email || null,
              position: shift.position?.name || null,
              location: shift.location?.name || null,
              shift_start: shift.dtstart,
              shift_end: shift.dtend,
              shift_date: shiftDate,
              status: shift.status || 'scheduled',
              raw_data: shift,
              synced_at: new Date().toISOString(),
            }, {
              onConflict: 'sling_shift_id',
            })
            .select();

          if (error) {
            console.error(`[Sling API] Failed to upsert shift ${shift.id}:`, error);
            continue;
          }

          syncedShifts.push({
            shiftId: shift.id,
            userId: shift.user?.id,
            userName,
            position: shift.position?.name,
            shiftStart: shift.dtstart,
            shiftEnd: shift.dtend,
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            shifts: syncedShifts,
            totalShifts: roster.length,
            syncedCount: syncedShifts.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-groups': {
        const groups = await getGroups(SLING_AUTH_TOKEN, SLING_ORG_ID);
        
        return new Response(
          JSON.stringify({
            success: true,
            groups: groups.map(g => ({
              id: g.id,
              name: g.name || g.title || g.label || 'Unknown',
            })),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[Sling API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
