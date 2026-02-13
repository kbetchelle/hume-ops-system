import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UnderReviewBadge() {
  return (
    <Badge
      variant="outline"
      className="text-[9px] px-1.5 py-0 font-medium text-amber-600 border-amber-300 bg-amber-50 shrink-0"
    >
      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
      Under Review
    </Badge>
  );
}
