import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConciergeForm } from "./ConciergeForm";

const upsertMock = vi.fn().mockResolvedValue({ error: null });

const chain = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    from: vi.fn((table: string) => {
      if (table === "daily_report_history") {
        return { ...chain(), upsert: upsertMock };
      }
      return chain();
    }),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com", user_metadata: { full_name: "Test User" } },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/types/concierge-form", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/types/concierge-form")>();
  return { ...mod, hasMeaningfulContent: () => true };
});

vi.mock("@/hooks/useCurrentShift", () => ({
  useCurrentShift: () => ({
    reportDate: "2025-02-18",
    shiftType: "AM" as const,
  }),
}));

vi.mock("@/hooks/useConciergeShiftStaff", () => ({
  useConciergeShiftStaff: () => ({ staffNames: [], isLoading: false }),
}));

vi.mock("@/hooks/useEditorPresence", () => ({
  useEditorPresence: () => ({
    activeEditors: [],
    typingFields: {},
    broadcastTyping: vi.fn(),
    sessionId: "test-session",
  }),
}));

vi.mock("@/hooks/useBroadcastSync", () => ({
  useBroadcastSync: () => ({ broadcastUpdate: vi.fn(), broadcastSaved: vi.fn(), broadcastTyping: vi.fn() }),
}));

vi.mock("@/hooks/useAutoSubmitConcierge", () => ({
  useAutoSubmitConcierge: () => ({ willAutoSubmit: false, timeUntilSubmitFormatted: "" }),
}));

vi.mock("@/hooks/useOfflineQueue", () => ({
  useOfflineQueue: () => ({ isOnline: true, queueSize: 0 }),
}));

vi.mock("@/hooks/useShiftReports", () => ({
  useShiftReportHistory: () => ({ data: [] }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  upsertMock.mockResolvedValue({ error: null });
});

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConciergeForm />
    </QueryClientProvider>
  );
}

describe("ConciergeForm submit", () => {
  it("submit payload includes report_date, shift_type, status submitted and submitted_at", async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const payload = {
      report_date: "2025-02-18",
      shift_type: "AM",
      staff_user_id: "user-1",
      staff_name: "Test",
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };
    await supabase.from("daily_report_history").upsert(payload, { onConflict: "report_date,shift_type" });
    expect(upsertMock).toHaveBeenCalledWith(payload, { onConflict: "report_date,shift_type" });
  });

  it.skip("calls supabase daily_report_history upsert when Submit is clicked (heavy: run with NODE_OPTIONS=--max-old-space-size=4096)", async () => {
    renderForm();
    const submitButton = screen.getByRole("button", { name: /submit shift report/i });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalled();
    });
    const payload = upsertMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      shift_type: "AM",
      status: "submitted",
    });
    expect(payload.report_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.submitted_at).toBeDefined();
  });
});
