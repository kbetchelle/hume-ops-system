import { cn } from "@/lib/utils";

interface DashboardWrapperProps {
  /** Optional centered subtitle (shown in the uppercase HUME style) */
  subtitle?: string;
  /** Additional className on the outer container */
  className?: string;
  children: React.ReactNode;
}

/**
 * Standardised dashboard content wrapper.
 *
 * Provides consistent padding (`p-6 md:p-8`), optional subtitle styling,
 * and a `flex-1` content area that fills remaining height.
 *
 * Use inside `<DashboardLayout>` (which provides the chrome / nav).
 */
export function DashboardWrapper({
  subtitle,
  className,
  children,
}: DashboardWrapperProps) {
  return (
    <div className={cn("flex flex-col h-full p-6 md:p-8", className)}>
      {subtitle && (
        <div className="text-center mb-6">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal text-muted-foreground">
            {subtitle}
          </h2>
        </div>
      )}
      <div className="flex-1 min-h-0 space-y-6">{children}</div>
    </div>
  );
}
