// Stub for broadcast synchronization
export function useBroadcastSync(config: { 
  reportDate: string; 
  shiftType: string; 
  sessionId: string;
  onRemoteUpdate?: (data: any) => void;
}) {
  return {
    broadcastUpdate: () => {},
    broadcastSaved: () => {},
  };
}
