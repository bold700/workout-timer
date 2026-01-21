import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onValueChange?: (value: number) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, ...props }, ref) => {
    return (
      <input
        type="range"
        className={cn(
          "w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--bg-tertiary)]",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1db954] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md",
          "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#1db954] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none",
          className
        )}
        ref={ref}
        onChange={(e) => onValueChange?.(parseInt(e.target.value, 10))}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
