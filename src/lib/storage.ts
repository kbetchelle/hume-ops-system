/**
 * Safe localStorage wrapper that handles:
 * - Safari private browsing (throws QuotaExceededError)
 * - Storage quota exceeded errors
 * - JSON parsing errors
 * - Missing/corrupted data
 */

/**
 * Check if localStorage is available and working
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely get an item from localStorage
 * Returns defaultValue if key doesn't exist or on any error
 */
export function getStorageItem(key: string, defaultValue: string = ""): string {
  try {
    const value = localStorage.getItem(key);
    return value ?? defaultValue;
  } catch {
    console.warn(`[storage] Failed to get item: ${key}`);
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage
 * Returns true on success, false on failure
 */
export function setStorageItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to set item: ${key}`, error);
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * Returns true on success, false on failure
 */
export function removeStorageItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    console.warn(`[storage] Failed to remove item: ${key}`);
    return false;
  }
}

/**
 * Safely get and parse a JSON value from localStorage
 * Returns defaultValue if key doesn't exist, on parse error, or on any error
 */
export function getStorageJSON<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value) as T;
  } catch {
    console.warn(`[storage] Failed to parse JSON for key: ${key}`);
    return defaultValue;
  }
}

/**
 * Safely stringify and set a JSON value in localStorage
 * Returns true on success, false on failure
 */
export function setStorageJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to set JSON for key: ${key}`, error);
    return false;
  }
}

/**
 * Safely get a boolean value from localStorage
 * Returns defaultValue if key doesn't exist or on any error
 */
export function getStorageBool(key: string, defaultValue: boolean = false): boolean {
  const value = getStorageItem(key, "");
  if (value === "") return defaultValue;
  return value === "true";
}

/**
 * Safely set a boolean value in localStorage
 */
export function setStorageBool(key: string, value: boolean): boolean {
  return setStorageItem(key, String(value));
}

/**
 * Clear all localStorage items (use with caution)
 * Returns true on success, false on failure
 */
export function clearStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch {
    console.warn("[storage] Failed to clear storage");
    return false;
  }
}
