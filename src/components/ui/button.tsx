import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-[#17f6fe]/45 bg-[#17f6fe]/88 text-[#09090b] shadow-[0_8px_18px_rgba(23,246,254,0.10)] hover:-translate-y-0.5 hover:border-[#4ff8ff] hover:bg-[#4ff8ff] hover:shadow-[0_14px_34px_rgba(23,246,254,0.22)]",
        accent: "border border-[#a10dfd]/55 bg-[#a10dfd]/88 text-white shadow-[0_8px_18px_rgba(161,13,253,0.10)] hover:-translate-y-0.5 hover:bg-[#b83fff] hover:border-[#b83fff] hover:shadow-[0_14px_34px_rgba(161,13,253,0.20)]",
        destructive:
          "border border-destructive/50 bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-white/14 bg-white/[0.03] text-white shadow-[0_8px_18px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-[#a10dfd]/45 hover:bg-[#a10dfd]/14 hover:text-[#f1d9ff] hover:shadow-[0_14px_34px_rgba(161,13,253,0.16)]",
        ghost: "text-foreground/85 hover:bg-[#17f6fe]/10 hover:text-[#17f6fe]",
        link: "text-[#17f6fe] underline-offset-4 hover:underline hover:text-[#4ff8ff]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
