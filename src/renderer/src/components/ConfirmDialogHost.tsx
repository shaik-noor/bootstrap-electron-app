import React, { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useConfirmStore } from '../lib/confirm'
import { duration, ease, prefersReducedMotion } from '../lib/motion'

export const ConfirmDialogHost: React.FC = () => {
  const { current, resolve } = useConfirmStore()
  const reduced = prefersReducedMotion()

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : duration.fast }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-xs"
          onClick={() => resolve(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 6 }}
            transition={{ duration: reduced ? 0 : duration.base, ease: ease.out }}
            className="w-full max-w-sm mx-4 rounded-xl border border-border bg-popover p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-foreground">{current.title}</h2>
            {current.description && (
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => resolve(false)}
                className="h-8 px-3 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors cursor-pointer"
              >
                {current.cancelText ?? 'Cancel'}
              </button>
              <button
                onClick={() => resolve(true)}
                className={[
                  'h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                  current.destructive
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                ].join(' ')}
              >
                {current.confirmText ?? 'Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
