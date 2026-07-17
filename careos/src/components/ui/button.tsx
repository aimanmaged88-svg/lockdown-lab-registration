import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-primary/85 text-primary-foreground shadow-soft shadow-primary/25 [box-shadow:inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(16_24_40/0.1),0_4px_12px_-2px_hsl(var(--primary)/0.35)] hover:brightness-105 hover:shadow-glow",
        secondary:
          "bg-gradient-to-b from-secondary to-secondary/85 text-secondary-foreground [box-shadow:inset_0_1px_0_rgb(255_255_255/0.25),0_1px_2px_rgb(16_24_40/0.08),0_4px_12px_-2px_hsl(var(--secondary)/0.3)] hover:brightness-105",
        outline: "border border-input bg-card shadow-soft hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        soft: "bg-primary-soft text-primary hover:bg-primary/15",
        destructive: "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-6 text-base",
        icon: "h-10 w-10",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
