import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const button3dVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_6px_0_0_hsl(var(--primary)/0.8),0_8px_16px_-4px_hsl(var(--primary)/0.4)] hover:shadow-[0_4px_0_0_hsl(var(--primary)/0.8),0_6px_12px_-4px_hsl(var(--primary)/0.4)] hover:translate-y-[2px]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_6px_0_0_hsl(var(--destructive)/0.8),0_8px_16px_-4px_hsl(var(--destructive)/0.4)] hover:shadow-[0_4px_0_0_hsl(var(--destructive)/0.8),0_6px_12px_-4px_hsl(var(--destructive)/0.4)] hover:translate-y-[2px]",
        outline:
          "border-2 border-input bg-background shadow-[0_5px_0_0_hsl(var(--border)),0_6px_12px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_hsl(var(--border)),0_4px_8px_-4px_rgba(0,0,0,0.1)] hover:translate-y-[2px]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_6px_0_0_hsl(var(--secondary)/0.7),0_8px_16px_-4px_hsl(var(--secondary)/0.3)] hover:shadow-[0_4px_0_0_hsl(var(--secondary)/0.7),0_6px_12px_-4px_hsl(var(--secondary)/0.3)] hover:translate-y-[2px]",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline rounded-xl",
        success:
          "bg-green-600 text-white shadow-[0_6px_0_0_rgb(22,163,74),0_8px_16px_-4px_rgba(34,197,94,0.4)] hover:shadow-[0_4px_0_0_rgb(22,163,74),0_6px_12px_-4px_rgba(34,197,94,0.4)] hover:translate-y-[2px]",
        warning:
          "bg-orange-500 text-white shadow-[0_6px_0_0_rgb(234,88,12),0_8px_16px_-4px_rgba(249,115,22,0.4)] hover:shadow-[0_4px_0_0_rgb(234,88,12),0_6px_12px_-4px_rgba(249,115,22,0.4)] hover:translate-y-[2px]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface Button3DProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button3dVariants> {
  asChild?: boolean
}

const Button3D = React.forwardRef<HTMLButtonElement, Button3DProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(button3dVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button3D.displayName = "Button3D"

export { Button3D, button3dVariants }
