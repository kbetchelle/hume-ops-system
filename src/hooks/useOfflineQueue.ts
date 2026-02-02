// Stub for offline queue management
export function useOfflineQueue() {
  return {
    isOnline: true,
    queuedOperations: [],
    addToQueue: () => {},
    processQueue: async () => {},
  };
}
