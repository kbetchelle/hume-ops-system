/**
 * Token Management for API Authentication
 * Handles token storage, refresh, and expiration
 */

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
}

interface TokenStore {
  [apiName: string]: TokenData | null;
}

class TokenManager {
  private tokens: TokenStore = {};
  private refreshPromises: Map<string, Promise<string | null>> = new Map();

  // Buffer time before expiration to trigger refresh (5 minutes)
  private readonly REFRESH_BUFFER_MS = 5 * 60 * 1000;

  setToken(apiName: string, data: TokenData): void {
    this.tokens[apiName] = data;
  }

  getToken(apiName: string): string | null {
    const tokenData = this.tokens[apiName];
    if (!tokenData) return null;
    return tokenData.accessToken;
  }

  isTokenExpired(apiName: string): boolean {
    const tokenData = this.tokens[apiName];
    if (!tokenData) return true;
    return Date.now() >= tokenData.expiresAt;
  }

  isTokenExpiringSoon(apiName: string): boolean {
    const tokenData = this.tokens[apiName];
    if (!tokenData) return true;
    return Date.now() >= tokenData.expiresAt - this.REFRESH_BUFFER_MS;
  }

  getRefreshToken(apiName: string): string | null {
    const tokenData = this.tokens[apiName];
    return tokenData?.refreshToken || null;
  }

  clearToken(apiName: string): void {
    this.tokens[apiName] = null;
  }

  clearAllTokens(): void {
    this.tokens = {};
  }

  /**
   * Ensures only one refresh request happens at a time per API
   */
  async refreshToken(
    apiName: string,
    refreshFn: () => Promise<TokenData | null>
  ): Promise<string | null> {
    // If a refresh is already in progress, wait for it
    const existingPromise = this.refreshPromises.get(apiName);
    if (existingPromise) {
      return existingPromise;
    }

    // Start a new refresh
    const refreshPromise = (async () => {
      try {
        const newTokenData = await refreshFn();
        if (newTokenData) {
          this.setToken(apiName, newTokenData);
          return newTokenData.accessToken;
        }
        this.clearToken(apiName);
        return null;
      } catch (error) {
        console.error(`Token refresh failed for ${apiName}:`, error);
        this.clearToken(apiName);
        return null;
      } finally {
        this.refreshPromises.delete(apiName);
      }
    })();

    this.refreshPromises.set(apiName, refreshPromise);
    return refreshPromise;
  }
}

export const tokenManager = new TokenManager();
export type { TokenData };
