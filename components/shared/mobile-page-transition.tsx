"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobilePageTransitionProps
  extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition" | "children"> {
  children: ReactNode;
  axis?: "x" | "y";
  distance?: number;
  duration?: number;
}

const MOBILE_PAGE_TRANSITION = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function MobilePageTransition({
  children,
  axis = "x",
  distance = 14,
  duration,
  className,
  ...props
}: MobilePageTransitionProps) {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  const shouldAnimate = hasMounted && isMobile && !shouldReduceMotion;
  const transition = {
    duration: duration ?? MOBILE_PAGE_TRANSITION.duration,
    ease: MOBILE_PAGE_TRANSITION.ease,
  } as const;
  const initialOffset =
    axis === "y" ? { opacity: 0, y: distance } : { opacity: 0, x: distance };
  const animateOffset =
    axis === "y" ? { opacity: 1, x: 0, y: 0 } : { opacity: 1, x: 0, y: 0 };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <motion.div
      key={shouldAnimate ? `mobile-${axis}-${distance}` : "static"}
      {...props}
      initial={shouldAnimate ? initialOffset : false}
      animate={animateOffset}
      transition={shouldAnimate ? transition : { duration: 0 }}
      className={`${axis === "x" ? "overflow-x-clip" : ""} ${className ?? ""}`.trim()}
      style={{
        ...props.style,
        willChange: shouldAnimate ? "transform, opacity" : props.style?.willChange,
      }}
    >
      {children}
    </motion.div>
  );
}
