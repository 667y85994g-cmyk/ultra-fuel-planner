"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * tone controls fill colour.
 *
 * - `fuel` (default)  ochre fill — consumption bars: carbs eaten, fuel budget used
 * - `progress`        forest fill — completion bars: stages done, time elapsed
 *
 * Call sites should be updated in Prompt 03c once the distinction is clear.
 */
export type ProgressTone = "fuel" | "progress";

const toneFill: Record<ProgressTone, string> = {
  fuel:     "bg-ochre",
  progress: "bg-forest",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    tone?: ProgressTone;
  }
>(({ className, value, tone = "fuel", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded bg-paper-3",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-300 ease-out",
        toneFill[tone]
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
