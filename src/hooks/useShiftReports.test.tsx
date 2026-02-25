import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useShiftReport, useSubmittedShiftReports, useSaveShiftReport, ShiftReportData } from "./useShiftReports";

const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();

function chain(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const thenable = {
    then: (resolve: (v: typeof result) => void) => resolve(result),
    catch: () => thenable,
  };
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue(thenable),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    insert: vi.fn(() => ({ select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue(result) })),
    update: vi.fn(() => ({ eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue(result) })),
  };
  return c;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => chain()),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useShiftReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useShiftReport", () => {
    it("returns loading then data when query succeeds", async () => {
      const report = { id: "r1", report_date: "2025-02-24", shift_type: "AM", status: "draft" };
      const { supabase } = await import("@/integrations/supabase/client");
      const ch = chain({ data: report, error: null });
      ch.maybeSingle.mockResolvedValue({ data: report, error: null });
      supabase.from.mockReturnValue(ch);

      const { result } = renderHook(
        () => useShiftReport("2025-02-24", "AM"),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(report);
      expect(result.current.error).toBeNull();
    });

    it("returns error when query fails", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const ch = chain();
      ch.maybeSingle.mockResolvedValue({ data: null, error: { message: "Network error" } });
      supabase.from.mockReturnValue(ch);

      const { result } = renderHook(
        () => useShiftReport("2025-02-24", "PM"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useSubmittedShiftReports", () => {
    it("returns empty array when no submitted reports", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      supabase.from.mockReturnValue(chain({ data: [], error: null }));

      const { result } = renderHook(
        () => useSubmittedShiftReports(200),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe("useSaveShiftReport", () => {
    it("calls insert when report has no id", async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const ch = chain({ data: { id: "new-1" }, error: null });
      ch.insert.mockReturnValue({ select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "new-1" }, error: null }) });
      supabase.from.mockReturnValue(ch);

      const { result } = renderHook(() => useSaveShiftReport(), { wrapper: createWrapper() });

      const report: ShiftReportData = {
        report_date: "2025-02-24",
        shift_type: "AM",
        staff_user_id: "u1",
        staff_name: "Test",
        member_feedback: [],
        membership_requests: [],
        celebratory_events: [],
        scheduled_tours: [],
        tour_notes: [],
        facility_issues: [],
        busiest_areas: "",
        system_issues: [],
        management_notes: "",
        future_shift_notes: [],
        status: "draft",
      };

      result.current.mutate(report);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(supabase.from).toHaveBeenCalledWith("daily_report_history");
      expect(ch.insert).toHaveBeenCalled();
    });
  });
});
