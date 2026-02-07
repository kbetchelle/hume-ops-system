import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface ClassBreakdown {
  className: string;
  time: string;
  instructor: string | null;
  signups: number;
  capacity: number;
  checkedIn: number;
  noShows: number;
  waitlist: number;
}

export interface ReservationSummary {
  total: number;
  checkedIn: number;
  pending: number;
  cancelled: number;
  noShows: number;
  classes: ClassBreakdown[];
}

export interface SalesSummary {
  totalRevenue: number;
  orderCount: number;
  averageOrder: number;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
}

export interface StaffSummary {
  onShift: Array<{
    name: string;
    position: string;
    shiftStart: string;
    shiftEnd: string;
  }>;
  totalStaff: number;
}

export interface CheckInSummary {
  total: number;
  gym: number;
  class: number;
  recentCheckIns: Array<{
    memberName: string;
    time: string;
    type: string;
  }>;
}

export interface ShiftSystemData {
  reservations: ReservationSummary;
  sales: SalesSummary;
  staff: StaffSummary;
  checkIns: CheckInSummary;
  lastUpdated: string;
}

export function useShiftSystemData(date: string, shiftType: "AM" | "PM") {
  return useQuery({
    queryKey: ["shiftSystemData", date, shiftType],
    queryFn: async (): Promise<ShiftSystemData> => {
      const targetDate = new Date(date);
      const dateStr = format(targetDate, "yyyy-MM-dd");
      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;
      
      // Determine shift time range
      const shiftStartHour = shiftType === "AM" ? 6 : 14;
      const shiftEndHour = shiftType === "AM" ? 14 : 21;

      // Fetch Arketa classes for today
      const { data: arketaClasses, error: arketaClassError } = await supabase
        .from("arketa_classes")
        .select("*")
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay)
        .eq("is_cancelled", false)
        .order("start_time", { ascending: true });

      if (arketaClassError) {
        console.error("Error fetching arketa classes:", arketaClassError);
      }

      // Get class IDs to fetch reservations
      const classIds = arketaClasses?.map(c => c.external_id) || [];

      // Fetch Arketa reservations for today's classes (schema: id + 16 fields only; no client_name)
      let arketaReservations: Array<{
        class_id: string;
        client_id: string | null;
        checked_in: boolean;
        status: string | null;
        checked_in_at: string | null;
      }> = [];

      if (classIds.length > 0) {
        const { data: reservations, error: resError } = await supabase
          .from("arketa_reservations")
          .select("*")
          .in("class_id", classIds);

        if (resError) {
          console.error("Error fetching arketa reservations:", resError);
        } else {
          arketaReservations = reservations || [];
        }
      }

      // Resolve client names from arketa_clients. reservation.client_id is the Arketa client id
      // and matches arketa_clients.external_id when synced from the API. If lookup fails (e.g.
      // different ID scheme from CSV/backfill), we never show the raw id to avoid poor UX.
      const checkedInClientIds = [...new Set(
        arketaReservations
          .filter(r => r.checked_in && r.checked_in_at && r.client_id)
          .map(r => r.client_id!)
      )];
      let clientNameByReservationClientId: Record<string, string> = {};
      if (checkedInClientIds.length > 0) {
        const { data: clients } = await supabase
          .from("arketa_clients")
          .select("external_id, client_name")
          .in("external_id", checkedInClientIds);
        if (clients) {
          clientNameByReservationClientId = Object.fromEntries(
            clients.map(c => [c.external_id, c.client_name || "Unknown Member"])
          );
        }
      }

      // Fetch Arketa payments for today
      const { data: arketaPayments, error: paymentError } = await supabase
        .from("arketa_payments")
        .select("*")
        .gte("payment_date", startOfDay)
        .lte("payment_date", endOfDay);

      if (paymentError) {
        console.error("Error fetching arketa payments:", paymentError);
      }

      // Fetch staff shifts from staff_shifts table (Sling data)
      const { data: staffShifts, error: staffShiftsError } = await supabase
        .from("staff_shifts")
        .select("*")
        .eq("shift_date", dateStr)
        .order("shift_start", { ascending: true });

      if (staffShiftsError) {
        console.error("Error fetching staff shifts:", staffShiftsError);
      }

      // Fetch member check-ins for today
      const { data: memberCheckins, error: checkinError } = await supabase
        .from("member_checkins")
        .select("*")
        .eq("checkin_date", dateStr)
        .order("checkin_time", { ascending: false })
        .limit(50);

      if (checkinError) {
        console.error("Error fetching member check-ins:", checkinError);
      }

      // Build class-by-class breakdown from Arketa data
      const classBreakdown: ClassBreakdown[] = (arketaClasses || []).map(cls => {
        const classReservations = arketaReservations.filter(r => r.class_id === cls.external_id);
        const checkedIn = classReservations.filter(r => r.checked_in).length;
        const noShows = classReservations.filter(r => r.status === 'no_show').length;
        
        return {
          className: cls.name,
          time: cls.start_time,
          instructor: cls.instructor_name,
          signups: cls.booked_count || classReservations.length,
          capacity: cls.capacity || 0,
          checkedIn,
          noShows,
          waitlist: cls.waitlist_count || 0,
        };
      });

      // Calculate totals from Arketa data
      const totalReservations = arketaReservations.length;
      const totalCheckedIn = arketaReservations.filter(r => r.checked_in).length;
      const totalNoShows = arketaReservations.filter(r => r.status === 'no_show').length;
      const totalCancelled = arketaReservations.filter(r => r.status === 'cancelled').length;

      // Calculate sales from Arketa payments
      const totalRevenue = (arketaPayments || []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0), 
        0
      );

      // Filter staff shifts for current shift type
      const shiftStaff = (staffShifts || []).filter(shift => {
        const shiftHour = new Date(shift.shift_start).getHours();
        if (shiftType === "AM") {
          return shiftHour < 14;
        } else {
          return shiftHour >= 14 || new Date(shift.shift_end).getHours() > 14;
        }
      });

      // Build staff summary from Sling data
      const onShiftStaff = shiftStaff.map(shift => ({
        name: shift.user_name || "Unknown",
        position: shift.position || "Staff",
        shiftStart: shift.shift_start,
        shiftEnd: shift.shift_end,
      }));

      // Build recent check-ins from reservations and member_checkins (member name from arketa_clients).
      // When name lookup fails we show "Unknown Member" only, never the raw client_id.
      const recentCheckIns = arketaReservations
        .filter(r => r.checked_in && r.checked_in_at)
        .sort((a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime())
        .slice(0, 10)
        .map(r => ({
          memberName: (r.client_id && clientNameByReservationClientId[r.client_id]) || "Unknown Member",
          time: r.checked_in_at!,
          type: "class",
        }));

      // Add gym check-ins from member_checkins
      const gymCheckIns = (memberCheckins || [])
        .filter(c => c.checkin_type !== "class")
        .slice(0, 5)
        .map(c => ({
          memberName: c.member_name || "Unknown Member",
          time: c.checkin_time,
          type: "gym",
        }));

      return {
        reservations: {
          total: totalReservations,
          checkedIn: totalCheckedIn,
          pending: totalReservations - totalCheckedIn - totalNoShows - totalCancelled,
          cancelled: totalCancelled,
          noShows: totalNoShows,
          classes: classBreakdown,
        },
        sales: {
          totalRevenue,
          orderCount: (arketaPayments || []).length,
          averageOrder: (arketaPayments || []).length > 0 
            ? totalRevenue / (arketaPayments || []).length 
            : 0,
          topItems: [], // Would need item-level data
        },
        staff: {
          onShift: onShiftStaff,
          totalStaff: onShiftStaff.length,
        },
        checkIns: {
          total: totalCheckedIn + (memberCheckins?.length || 0),
          gym: memberCheckins?.filter(c => c.checkin_type !== "class").length || 0,
          class: totalCheckedIn,
          recentCheckIns: [...recentCheckIns, ...gymCheckIns].slice(0, 10),
        },
        lastUpdated: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// Helper function to format system data for saving to report
export function formatSystemDataForReport(data: ShiftSystemData | undefined) {
  if (!data) {
    return {
      arketa_reservations: null,
      toast_sales: null,
      sling_shift_data: null,
    };
  }

  return {
    arketa_reservations: {
      summary: {
        total: data.reservations.total,
        checkedIn: data.reservations.checkedIn,
        pending: data.reservations.pending,
        cancelled: data.reservations.cancelled,
        noShows: data.reservations.noShows,
      },
      classes: data.reservations.classes,
      checkIns: {
        total: data.checkIns.total,
        gym: data.checkIns.gym,
        class: data.checkIns.class,
      },
      capturedAt: data.lastUpdated,
    },
    toast_sales: {
      // Placeholder structure for Toast data
      summary: {
        totalRevenue: data.sales.totalRevenue,
        orderCount: data.sales.orderCount,
        averageOrder: data.sales.averageOrder,
      },
      topItems: data.sales.topItems,
      status: data.sales.orderCount > 0 ? "synced" : "pending_integration",
      capturedAt: data.lastUpdated,
    },
    sling_shift_data: {
      // Real Sling staff data
      staff: data.staff.onShift,
      totalStaff: data.staff.totalStaff,
      status: data.staff.totalStaff > 0 ? "synced" : "pending_sync",
      capturedAt: data.lastUpdated,
    },
  };
}
