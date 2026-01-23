import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-default",
  {
    variants: {
      variant: {
        default:
          "border-[#a10dfd]/50 bg-[#a10dfd]/30 text-white hover:bg-[#a10dfd]/50 hover:border-[#a10dfd]/70 hover:scale-105",
        secondary:
          "border-[#17f6fe]/50 bg-[#17f6fe]/30 text-white hover:bg-[#17f6fe]/50 hover:border-[#17f6fe]/70 hover:scale-105",
        destructive:
          "border-red-500/50 bg-red-500/30 text-white hover:bg-red-500/50 hover:border-red-500/70 hover:scale-105",
        outline: "text-gray-300 border-white/30 bg-white/10 hover:bg-white/20 hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
