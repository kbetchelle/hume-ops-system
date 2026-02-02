// Stub for broadcast synchronization
export function useBroadcastSync(config: { reportDate: string; shiftType: string; onUpdate?: (data: any) => void }) {
  return {
    broadcastUpdate: () => {},
    broadcastSaved: () => {},
  };
}
