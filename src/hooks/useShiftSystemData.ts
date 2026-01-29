import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";

export interface ReservationSummary {
  total: number;
  checkedIn: number;
  pending: number;
  cancelled: number;
  classes: Array<{
    className: string;
    time: string;
    signups: number;
    capacity: number;
  }>;
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
      
      // Determine shift time range
      const shiftStartHour = shiftType === "AM" ? 6 : 14;
      const shiftEndHour = shiftType === "AM" ? 14 : 21;
      
      const shiftStart = new Date(targetDate);
      shiftStart.setHours(shiftStartHour, 0, 0, 0);
      
      const shiftEnd = new Date(targetDate);
      shiftEnd.setHours(shiftEndHour, 0, 0, 0);

      // Fetch activity logs (check-ins) for today
      const { data: activityLogs, error: activityError } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("activity_date", dateStr)
        .order("created_at", { ascending: false })
        .limit(100);

      if (activityError) {
        console.error("Error fetching activity logs:", activityError);
      }

      // Fetch class schedule for today
      const { data: classSchedule, error: classError } = await supabase
        .from("class_schedule")
        .select("*")
        .eq("class_date", dateStr)
        .order("start_time", { ascending: true });

      if (classError) {
        console.error("Error fetching class schedule:", classError);
      }

      // Fetch daily schedules (staff) for today
      const { data: staffSchedule, error: staffError } = await supabase
        .from("daily_schedules")
        .select("*")
        .eq("schedule_date", dateStr)
        .order("shift_start", { ascending: true });

      if (staffError) {
        console.error("Error fetching staff schedule:", staffError);
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

      // Process activity logs for check-in summary
      const checkInLogs = activityLogs?.filter(log => 
        log.activity_type === "checkin" || log.activity_type === "class_checkin"
      ) || [];

      const gymCheckIns = checkInLogs.filter(log => log.activity_type === "checkin").length;
      const classCheckIns = checkInLogs.filter(log => log.activity_type === "class_checkin").length;

      // Process class schedule for reservations
      const classes = classSchedule?.map(cls => ({
        className: cls.class_name,
        time: cls.start_time,
        signups: cls.signups || 0,
        capacity: cls.capacity || 0,
      })) || [];

      const totalReservations = classes.reduce((sum, cls) => sum + cls.signups, 0);
      const totalCheckedIn = classSchedule?.reduce((sum, cls) => sum + (cls.checkins || 0), 0) || 0;

      // Filter staff for current shift
      const shiftStaff = staffSchedule?.filter(staff => {
        const staffStart = parseInt(staff.shift_start.split(":")[0]);
        const staffEnd = parseInt(staff.shift_end.split(":")[0]);
        
        // Check if staff shift overlaps with current shift
        if (shiftType === "AM") {
          return staffStart < 14;
        } else {
          return staffEnd > 14 || staffStart >= 14;
        }
      }) || [];

      // Build staff summary
      const onShiftStaff = shiftStaff.map(staff => ({
        name: staff.staff_name || "Unknown",
        position: staff.position || "Staff",
        shiftStart: staff.shift_start,
        shiftEnd: staff.shift_end,
      }));

      // Build recent check-ins from member_checkins
      const recentCheckIns = memberCheckins?.slice(0, 10).map(checkin => ({
        memberName: checkin.member_name || "Unknown Member",
        time: checkin.checkin_time,
        type: checkin.checkin_type || "gym",
      })) || [];

      return {
        reservations: {
          total: totalReservations,
          checkedIn: totalCheckedIn,
          pending: totalReservations - totalCheckedIn,
          cancelled: 0, // Would need cancellation tracking
          classes,
        },
        sales: {
          // Placeholder until Toast integration is complete
          totalRevenue: 0,
          orderCount: 0,
          averageOrder: 0,
          topItems: [],
        },
        staff: {
          onShift: onShiftStaff,
          totalStaff: onShiftStaff.length,
        },
        checkIns: {
          total: gymCheckIns + classCheckIns + (memberCheckins?.length || 0),
          gym: gymCheckIns + (memberCheckins?.filter(c => c.checkin_type !== "class").length || 0),
          class: classCheckIns + (memberCheckins?.filter(c => c.checkin_type === "class").length || 0),
          recentCheckIns,
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
      status: "pending_integration",
      capturedAt: data.lastUpdated,
    },
    sling_shift_data: {
      // Placeholder structure for Sling data
      staff: data.staff.onShift,
      totalStaff: data.staff.totalStaff,
      status: "pending_integration",
      capturedAt: data.lastUpdated,
    },
  };
}
