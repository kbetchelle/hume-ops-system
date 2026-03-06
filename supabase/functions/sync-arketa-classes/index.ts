/**
 * sync-arketa-classes: Populate arketa_classes for a date range via staging.
 * Fetches from API → inserts into arketa_classes_staging → upserts to arketa_classes via RPC → deletes staging.
 *
 * API spec (as of 2026-02):
 * - Pagination: use full `nextStartAfterId` value (e.g. "classes%2FP8k22...") as `start_after` param
 * - Page size: max `limit=100`
 * - Date filtering: `start_date` and `end_date` query params
 * - `include_canceled=true` to include cancelled classes
 *
 * Supports `start_after_id` body param for cursor-based backfill resumption.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { getArketaApiKeyHeaders, ARKETA_URLS } from '../_shared/arketaAuth.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

interface SyncClassesRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  /** Cursor-based backfill: start pagination from this cursor value */
  start_after_id?: string;
  triggeredBy?: string;
  /** When true, skip logging to api_logs (caller will handle it) */
  skipLogging?: boolean;
  /** Parent log ID from wrapper function */
  parentLogId?: string;
}

const MAX_PAGES = 30;
const PAGE_LIMIT = 100; // API max
const WALL_CLOCK_TIMEOUT_MS = 50_000; // 50s safety margin (gateway is 60s)

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse body FIRST so it's available for skipLogging checks below
    const body = (await req.json().catch(() => ({}))) as SyncClassesRequest;

    const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
    const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');

    if (!ARKETA_API_KEY || !ARKETA_PARTNER_ID) {
      const errMsg = 'Arketa API credentials not configured';
      if (!body.skipLogging) {
        await logApiCall(supabase, {
          apiName: 'arketa_classes', endpoint: '/classes',
          syncSuccess: false, durationMs: Date.now() - startTime,
          recordsProcessed: 0, errorMessage: errMsg,
        });
      }
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const headers = getArketaApiKeyHeaders(ARKETA_API_KEY);
    const triggeredBy = body.triggeredBy ?? 'manual';
    const skipLogging = body.skipLogging === true;

    // Date range (default -7 to +30 days)
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    const startDate = body.startDate ?? body.start_date ?? defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate ?? body.end_date ?? defaultEnd.toISOString().split('T')[0];

    // --- Helpers ---

    const parseClassList = (data: unknown): any[] => {
      if (Array.isArray(data)) return data;
      const obj = data as Record<string, unknown>;
      return (obj.items ?? obj.data ?? obj.classes ?? []) as any[];
    };

    const extractPagination = (data: unknown): { nextStartAfterId?: string; hasMore?: boolean } => {
      const obj = data as Record<string, unknown>;
      const p = obj.pagination as Record<string, unknown> | undefined;
      if (!p) return {};
      return {
        nextStartAfterId: (p.nextStartAfterId ?? p.nextCursor) as string | undefined,
        hasMore: p.hasMore as boolean | undefined,
      };
    };

    const extractClassDate = (cls: any): string | null => {
      const st = cls.start_time ?? cls.startTime;
      if (!st) return cls.start_date ?? cls.startDate ?? cls.date ?? cls.class_date ?? null;
      try {
        const dtf = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Los_Angeles',
          year: 'numeric', month: '2-digit', day: '2-digit',
        });
        return dtf.format(new Date(st));
      } catch { return null; }
    };

    /**
     * Decode the nextStartAfterId cursor before passing to URL.searchParams.set().
     * The API returns e.g. "classes%2FP8k22..." (URL-encoded in JSON).
     * searchParams.set() will re-encode it, so we decode first to avoid double-encoding.
     */
    const decodeCursor = (cursor: string): string => {
      try {
        return decodeURIComponent(cursor);
      } catch {
        return cursor; // Already decoded or not encoded
      }
    };

    /** Check if we're approaching the gateway timeout */
    const isNearTimeout = (): boolean => {
      return (Date.now() - startTime) >= WALL_CLOCK_TIMEOUT_MS;
    };

    // --- Fetch location map → room_name lookup ---
    const roomNameMap = new Map<string, string>();
    try {
      const locUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/locations`;
      console.log('[classes-sync] Fetching locations for room name lookup...');
      const { response: locResp } = await fetchWithRetry(locUrl, { method: 'GET', headers });
      if (locResp.ok) {
        const locData = await locResp.json();
        const locItems = (locData as any)?.items ?? [];
        for (const loc of locItems) {
          if (loc.id && loc.name) roomNameMap.set(String(loc.id), loc.name);
        }
        console.log(`[classes-sync] Loaded ${roomNameMap.size} room names from locations`);
      } else {
        console.log(`[classes-sync] Locations fetch returned ${locResp.status}, proceeding without room names`);
      }
    } catch (err) {
      console.log(`[classes-sync] Locations fetch failed: ${err}, proceeding without room names`);
    }

    const classesBaseUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/classes`;

    // --- Paginated fetch with start_date/end_date and start_after cursor ---
    const allClasses: any[] = [];
    let totalPages = 0;
    let nextStartAfterId: string | undefined;
    let apiHasMore = false;
    let timedOut = false;
    let apiErrorMessage: string | undefined;

    // Build first page URL
    const initialCursor = body.start_after_id; // May be provided for backfill resumption

    let currentCursor: string | undefined = initialCursor;
    let keepPaginating = true;

    while (keepPaginating && totalPages < MAX_PAGES) {
      // Wall-clock timeout protection
      if (isNearTimeout()) {
        console.warn(`[classes-sync] Approaching gateway timeout after ${totalPages} pages, stopping gracefully`);
        apiHasMore = true; // Signal there may be more
        timedOut = true;
        break;
      }

      const url = new URL(classesBaseUrl);
      url.searchParams.set('limit', String(PAGE_LIMIT));
      url.searchParams.set('start_date', startDate);
      url.searchParams.set('end_date', endDate);
      // FIX #1: Include cancelled classes so they're synced and tracked
      url.searchParams.set('include_canceled', 'true');

      if (currentCursor) {
        // Decode cursor to avoid double-encoding by searchParams.set()
        url.searchParams.set('start_after', decodeCursor(currentCursor));
      }

      const pageNum = totalPages + 1;
      console.log(`[classes-sync] Fetching page ${pageNum}: ${url.searchParams.toString()}`);

      try {
        const { response } = await fetchWithRetry(url.toString(), { method: 'GET', headers });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          console.warn(`[classes-sync] Page ${pageNum} returned HTTP ${response.status}, stopping pagination. Body: ${errorBody.slice(0, 200)}`);
          
          // Surface HTTP errors in the final response
          if (!apiErrorMessage) {
            apiErrorMessage = `Arketa API returned HTTP ${response.status} on page ${pageNum}`;
          }
          break;
        }

        const data = await response.json();
        const pageClasses = parseClassList(data);
        const pagination = extractPagination(data);

        console.log(`[classes-sync] Page ${pageNum}: ${pageClasses.length} classes, hasMore=${pagination.hasMore}, nextCursor=${pagination.nextStartAfterId ?? 'none'}`);

        allClasses.push(...pageClasses);
        totalPages++;

        // Update cursor state
        nextStartAfterId = pagination.nextStartAfterId;
        apiHasMore = pagination.hasMore ?? false;

        // Stop if no more pages or no cursor
        if (!pagination.hasMore || !pagination.nextStartAfterId) {
          keepPaginating = false;
        } else {
          currentCursor = pagination.nextStartAfterId;
        }

        // Stop if page returned fewer than limit (last page)
        if (pageClasses.length < PAGE_LIMIT) {
          keepPaginating = false;
        }
      } catch (err) {
        console.warn(`[classes-sync] Pagination error on page ${pageNum}: ${err}`);
        break;
      }
    }

    if (totalPages >= MAX_PAGES) {
      console.warn(`[classes-sync] Hit MAX_PAGES cap (${MAX_PAGES}), there may be more classes`);
    }

    const strategy = body.start_after_id ? 'cursor_backfill' : 'paginated_date_range';
    console.log(`[classes-sync] Final: ${allClasses.length} classes via '${strategy}' (${totalPages} pages) for range ${startDate}–${endDate}`);

    // FIX #3: Local date validation — filter out records outside requested range
    const filteredClasses = allClasses.filter(cls => {
      const classDate = extractClassDate(cls);
      if (!classDate) return true; // Keep if we can't determine date
      return classDate >= startDate && classDate <= endDate;
    });

    if (filteredClasses.length !== allClasses.length) {
      console.log(`[classes-sync] Filtered ${allClasses.length - filteredClasses.length} out-of-range classes (kept ${filteredClasses.length})`);
    }

    // FIX #9: Warn on empty response for expected data
    if (filteredClasses.length === 0 && totalPages > 0) {
      console.warn(`[classes-sync] WARNING: API returned 200 OK but 0 classes for range ${startDate}–${endDate}. This may indicate an upstream issue.`);
    }

    // --- Stage and upsert ---
    const syncBatchId = crypto.randomUUID();
    const syncedAt = new Date().toISOString();

    // FIX #5: Deduplicate by external_id + class_date before staging
    const seenKeys = new Set<string>();
    const stagingRows: Record<string, unknown>[] = [];

    const skippedRows: { api_name: string; record_id: string; reason: string; secondary_id?: string; details?: Record<string, unknown> }[] = [];

    for (const cls of filteredClasses) {
      const startTimeVal = cls.start_time ?? cls.startTime;
      if (!startTimeVal) {
        skippedRows.push({
          api_name: 'arketa_classes',
          record_id: String(cls.id ?? 'unknown'),
          reason: 'missing_start_time',
          secondary_id: cls.name ?? cls.class_name ?? null,
          details: { class_date: cls.date ?? cls.class_date ?? null, raw_keys: Object.keys(cls) },
        });
        continue;
      }

      const name = cls.name ?? cls.class_name ?? 'Unknown Class';
      const instructorName = cls.instructor_name ??
        (cls.instructor ? `${cls.instructor.first_name ?? ''} ${cls.instructor.last_name ?? ''}`.trim() : null);
      const classDate = extractClassDate(cls) ?? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(startTimeVal));

      const externalId = String(cls.id);
      const dedupeKey = `${externalId}::${classDate}`;
      if (seenKeys.has(dedupeKey)) {
        continue; // Skip duplicate
      }
      seenKeys.add(dedupeKey);

      const locationId = cls.location_id ?? null;
      const roomName = locationId ? (roomNameMap.get(String(locationId)) ?? null) : null;

      stagingRows.push({
        external_id: externalId,
        class_date: classDate,
        start_time: startTimeVal,
        duration_minutes: cls.duration_minutes ?? cls.duration ?? null,
        name,
        capacity: cls.capacity ?? cls.max_capacity ?? null,
        instructor_name: instructorName,
        is_cancelled: cls.is_cancelled ?? cls.cancelled ?? cls.canceled ?? false,
        is_deleted: cls.deleted ?? false,
        description: cls.description ?? null,
        booked_count: cls.total_booked ?? cls.booked_count ?? 0,
        waitlist_count: cls.waitlist_count ?? 0,
        status: cls.status ?? 'scheduled',
        room_name: roomName,
        location_id: locationId,
        location_name: 'HUME',
        updated_at_api: cls.updated_at ?? cls.updatedAt ?? null,
        raw_data: cls,
        synced_at: syncedAt,
        sync_batch_id: syncBatchId,
      });
    }

    const duplicatesSkipped = filteredClasses.length - stagingRows.length - skippedRows.length;
    if (duplicatesSkipped > 0) {
      console.log(`[classes-sync] Deduplicated: skipped ${duplicatesSkipped} duplicate external_id+class_date pairs`);
    }

    // Log skipped records to api_sync_skipped_records
    if (skippedRows.length > 0) {
      console.log(`[classes-sync] Logging ${skippedRows.length} skipped records (missing start_time)`);
      const { error: skipErr } = await supabase.from('api_sync_skipped_records').insert(skippedRows);
      if (skipErr) {
        console.warn(`[classes-sync] Failed to log skipped records: ${skipErr.message}`);
      }
    }

    if (stagingRows.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < stagingRows.length; i += chunkSize) {
        const chunk = stagingRows.slice(i, i + chunkSize);
        const { error } = await supabase.from('arketa_classes_staging').insert(chunk);
        if (error) {
          const durationMs = Date.now() - startTime;
          if (!skipLogging) {
            await logApiCall(supabase, {
              apiName: 'arketa_classes', endpoint: '/classes',
              syncSuccess: false, durationMs, recordsProcessed: stagingRows.length,
              errorMessage: `Staging insert failed: ${error.message}`, triggeredBy,
            });
          }
          return new Response(
            JSON.stringify({ success: false, error: error.message, details: 'staging insert failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const { data: upsertedCount, error: rpcError } = await supabase.rpc('upsert_arketa_classes_from_staging', {
      p_sync_batch_id: syncBatchId,
    });

    if (rpcError) {
      const durationMs = Date.now() - startTime;
      if (!skipLogging) {
        await logApiCall(supabase, {
          apiName: 'arketa_classes', endpoint: '/classes',
          syncSuccess: false, durationMs, recordsProcessed: stagingRows.length,
          errorMessage: `Upsert RPC failed: ${rpcError.message}`, triggeredBy,
        });
      }
      return new Response(
        JSON.stringify({ success: false, error: rpcError.message, details: 'upsert from staging failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const syncedCount = typeof upsertedCount === 'number' ? upsertedCount : stagingRows.length;
    const durationMs = Date.now() - startTime;

    if (!skipLogging) {
      const syncWasSuccessful = !apiErrorMessage || syncedCount > 0;
      await logApiCall(supabase, {
        apiName: 'arketa_classes',
        endpoint: '/classes',
        syncSuccess: syncWasSuccessful,
        durationMs,
        recordsProcessed: filteredClasses.length,
        recordsInserted: syncedCount,
        recordsSkipped: duplicatesSkipped,
        skipReasons: duplicatesSkipped > 0 ? { duplicate_external_id: duplicatesSkipped } : undefined,
        responseStatus: apiErrorMessage ? 500 : 200,
        errorMessage: apiErrorMessage ?? undefined,
        triggeredBy,
        parentLogId: body.parentLogId,
      });
    }

    const hadApiError = !!apiErrorMessage && syncedCount === 0;
    const result = {
      success: !hadApiError,
      syncedCount,
      totalFetched: allClasses.length,
      filteredCount: filteredClasses.length,
      duplicatesSkipped,
      pagesFetched: totalPages,
      startDate,
      endDate,
      strategy,
      durationMs,
      timedOut,
      nextStartAfterId: nextStartAfterId ?? null,
      hasMore: apiHasMore,
      ...(apiErrorMessage ? { apiError: apiErrorMessage } : {}),
    };

    console.log(`[classes-sync] Complete: ${syncedCount} upserted, ${filteredClasses.length} filtered, ${totalPages} pages, ${durationMs}ms`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startTime;

    // Log failure
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await logApiCall(supabase, {
        apiName: 'arketa_classes', endpoint: '/classes',
        syncSuccess: false, durationMs, recordsProcessed: 0,
        errorMessage: message,
      });
    } catch (logErr) {
      console.error('[classes-sync] Failed to log error:', logErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
