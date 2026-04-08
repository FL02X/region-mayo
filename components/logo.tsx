interface LogoProps {
  variant?: "default" | "small" | "large";
  className?: string;
}

export function Logo({ variant = "default", className = "" }: LogoProps) {
  const nameSizes = {
    small: "text-sm",
    default: "text-base",
    large: "text-xl",
  };

  const subSizes = {
    small: "text-[0.62em]",
    default: "text-[0.68em]",
    large: "text-[0.68em]",
  };

  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span
        className={`font-sans font-bold text-foreground tracking-tight ${nameSizes[variant]}`}
      >
        Region Mayo
      </span>
      <span
        className={`font-sans font-normal tracking-[0.08em] text-muted-foreground ${subSizes[variant]}`}
      >
        Calendario
      </span>
    </div>
  );
}
