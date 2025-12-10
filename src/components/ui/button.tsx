import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";
import { hover } from "motion/react";
import { classBank, classes } from "./classBank";

let buttons = classBank.buttons;

const buttonVariants = cva(classes(buttons.baseClasses), {
  variants: {
    variant: {
      default: classes(buttons.defaultClasses),
      destructive: classes(buttons.destructiveClasses),
      outline: classes(buttons.outlineClasses),
      secondary: classes(buttons.secondaryClasses),
      ghost: classes(buttons.ghostClasses),
      link: classes(buttons.linkClasses),
    },
    size: {
      default: buttons.size.default,
      sm: buttons.size.sm,
      lg: buttons.size.lg,
      icon: buttons.size.icon,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
