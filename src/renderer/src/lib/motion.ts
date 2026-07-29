import type { Transition, Variants } from 'framer-motion'

/**
 * Shared motion vocabulary — consistent durations/easings across the app.
 * All helpers honour prefers-reduced-motion: durations collapse to ~0 and
 * transforms are dropped (opacity-only) when the user opts out.
 */

export const duration = {
  fast: 0.15,
  base: 0.24,
  slow: 0.4
} as const

export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function motionTransition(
  d: number = duration.base,
  easing: readonly number[] = ease.out
): Transition {
  return prefersReducedMotion()
    ? { duration: 0 }
    : { duration: d, ease: easing as [number, number, number, number] }
}

export function fadeRise(y = 8, d: number = duration.base): Variants {
  const reduced = prefersReducedMotion()
  return {
    hidden: { opacity: 0, y: reduced ? 0 : y },
    visible: { opacity: 1, y: 0, transition: motionTransition(d) }
  }
}

export function staggerContainer(stagger = 0.04, delayChildren = 0): Variants {
  const reduced = prefersReducedMotion()
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : stagger,
        delayChildren: reduced ? 0 : delayChildren
      }
    }
  }
}
