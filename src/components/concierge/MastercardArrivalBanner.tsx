import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUpcomingMastercardArrivals } from "@/hooks/useMastercardArrivals";

export function MastercardArrivalBanner() {
  const arrivals = useUpcomingMastercardArrivals();

  if (arrivals.length === 0) return null;

  return (
    <div className="space-y-2 animate-in fade-in duration-200">
      {arrivals.map((arrival) => (
        <Card
          key={arrival.id}
          className="border-amber-500/50 bg-amber-500/5 rounded-none"
        >
          <CardContent className="flex items-center gap-3 py-3">
            <CreditCard className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="text-sm font-medium">
              {arrival.mastercard_tier || "Mastercard"} client{" "}
              <strong>{arrival.client_name || "Unknown"}</strong>{" "}
              arriving in {arrival.minutesUntil} minute{arrival.minutesUntil !== 1 ? "s" : ""}
              {arrival.visit_purpose ? ` — ${arrival.visit_purpose}` : ""}
            </span>
            <span className="ml-auto h-2.5 w-2.5 bg-amber-500 rounded-full animate-pulse shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
