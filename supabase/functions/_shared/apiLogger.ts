import { SupabaseClient } from 'npm:@supabase/supabase-js@2';

interface LogData {
  apiName: string;
  endpoint: string;
  syncSuccess: boolean;
  durationMs: number;
  recordsProcessed: number;
  recordsInserted?: number;
  responseStatus?: number;
  responseBody?: unknown;
  rawResponse?: string;
  errorMessage?: string;
  triggeredBy?: string;
}

export async function logApiCall(supabase: SupabaseClient, data: LogData): Promise<void> {
  try {
    await supabase.from('api_logs').insert({
      api_name: data.apiName,
      endpoint: data.endpoint,
      sync_success: data.syncSuccess,
      duration_ms: data.durationMs,
      records_processed: data.recordsProcessed,
      records_inserted: data.recordsInserted || 0,
      response_status: data.responseStatus,
      response_body: data.syncSuccess ? null : data.responseBody,
      raw_response: data.syncSuccess ? null : (data.rawResponse ?? null),
      error_message: data.errorMessage,
      triggered_by: data.triggeredBy || 'manual',
    });

    await supabase
      .from('api_sync_status')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_success: data.syncSuccess,
        last_error_message: data.errorMessage || null,
        last_records_processed: data.recordsProcessed,
        last_records_inserted: data.recordsInserted || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('api_name', data.apiName);

    if (data.syncSuccess) {
      await supabase
        .from('system_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString(), 
          resolved_by: 'auto' 
        })
        .eq('api_name', data.apiName)
        .eq('is_resolved', false)
        .eq('auto_resolve_on_sync', true);
    }
  } catch (err) {
    console.error('Error logging API call:', err);
  }
}

export async function createAlert(
  supabase: SupabaseClient,
  apiName: string,
  alertType: string,
  message: string,
  severity: 'info' | 'warning' | 'critical' = 'warning',
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('system_alerts').insert({
      api_name: apiName,
      alert_type: alertType,
      severity,
      message,
      details,
      auto_resolve_on_sync: true,
    });
  } catch (err) {
    console.error('Error creating alert:', err);
  }
}

export async function getEndpointConfig(
  supabase: SupabaseClient,
  apiName: string,
  endpointType: string
): Promise<{ baseUrl: string; endpointPath: string; rateLimitPerMin: number } | null> {
  const { data, error } = await supabase
    .from('api_endpoints')
    .select('base_url, endpoint_path, rate_limit_per_min')
    .eq('api_name', apiName)
    .eq('endpoint_type', endpointType)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error(`Endpoint config not found for ${apiName}/${endpointType}:`, error);
    return null;
  }

  return {
    baseUrl: data.base_url,
    endpointPath: data.endpoint_path,
    rateLimitPerMin: data.rate_limit_per_min || 60,
  };
}

export function generateBatchId(): string {
  return crypto.randomUUID();
}
