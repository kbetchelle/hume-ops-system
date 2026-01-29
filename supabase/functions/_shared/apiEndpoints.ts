import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ApiEndpointConfig {
  baseUrl: string;
  endpointPath: string;
  fullUrl: string;
  maxDateRangeDays: number | null;
  rateLimitPerMin: number | null;
}

export async function getApiEndpointConfig(
  supabase: SupabaseClient,
  apiName: string,
  endpointType: string
): Promise<ApiEndpointConfig | null> {
  const { data, error } = await supabase
    .from('api_endpoints')
    .select('*')
    .eq('api_name', apiName)
    .eq('endpoint_type', endpointType)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    baseUrl: data.base_url,
    endpointPath: data.endpoint_path,
    fullUrl: `${data.base_url}${data.endpoint_path}`,
    maxDateRangeDays: data.max_date_range_days,
    rateLimitPerMin: data.rate_limit_per_min,
  };
}

export function buildEndpointUrl(
  config: ApiEndpointConfig,
  params: Record<string, string>
): string {
  let url = config.fullUrl;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{${key}}`, value);
  }
  return url;
}
