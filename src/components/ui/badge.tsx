import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-3 py-1 text-[12px] uppercase tracking-widest font-normal transition-opacity duration-300 focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-add-amber bg-add-amber/10 text-add-amber hover:opacity-70",
        secondary: "border-add-skyBlue bg-add-skyBlue/10 text-add-skyBlue hover:opacity-70",
        destructive: "border-add-crimson bg-add-crimson/10 text-add-crimson hover:opacity-70",
        outline: "border-add-burntOrange text-add-burntOrange hover:opacity-70",
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
