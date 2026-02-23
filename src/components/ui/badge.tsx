import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-1 py-0.5 text-[12px] uppercase tracking-widest font-normal transition-opacity duration-300 focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-add-yellow bg-add-yellow/10 text-add-yellow hover:opacity-70",
        secondary: "border-add-blue bg-add-blue/10 text-add-blue hover:opacity-70",
        destructive: "border-add-red bg-add-red/10 text-add-red hover:opacity-70",
        outline: "border-add-orange text-add-orange hover:opacity-70",
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
