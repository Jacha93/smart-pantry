import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-[#17f6fe]/40 bg-[#17f6fe]/25 text-[#17f6fe] hover:bg-[#17f6fe] hover:text-[#09090b] hover:scale-105 hover:shadow-[0_0_20px_rgba(23,246,254,0.4)]",
        accent: "border border-[#a10dfd]/40 bg-[#a10dfd]/25 text-[#a10dfd] hover:bg-[#a10dfd] hover:text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(161,13,253,0.4)]",
        destructive:
          "border border-destructive/40 bg-destructive/25 text-destructive hover:bg-destructive hover:text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
        outline:
          "border border-white/30 bg-transparent text-white hover:bg-white/20 hover:border-white/40 hover:scale-105",
        ghost: "hover:bg-[#17f6fe]/10 hover:text-[#17f6fe]",
        link: "text-[#17f6fe] underline-offset-4 hover:underline hover:text-[#4ff8ff]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
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
