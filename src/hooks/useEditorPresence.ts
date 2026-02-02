// Stub for editor presence tracking
export function useEditorPresence(reportDate: string, shiftType: string) {
  return {
    activeEditors: [],
    typingFields: {},
    broadcastTyping: () => {},
    sessionId: crypto.randomUUID(),
  };
}
