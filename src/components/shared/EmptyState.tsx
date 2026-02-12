import { Inbox, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Custom icon (default: Inbox) */
  icon?: LucideIcon;
  /** Main message */
  message: string;
  /** Optional secondary text */
  description?: string;
  /** Optional action element (e.g. a button) */
  action?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Reusable empty-state placeholder.
 */
export function EmptyState({
  icon: Icon = Inbox,
  message,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("rounded-none", className)}>
      <CardContent className="py-12 text-center">
        <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
