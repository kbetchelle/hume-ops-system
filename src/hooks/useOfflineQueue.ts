// Stub for offline queue management
export function useOfflineQueue() {
  return {
    isOnline: true,
    queueSize: 0,
    queuedOperations: [],
    addToQueue: () => {},
    processQueue: async () => {},
  };
}
