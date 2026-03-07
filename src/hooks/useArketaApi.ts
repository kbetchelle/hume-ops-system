import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getPSTToday } from "@/lib/dateUtils";

export interface ArketaClass {
  id: string;
  external_id: string;
  name: string;
  start_time: string;
  duration_minutes: number | null;
  capacity: number | null;
  booked_count: number;
  waitlist_count: number;
  status: string | null;
  is_cancelled: boolean;
  room_name: string | null;
  instructor_name: string | null;
  synced_at: string;
}

export interface ArketaReservation {
  id: string;
  reservation_id: string | null;
  class_id: string | null;
  client_id: string | null;
  reservation_type: string | null;
  class_name: string | null;
  class_date: string | null;
  status: string | null;
  checked_in: boolean | null;
  checked_in_at: string | null;
  late_cancel: boolean | null;
  gross_amount_paid: number | null;
  net_amount_paid: number | null;
  created_at_api: string | null;
  updated_at_api: string | null;
  spot_id: string | null;
  spot_name: string | null;
  client_email: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_phone: string | null;
  raw_data: unknown;
  sync_batch_id: string | null;
}

export interface ArketaPayment {
  id: string;
  payment_id: string;
  amount: number | null;
  status: string | null;
  created_at_api: string | null;
  currency: string | null;
  amount_refunded: number | null;
  description: string | null;
  invoice_id: string | null;
  net_sales: number | null;
  transaction_fees: number | null;
  tax: number | null;
  location_name: string | null;
  source: string | null;
  payment_type: string | null;
  promo_code: string | null;
  offering_name: string[] | null;
  seller_name: string | null;
  client_id: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  synced_at: string | null;
}

export interface ArketaInstructor {
  id: string;
  external_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  synced_at: string;
}

// Fetch today's classes from database
export function useTodaysClasses(date?: string, filterClassesOnly = false) {
  // Default to PST "today" if no date provided
  const targetDate = date || (() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")!.value;
    const m = parts.find((p) => p.type === "month")!.value;
    const d = parts.find((p) => p.type === "day")!.value;
    return `${y}-${m}-${d}`;
  })();
  
  return useQuery({
    queryKey: ["arketaClasses", targetDate, filterClassesOnly],
    queryFn: async () => {
      const startOfDay = `${targetDate}T00:00:00`;
      const endOfDay = `${targetDate}T23:59:59`;
      
      let query = supabase
        .from("arketa_classes")
        .select("*")
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay)
        .order("start_time", { ascending: true });

      if (filterClassesOnly) {
        query = query.eq("reservation_type", "Classes");
      }

      const { data, error } = await query;
      if (error) throw error;
      const classes = data as ArketaClass[];

      // Predict durations for classes missing them
      const needsPrediction = [...new Set(
        classes.filter(c => !c.duration_minutes).map(c => c.name)
      )];
      
      if (needsPrediction.length > 0) {
        const predictions = new Map<string, number>();
        await Promise.all(
          needsPrediction.map(async (name) => {
            const { data: dur } = await supabase.rpc("predict_class_duration", { p_class_name: name });
            if (dur) predictions.set(name, dur as number);
          })
        );
        for (const cls of classes) {
          if (!cls.duration_minutes && predictions.has(cls.name)) {
            cls.duration_minutes = predictions.get(cls.name)!;
          }
        }
      }

      return classes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch reservations for a specific class
export function useClassReservations(classId: string) {
  return useQuery({
    queryKey: ["arketaReservations", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arketa_reservations")
        .select("*")
        .eq("class_id", classId)
        .order("checked_in_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ArketaReservation[];
    },
    enabled: !!classId,
  });
}

// Fetch today's reservations
export function useTodaysReservations(date?: string) {
  const targetDate = date || getPSTToday();
  
  return useQuery({
    queryKey: ["arketaReservationsToday", targetDate],
    queryFn: async () => {
      // Get classes for today first
      const startOfDay = `${targetDate}T00:00:00`;
      const endOfDay = `${targetDate}T23:59:59`;
      
      const { data: classes, error: classError } = await supabase
        .from("arketa_classes")
        .select("external_id")
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay);

      if (classError) throw classError;
      
      if (!classes || classes.length === 0) {
        return { reservations: [], summary: { total: 0, checkedIn: 0, noShows: 0 } };
      }

      const classIds = classes.map(c => c.external_id);
      
      const { data: reservations, error } = await supabase
        .from("arketa_reservations")
        .select("*")
        .in("class_id", classIds);

      if (error) throw error;
      
      const total = reservations?.length || 0;
      const checkedIn = reservations?.filter(r => r.checked_in).length || 0;
      const noShows = reservations?.filter(r => r.status === 'no_show').length || 0;
      
      return {
        reservations: reservations as unknown as ArketaReservation[],
        summary: { total, checkedIn, noShows },
      };
    },
  });
}

// Fetch payments for today
export function useTodaysPayments(date?: string) {
  const targetDate = date || getPSTToday();
  
  return useQuery({
    queryKey: ["arketaPayments", targetDate],
    queryFn: async () => {
      const startOfDay = `${targetDate}T00:00:00`;
      const endOfDay = `${targetDate}T23:59:59`;
      
      const { data, error } = await supabase
        .from("arketa_payments")
        .select("*")
        .gte("created_at_api", startOfDay)
        .lte("created_at_api", endOfDay);

      if (error) throw error;
      
      const payments = data as ArketaPayment[];
      const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
      return {
        payments,
        totalRevenue,
        count: payments.length,
      };
    },
  });
}

// Fetch instructors
export function useInstructors() {
  return useQuery({
    queryKey: ["arketaInstructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arketa_instructors")
        .select("*")
        .order("first_name", { ascending: true });

      if (error) throw error;
      return data as ArketaInstructor[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Sync classes mutation
export function useSyncArketaClasses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.functions.invoke("sync-arketa-classes", {
        body: params || {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["arketaClasses"] });
      toast({
        title: "Classes Synced",
        description: `Synced ${data.syncedCount} classes from Arketa.`,
      });
    },
    onError: (error) => {
      console.error("Failed to sync classes:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync classes from Arketa.",
        variant: "destructive",
      });
    },
  });
}

// Sync reservations mutation
export function useSyncArketaReservations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string; class_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("sync-arketa-reservations", {
        body: params || {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["arketaReservations"] });
      queryClient.invalidateQueries({ queryKey: ["arketaReservationsToday"] });
      toast({
        title: "Reservations Synced",
        description: `Synced ${data.syncedCount} reservations. Check-ins: ${data.summary?.checkedIn || 0}`,
      });
    },
    onError: (error) => {
      console.error("Failed to sync reservations:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync reservations from Arketa.",
        variant: "destructive",
      });
    },
  });
}

// Sync classes only (default -7 to +7 days)
export function useSyncArketaClasses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params?: { startDate?: string; endDate?: string }) => {
      const { data, error } = await supabase.functions.invoke("sync-arketa-classes", {
        body: params || {},
      });
      if (error && !data) throw error;
      if (data?.success === false && !data?.syncedCount) {
        throw new Error(data?.error ?? data?.apiError ?? "Classes sync failed");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["arketaClasses"] });
      queryClient.invalidateQueries({ queryKey: ["syncSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["apiLogs"] });
      queryClient.invalidateQueries({ queryKey: ["apiNames"] });
      const synced = data?.syncedCount ?? 0;
      toast({
        title: data?.success ? "Arketa Classes Sync Complete" : "Classes Sync Completed With Errors",
        description: data?.success
          ? `${synced} classes synced`
          : `${synced} classes synced. ${data?.apiError ?? "Check Sync Log History for details."}`,
        variant: data?.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      console.error("Failed to sync Arketa classes:", error);
      toast({
        title: "Classes Sync Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    },
  });
}

// Legacy alias
export const useSyncArketaClassesAndReservations = useSyncArketaClasses;

// Sync payments mutation
export function useSyncArketaPayments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.functions.invoke("sync-arketa-payments", {
        body: params || {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["arketaPayments"] });
      toast({
        title: "Payments Synced",
        description: `Synced ${data.syncedCount} payments. Total: $${data.totalRevenue?.toFixed(2) || '0.00'}`,
      });
    },
    onError: (error) => {
      console.error("Failed to sync payments:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync payments from Arketa.",
        variant: "destructive",
      });
    },
  });
}

// Sync instructors mutation
export function useSyncArketaInstructors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-arketa-instructors", {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["arketaInstructors"] });
      toast({
        title: "Instructors Synced",
        description: `Synced ${data.syncedCount} instructors from Arketa.`,
      });
    },
    onError: (error) => {
      console.error("Failed to sync instructors:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync instructors from Arketa.",
        variant: "destructive",
      });
    },
  });
}

// Get class schedule breakdown for shift reports
export function useClassScheduleBreakdown(date?: string) {
  const targetDate = date || getPSTToday();
  
  return useQuery({
    queryKey: ["arketaClassBreakdown", targetDate],
    queryFn: async () => {
      const startOfDay = `${targetDate}T00:00:00`;
      const endOfDay = `${targetDate}T23:59:59`;
      
      // Get classes
      const { data: classes, error: classError } = await supabase
        .from("arketa_classes")
        .select("*")
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay)
        .order("start_time", { ascending: true });

      if (classError) throw classError;
      
      if (!classes || classes.length === 0) {
        return {
          classes: [],
          totalReservations: 0,
          totalCheckedIn: 0,
          totalNoShows: 0,
          totalCapacity: 0,
          utilizationRate: 0,
        };
      }

      // Get reservations for these classes
      const classIds = classes.map(c => c.external_id);
      const { data: reservations, error: resError } = await supabase
        .from("arketa_reservations")
        .select("*")
        .in("class_id", classIds);

      if (resError) throw resError;

      // Build breakdown
      const classBreakdown = classes.map(cls => {
        const classReservations = reservations?.filter(r => r.class_id === cls.external_id) || [];
        const checkedIn = classReservations.filter(r => r.checked_in).length;
        const noShows = classReservations.filter(r => r.status === 'no_show').length;
        
        return {
          id: cls.external_id,
          name: cls.name,
          startTime: cls.start_time,
          instructor: cls.instructor_name,
          capacity: cls.capacity || 0,
          booked: cls.booked_count || classReservations.length,
          checkedIn,
          noShows,
          waitlist: cls.waitlist_count || 0,
          isCancelled: cls.is_cancelled,
        };
      });

      const totalReservations = reservations?.length || 0;
      const totalCheckedIn = reservations?.filter(r => r.checked_in).length || 0;
      const totalNoShows = reservations?.filter(r => r.status === 'no_show').length || 0;
      const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);
      const utilizationRate = totalCapacity > 0 ? (totalReservations / totalCapacity) * 100 : 0;

      return {
        classes: classBreakdown,
        totalReservations,
        totalCheckedIn,
        totalNoShows,
        totalCapacity,
        utilizationRate,
      };
    },
  });
}
