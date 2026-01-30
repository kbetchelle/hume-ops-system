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
    fieldsToFetch: ['id', 'name', 'firstName', 'lastName', 'email', 'phone', 'tags', 'customFields', 'referrer', 'emailOptIn', 'smsOptIn', 'dateOfBirth', 'lifecycleStage'],
    stagingTable: 'arketa_clients_staging',
    targetTable: 'arketa_clients',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'arketa-classes': {
    apiSource: 'arketa',
    dataType: 'classes',
    endpointPath: '/classes',
    fieldsToFetch: ['id', 'name', 'description', 'startTime', 'endTime', 'instructor', 'location', 'capacity', 'enrolled', 'status'],
    stagingTable: 'arketa_classes_staging',
    targetTable: 'arketa_classes',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'arketa-reservations': {
    apiSource: 'arketa',
    dataType: 'reservations',
    endpointPath: '/reservations',
    fieldsToFetch: ['id', 'clientId', 'classId', 'status', 'checkedIn', 'createdAt', 'cancelledAt'],
    stagingTable: 'arketa_reservations_staging',
    targetTable: 'arketa_reservations',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'arketa-payments': {
    apiSource: 'arketa',
    dataType: 'payments',
    endpointPath: '/purchases',
    fieldsToFetch: ['id', 'clientId', 'amount', 'currency', 'status', 'type', 'createdAt', 'description'],
    stagingTable: 'arketa_payments_staging',
    targetTable: 'arketa_payments',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'arketa-instructors': {
    apiSource: 'arketa',
    dataType: 'instructors',
    endpointPath: '/staff',
    fieldsToFetch: ['id', 'name', 'firstName', 'lastName', 'email', 'role', 'active'],
    stagingTable: 'arketa_instructors_staging',
    targetTable: 'arketa_instructors',
    uniqueKey: 'external_id',
    batchSize: 400
  },
  'sling-shifts': {
    apiSource: 'sling',
    dataType: 'shifts',
    endpointPath: '/reports/roster',
    fieldsToFetch: ['id', 'userId', 'position', 'start', 'end', 'location', 'status'],
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
