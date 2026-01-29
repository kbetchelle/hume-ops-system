import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';

// Use Dev base URL for staff endpoint as specified
const ARKETA_DEV_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApiDev/v0';

interface ArketaInstructor {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  is_active?: boolean;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
    const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');

    if (!ARKETA_API_KEY || !ARKETA_PARTNER_ID) {
      return new Response(
        JSON.stringify({ error: 'Arketa API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Arketa Instructors] Syncing instructors...');

    // Fetch staff from Arketa API (using Dev URL as specified) with retry
    const url = `${ARKETA_DEV_URL}/${ARKETA_PARTNER_ID}/staff`;
    
    const { response, attempts } = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'x-api-key': ARKETA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Arketa API error: ${response.status} - ${errorText}`);
    }

    console.log(`[Arketa Instructors] API request succeeded after ${attempts} attempt(s)`);

    const instructors: ArketaInstructor[] = await response.json();
    console.log(`[Arketa Instructors] Fetched ${instructors.length} instructors`);

    const syncedInstructors = [];
    let failedCount = 0;

    for (const instructor of instructors) {
      let firstName = instructor.first_name || '';
      let lastName = instructor.last_name || '';
      
      // Parse name if first/last not provided
      if (!firstName && !lastName && instructor.name) {
        const nameParts = instructor.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      const isActive = instructor.is_active ?? (instructor.status === 'active');

      try {
        const { result } = await withRetry(
          async () => {
            const { error } = await supabase
              .from('arketa_instructors')
              .upsert({
                external_id: String(instructor.id),
                first_name: firstName,
                last_name: lastName,
                email: instructor.email || null,
                phone: instructor.phone || null,
                is_active: isActive,
                raw_data: instructor,
                synced_at: new Date().toISOString(),
              }, {
                onConflict: 'external_id',
              });

            if (error && !isRetryableSupabaseError(error)) {
              throw error;
            }
            return { error };
          },
          { maxAttempts: 2 },
          `upsert instructor ${instructor.id}`
        );

        if (result.error) {
          console.error(`[Arketa Instructors] Failed to upsert instructor ${instructor.id}:`, result.error);
          failedCount++;
          continue;
        }

        syncedInstructors.push({
          id: instructor.id,
          name: `${firstName} ${lastName}`.trim(),
          email: instructor.email,
          isActive,
        });
      } catch (error) {
        console.error(`[Arketa Instructors] Error upserting instructor ${instructor.id}:`, error);
        failedCount++;
      }
    }

    // Update sync status
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_instructors',
        last_sync_at: new Date().toISOString(),
        last_sync_success: true,
        last_records_processed: instructors.length,
        last_records_inserted: syncedInstructors.length,
      }, { onConflict: 'api_name' });

    return new Response(
      JSON.stringify({
        success: true,
        instructors: syncedInstructors,
        totalFetched: instructors.length,
        syncedCount: syncedInstructors.length,
        failedCount,
        apiAttempts: attempts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Arketa Instructors] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
