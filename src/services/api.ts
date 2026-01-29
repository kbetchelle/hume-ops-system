/**
 * Generic API service
 * For specific API clients, see ./api-clients.ts
 */

// Re-export configured API clients
export {
  arketaClient,
  getSlingClient,
  toastClient,
  apiClients,
  setApiToken,
  clearApiToken,
  clearAllApiTokens,
} from "./api-clients";

// Re-export configuration utilities
export { apiConfig, validateConfig, isApiConfigured } from "@/lib/api-config";
export { apiLogger } from "@/lib/api-logger";
export { tokenManager } from "@/lib/token-manager";
