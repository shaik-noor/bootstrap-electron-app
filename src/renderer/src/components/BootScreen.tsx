import { motion } from 'framer-motion'
import type React from 'react'
import { duration, ease, prefersReducedMotion } from '../lib/motion'

export const BootScreen: React.FC = () => {
  const reduced = prefersReducedMotion()

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-foreground select-none"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: reduced ? 1 : 1.02,
        transition: { duration: reduced ? 0 : duration.slow, ease: ease.inOut }
      }}
    >
      {/* Soft radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-[420px] rounded-full bg-primary/10 blur-3xl dark:bg-primary/[0.08]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* App icon placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: reduced ? 1 : 0.9, y: reduced ? 0 : 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : duration.slow, ease: ease.out }}
        >
          <motion.div
            animate={reduced ? {} : { scale: [1, 1.04, 1], opacity: [0.9, 1, 0.9] }}
            transition={
              reduced ? undefined : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            }
            className="flex size-20 items-center justify-center rounded-3xl bg-card shadow-lg ring-1 ring-border/60"
          >
            {/* Replace with your app icon: <img src={appIcon} className="size-14 rounded-2xl" /> */}
            <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">M</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Wordmark — replace "MyApp" with your product name */}
        <motion.h1
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : duration.base, ease: ease.out, delay: 0.12 }}
          className="mt-6 text-2xl font-bold tracking-tight"
        >
          MyApp
        </motion.h1>

        {/* Indeterminate progress bar */}
        <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-muted">
          {reduced ? (
            <div className="h-full w-1/2 rounded-full bg-primary/70" />
          ) : (
            <motion.div
              className="h-full w-1/3 rounded-full bg-primary"
              animate={{ x: ['-120%', '360%'] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : duration.base, delay: 0.3 }}
          className="mt-4 text-2xs font-medium uppercase tracking-widest text-muted-foreground/70"
        >
          Starting up
        </motion.p>
      </div>
    </motion.div>
  )
}
