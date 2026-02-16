/**
 * Backfill Configuration System
 * 
 * Unified configuration for all backfill sync operations.
 * Maps each data type to its sync parameters including endpoints,
 * staging tables, and batch settings.
 */

export interface BackfillEndpointConfig {
  apiSource: 'arketa' | 'sling';
  dataType: string;
  endpointPath: string;
  fieldsToFetch: string[];
  stagingTable: string;
  targetTable: string;
  uniqueKey: string;
  batchSize: number; // Should be 400 for all
}

export const BACKFILL_CONFIGS: Record<string, BackfillEndpointConfig> = {
  'arketa-clients': {
    apiSource: 'arketa',
    dataType: 'clients',
    endpointPath: '/clients',
    // API returns snake_case: client_id, first_name, last_name, email_mkt_opt_in, etc.
    fieldsToFetch: ['client_id', 'name', 'first_name', 'last_name', 'email', 'phone', 'tags', 'custom_fields', 'referrer', 'email_mkt_opt_in', 'sms_mkt_opt_in', 'date_of_birth', 'lifecycle_stage'],
    stagingTable: 'arketa_clients_staging',
    targetTable: 'arketa_clients',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'arketa-classes': {
    apiSource: 'arketa',
    dataType: 'classes',
    endpointPath: '/classes',
    fieldsToFetch: ['id', 'name', 'description', 'start_time', 'duration_minutes', 'instructor', 'instructor_name', 'room', 'capacity', 'max_capacity', 'total_booked', 'status', 'is_cancelled', 'cancelled', 'canceled', 'deleted', 'location_id', 'updated_at', 'waitlist_count'],
    stagingTable: 'arketa_classes_staging',
    targetTable: 'arketa_classes',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'arketa-reservations': {
    apiSource: 'arketa',
    dataType: 'reservations',
    endpointPath: '/reservations',
    fieldsToFetch: ['id', 'client_id', 'class_id', 'client', 'status', 'checked_in', 'checked_in_at', 'created_at', 'updated_at', 'cancelled_at', 'late_cancel', 'gross_amount_paid', 'net_amount_paid', 'spot_id', 'spot_name', 'reservation_type'],
    stagingTable: 'arketa_reservations_staging',
    targetTable: 'arketa_reservations',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'arketa-payments': {
    apiSource: 'arketa',
    dataType: 'payments',
    endpointPath: '/payments',
    fieldsToFetch: ['id', 'amount', 'status', 'created_at', 'currency', 'amount_refunded', 'description', 'invoice_id', 'normalized_category', 'net_sales', 'transaction_fees', 'tax', 'location_name', 'source', 'payment_type', 'promo_code', 'offering_name', 'seller_name', 'client'],
    stagingTable: 'arketa_payments_staging',
    targetTable: 'arketa_payments',
    uniqueKey: 'payment_id',
    batchSize: 25
  },
  'arketa-instructors': {
    apiSource: 'arketa',
    dataType: 'instructors',
    endpointPath: '/staff',
    // API returns snake_case: first_name, last_name, is_active, etc.
    fieldsToFetch: ['id', 'name', 'first_name', 'last_name', 'email', 'phone', 'role', 'active', 'is_active'],
    stagingTable: 'arketa_instructors_staging',
    targetTable: 'arketa_instructors',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'sling-shifts': {
    apiSource: 'sling',
    dataType: 'shifts',
    endpointPath: '/reports/roster',
    fieldsToFetch: ['id', 'userId', 'user', 'position', 'start', 'dtstart', 'end', 'dtend', 'location', 'status'],
    stagingTable: 'sling_shifts_staging',
    targetTable: 'staff_shifts',
    uniqueKey: 'sling_shift_id',
    batchSize: 400
  }
};

/**
 * Get the backfill configuration for a specific API source and data type
 */
export function getBackfillConfig(apiSource: string, dataType: string): BackfillEndpointConfig | null {
  const key = `${apiSource}-${dataType}`;
  return BACKFILL_CONFIGS[key] || null;
}

/**
 * Get all available config keys
 */
export function getAvailableBackfillTypes(): string[] {
  return Object.keys(BACKFILL_CONFIGS);
}

/**
 * Get configs filtered by API source
 */
export function getConfigsBySource(apiSource: 'arketa' | 'sling'): BackfillEndpointConfig[] {
  return Object.values(BACKFILL_CONFIGS).filter(config => config.apiSource === apiSource);
}
