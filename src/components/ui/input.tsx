import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-none border-0 border-b-2 border-foreground bg-transparent px-0 py-2 text-xs tracking-wide font-medium ring-offset-background file:border-0 file:bg-transparent file:text-[10px] file:font-normal file:uppercase file:tracking-widest file:text-foreground placeholder:text-muted-foreground placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest focus-visible:outline-none focus-visible:border-b-2 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
