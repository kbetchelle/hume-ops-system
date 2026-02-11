import { useUnreadQACount } from "@/hooks/useStaffQAReads";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnreadQABannerProps {
  className?: string;
}

export function UnreadQABanner({ className }: UnreadQABannerProps) {
  const { data: count, isLoading } = useUnreadQACount();

  if (isLoading || count === undefined || count === 0) {
    return null;
  }

  return (
    <Link to="/dashboard/staff-qa" className={cn("block", className)}>
      <Card className="border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-3 py-3">
          <HelpCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="text-sm font-medium">
            You have unread Q&A questions
          </span>
          <span className="ml-auto h-2.5 w-2.5 bg-amber-500 rounded-full animate-pulse shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
