import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-ochre text-paper hover:bg-ochre-hover",
        destructive:
          "bg-clay text-paper hover:bg-clay/80",
        outline:
          "border border-rule bg-transparent hover:bg-paper-3 hover:text-ink",
        secondary:
          "bg-paper-3 text-ink-2 hover:bg-paper-dim",
        ghost: "hover:bg-paper-2 hover:text-ink",
        link: "text-ochre underline-offset-4 hover:underline",
        /** Ghost ochre — for nav CTAs and brand-surface secondary actions.
         *  Solid ochre (default) is reserved for the primary CTA in hero. */
        nav: "text-ochre font-medium border-[1.5px] border-ochre bg-paper hover:bg-ochre/8 active:bg-ochre/15",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        xl: "h-13 rounded-lg px-10 text-base font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
