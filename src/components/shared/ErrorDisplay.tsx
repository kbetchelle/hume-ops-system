import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  /** Main error message */
  message?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Reusable error state with an optional retry button.
 */
export function ErrorDisplay({
  message = "Something went wrong. Please try again.",
  onRetry,
  className,
}: ErrorDisplayProps) {
  return (
    <Card className={cn("rounded-none", className)}>
      <CardContent className="py-12 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
