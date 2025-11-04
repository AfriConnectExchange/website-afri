import * as React from "react"
import { cn } from "@/lib/utils"

const Card3D = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border-2 bg-card text-card-foreground shadow-[0_8px_0_0_rgba(0,0,0,0.08),0_12px_24px_-8px_rgba(0,0,0,0.12)] transition-all hover:shadow-[0_12px_0_0_rgba(0,0,0,0.06),0_16px_32px_-8px_rgba(0,0,0,0.15)] hover:-translate-y-1",
      className
    )}
    {...props}
  />
))
Card3D.displayName = "Card3D"

const Card3DHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5", className)}
    {...props}
  />
))
Card3DHeader.displayName = "Card3DHeader"

const Card3DTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
Card3DTitle.displayName = "Card3DTitle"

const Card3DDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
Card3DDescription.displayName = "Card3DDescription"

const Card3DContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
Card3DContent.displayName = "Card3DContent"

const Card3DFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
))
Card3DFooter.displayName = "Card3DFooter"

export { Card3D, Card3DHeader, Card3DFooter, Card3DTitle, Card3DDescription, Card3DContent }
