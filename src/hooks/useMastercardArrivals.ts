import { useQuery } from "@tanstack/react-query";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { selectFrom } from "@/lib/dataApi";

interface MastercardArrival {
  id: string;
  client_name: string | null;
  mastercard_tier: string | null;
  start_time: string;
  visit_purpose: string | null;
}

export function useUpcomingMastercardArrivals() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: visits } = useQuery({
    queryKey: ["mastercard-arrivals", today],
    queryFn: async () => {
      const { data, error } = await selectFrom<MastercardArrival>("mastercard_visits", {
        filters: [
          { type: "eq", column: "visit_date", value: today },
          { type: "eq", column: "status", value: "scheduled" },
        ],
        order: { column: "start_time", ascending: true },
      });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const now = new Date();
  const arrivals = (visits || [])
    .map((v) => {
      const arrivalTime = parseISO(v.start_time);
      const minutesUntil = differenceInMinutes(arrivalTime, now);
      return { ...v, minutesUntil, arrivalTime };
    })
    .filter((v) => v.minutesUntil >= 0 && v.minutesUntil <= 15);

  return arrivals;
}
