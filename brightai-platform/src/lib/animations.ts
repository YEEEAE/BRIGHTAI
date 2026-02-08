import { AnimatePresence as MotionPresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { createElement, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Variants } from "framer-motion";

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

export const fadeOut: Variants = {
  exit: { opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
};

export const slideIn = {
  right: { hidden: { opacity: 0, x: 28 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } } },
  left: { hidden: { opacity: 0, x: -28 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } } },
  up: { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } },
  down: { hidden: { opacity: 0, y: -22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } },
} satisfies Record<string, Variants>;

export const slideOut = {
  right: { exit: { opacity: 0, x: 28, transition: { duration: 0.25, ease: "easeIn" } } },
  left: { exit: { opacity: 0, x: -28, transition: { duration: 0.25, ease: "easeIn" } } },
  up: { exit: { opacity: 0, y: -22, transition: { duration: 0.25, ease: "easeIn" } } },
  down: { exit: { opacity: 0, y: 22, transition: { duration: 0.25, ease: "easeIn" } } },
} satisfies Record<string, Variants>;

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.32, ease: "easeOut" } },
};

export const scaleOut: Variants = {
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.25, ease: "easeIn" } },
};

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -4 },
  visible: { opacity: 1, rotate: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export const rotateOut: Variants = {
  exit: { opacity: 0, rotate: 4, transition: { duration: 0.25, ease: "easeIn" } },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const pageTransitions: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: "easeIn" } },
};

export type AnimatedPageProps = {
  children: ReactNode;
  className?: string;
};

export const AnimatedPage = ({ children, className }: AnimatedPageProps) => {
  // تغليف الصفحات بحركة انتقال ناعمة مع احترام تفضيل تقليل الحركة
  const reduceMotion = Boolean(useReducedMotion());
  const variants = reduceMotion ? undefined : pageTransitions;
  return createElement(
    motion.main,
    {
      className,
      variants,
      initial: reduceMotion ? undefined : "hidden",
      animate: reduceMotion ? undefined : "visible",
      exit: reduceMotion ? undefined : "exit",
    },
    children
  );
};

export type AnimatedListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey?: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
};

export const AnimatedList = <T,>({
  items,
  renderItem,
  getKey,
  className,
  itemClassName,
}: AnimatedListProps<T>) => {
  // قائمة متحركة مع تتابع للعناصر
  const reduceMotion = Boolean(useReducedMotion());
  const containerVariants = reduceMotion ? undefined : staggerChildren;
  const itemVariants = reduceMotion ? undefined : fadeIn;

  const children = items.map((item, index) =>
    createElement(
      motion.li,
      {
        key: getKey ? getKey(item, index) : String(index),
        variants: itemVariants,
        className: itemClassName,
      },
      renderItem(item, index)
    )
  );

  return createElement(
    motion.ul,
    {
      className,
      variants: containerVariants,
      initial: reduceMotion ? undefined : "hidden",
      animate: reduceMotion ? undefined : "visible",
    },
    children
  );
};

export type AnimatedCounterProps = {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
};

export const AnimatedCounter = ({ value, duration = 0.8, format, className }: AnimatedCounterProps) => {
  // عداد متحرك مع تحديثات سلسة للأرقام
  const reduceMotion = Boolean(useReducedMotion());
  const motionValue = useMotionValue(value);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
    });
    return () => {
      controls.stop();
    };
  }, [value, duration, motionValue, reduceMotion]);

  const text = useMemo(() => {
    const formatted = format ? format(displayValue) : String(displayValue);
    return formatted;
  }, [displayValue, format]);

  return createElement("span", { className }, text);
};

export type AnimatedProgressProps = {
  value: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
};

export const AnimatedProgress = ({ value, className, trackClassName, barClassName }: AnimatedProgressProps) => {
  // شريط تقدم متحرك مع دعم الوصول
  const reduceMotion = Boolean(useReducedMotion());
  const width = Math.max(0, Math.min(100, value));

  return createElement(
    "div",
    {
      className,
      role: "progressbar",
      "aria-valuenow": width,
      "aria-valuemin": 0,
      "aria-valuemax": 100,
    },
    createElement(
      "div",
      { className: trackClassName ?? "h-2 w-full rounded-full bg-slate-800/70" },
      createElement(motion.div, {
        className: barClassName ?? "h-2 rounded-full bg-emerald-400",
        initial: false,
        animate: { width: `${width}%` },
        transition: reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" },
      })
    )
  );
};

export type AnimatedPresenceProps = {
  children: ReactNode;
};

export const AnimatedPresence = ({ children }: AnimatedPresenceProps) => {
  // تغليف حركات الظهور والاختفاء
  return createElement(MotionPresence, { mode: "wait", initial: false }, children);
};

export { motion };
