import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-3 py-1 text-xs uppercase tracking-widest font-normal transition-opacity duration-300 focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-foreground bg-transparent text-foreground hover:opacity-70",
        secondary: "border-border bg-secondary text-secondary-foreground hover:opacity-70",
        destructive: "border-foreground bg-transparent text-foreground hover:opacity-70",
        outline: "border-foreground text-foreground hover:opacity-70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
