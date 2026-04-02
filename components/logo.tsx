interface LogoProps {
  variant?: "default" | "small" | "large"
  className?: string
}

export function Logo({ variant = "default", className = "" }: LogoProps) {
  const sizes = {
    small: "text-base",
    default: "text-lg",
    large: "text-2xl",
  }

  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span className={`font-sans font-bold text-primary tracking-wide ${sizes[variant]}`}>
        Region Mayo
      </span>
      <span className={`text-[0.65em] font-sans font-light tracking-wider text-muted-foreground ${variant === "small" ? "text-[0.6em]" : ""}`}>
        Calendario
      </span>
    </div>
  )
}
