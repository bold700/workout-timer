import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent)]/20",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border-2 border-[var(--bg-tertiary)] bg-transparent hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)]",
        secondary: "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
        ghost: "hover:bg-[var(--bg-tertiary)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
        sonos: "bg-[#1db954] text-white hover:bg-[#1ed760] shadow-lg shadow-[#1db954]/30",
        work: "bg-[var(--work)] text-white hover:opacity-90 shadow-lg shadow-[var(--work)]/30",
        rest: "bg-[var(--rest)] text-[var(--bg-primary)] hover:opacity-90 shadow-lg shadow-[var(--rest)]/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-lg": "h-12 w-12",
        "icon-xl": "h-14 w-14",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
