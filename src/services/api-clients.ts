import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiConfig } from "@/lib/api-config";
import { apiLogger } from "@/lib/api-logger";
import { tokenManager, TokenData } from "@/lib/token-manager";

// Extended config to track request timing
interface RequestConfigWithMeta extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

/**
 * Create a configured axios instance with interceptors
 */
function createApiClient(
  apiName: string,
  baseURL: string,
  options?: {
    authHeaderName?: string;
    authPrefix?: string;
    refreshTokenFn?: () => Promise<TokenData | null>;
  }
): AxiosInstance {
  const { authHeaderName = "Authorization", authPrefix = "Bearer", refreshTokenFn } = options || {};

  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    async (config: RequestConfigWithMeta) => {
      // Add timing metadata
      config.metadata = { startTime: Date.now() };

      // Check if token needs refresh
      if (refreshTokenFn && tokenManager.isTokenExpiringSoon(apiName)) {
        await tokenManager.refreshToken(apiName, refreshTokenFn);
      }

      // Add authentication header
      const token = tokenManager.getToken(apiName);
      if (token) {
        config.headers[authHeaderName] = `${authPrefix} ${token}`;
      }

      // Log request
      apiLogger.logRequest(
        config.method || "GET",
        `${baseURL}${config.url}`,
        config.data
      );

      return config;
    },
    (error) => {
      apiLogger.logError("REQUEST", baseURL, error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      const config = response.config as RequestConfigWithMeta;
      const duration = config.metadata
        ? Date.now() - config.metadata.startTime
        : 0;

      apiLogger.logResponse(
        config.method || "GET",
        `${baseURL}${config.url}`,
        response.status,
        duration,
        response.data
      );

      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as RequestConfigWithMeta | undefined;
      const duration = config?.metadata
        ? Date.now() - config.metadata.startTime
        : 0;

      // Log error
      apiLogger.logError(
        config?.method || "UNKNOWN",
        config ? `${baseURL}${config.url}` : baseURL,
        {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
          duration,
        }
      );

      // Handle 401 - attempt token refresh
      if (error.response?.status === 401 && refreshTokenFn && config) {
        const newToken = await tokenManager.refreshToken(apiName, refreshTokenFn);
        
        if (newToken) {
          // Retry the original request with new token
          config.headers[authHeaderName] = `${authPrefix} ${newToken}`;
          return client.request(config);
        }
      }

      // Transform error for consistent handling
      const enhancedError = {
        ...error,
        apiName,
        statusCode: error.response?.status,
        errorMessage: extractErrorMessage(error),
      };

      return Promise.reject(enhancedError);
    }
  );

  return client;
}

/**
 * Extract a user-friendly error message
 */
function extractErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (typeof data.error_description === "string") return data.error_description;
  }
  
  if (error.message) return error.message;
  
  return "An unexpected error occurred";
}

// ============================================
// API Client Instances
// ============================================

/**
 * Arketa API Client
 * Uses OAuth2 client credentials flow
 */
export const arketaClient = createApiClient("arketa", apiConfig.arketa.apiUrl, {
  refreshTokenFn: async () => {
    // Token refresh should be handled by edge function for security
    // This is a placeholder - implement via edge function call
    console.warn("Arketa token refresh should be implemented via edge function");
    return null;
  },
});

/**
 * GetSling API Client
 * Uses API key authentication
 */
export const getSlingClient = createApiClient("getSling", apiConfig.getSling.apiUrl, {
  authHeaderName: "Authorization",
  authPrefix: "Bearer",
});

/**
 * Toast API Client
 * Uses API key authentication
 */
export const toastClient = createApiClient("toast", apiConfig.toast.apiUrl, {
  authHeaderName: "Authorization",
  authPrefix: "Bearer",
});

// ============================================
// Helper Functions
// ============================================

/**
 * Set authentication token for an API
 */
export function setApiToken(
  apiName: "arketa" | "getSling" | "toast",
  accessToken: string,
  expiresInSeconds: number,
  refreshToken?: string
): void {
  tokenManager.setToken(apiName, {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
}

/**
 * Clear authentication for an API
 */
export function clearApiToken(apiName: "arketa" | "getSling" | "toast"): void {
  tokenManager.clearToken(apiName);
}

/**
 * Clear all API tokens (useful for logout)
 */
export function clearAllApiTokens(): void {
  tokenManager.clearAllTokens();
}

// Export client map for dynamic access
export const apiClients = {
  arketa: arketaClient,
  getSling: getSlingClient,
  toast: toastClient,
} as const;
