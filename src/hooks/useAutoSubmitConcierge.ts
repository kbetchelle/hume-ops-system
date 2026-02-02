// Stub for auto-submit functionality
export function useAutoSubmitConcierge(
  formData: any,
  reportDate: string,
  shiftType: string,
  onSubmitSuccess: () => void,
  isDirty: boolean
) {
  return {
    willAutoSubmit: false,
    timeUntilSubmitFormatted: null as string | null,
    cancelAutoSubmit: () => {},
  };
}
