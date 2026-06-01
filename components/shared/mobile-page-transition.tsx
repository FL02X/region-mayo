"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobilePageTransitionProps
  extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition" | "children"> {
  children: ReactNode;
}

const MOBILE_PAGE_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function MobilePageTransition({
  children,
  className,
  ...props
}: MobilePageTransitionProps) {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = isMobile && !shouldReduceMotion;

  return (
    <motion.div
      {...props}
      initial={shouldAnimate ? { opacity: 0, x: 24 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={shouldAnimate ? MOBILE_PAGE_TRANSITION : { duration: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
