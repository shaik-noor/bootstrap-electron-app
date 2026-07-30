import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react'
import type React from 'react'
import { duration, ease, prefersReducedMotion } from '../lib/motion'
import { type Toast, useToastStore } from '../lib/toast'
import { cn } from '../lib/utils'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
}

const COLORS = {
  success: 'text-emerald-500',
  error: 'text-destructive',
  info: 'text-primary',
  warning: 'text-amber-500'
}

const ToastItem: React.FC<{ toast: Toast }> = ({ toast: t }) => {
  const dismiss = useToastStore((s) => s.dismiss)
  const Icon = ICONS[t.variant]
  const reduced = prefersReducedMotion()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduced ? 0 : 8, scale: reduced ? 1 : 0.97 }}
      transition={{ duration: reduced ? 0 : duration.base, ease: ease.out }}
      className="flex items-start gap-3 rounded-xl border border-border bg-popover p-3.5 shadow-lg min-w-[280px] max-w-sm"
    >
      <Icon className={cn('size-4 shrink-0 mt-0.5', COLORS[t.variant])} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-snug">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-2xs text-muted-foreground leading-snug">{t.description}</p>
        )}
        {t.action && (
          <button
            type="button"
            onClick={() => {
              t.action?.onClick()
              dismiss(t.id)
            }}
            className="mt-1.5 text-2xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {t.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(t.id)}
        className="size-5 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0 -mt-0.5 -mr-0.5 transition-colors"
      >
        <X className="size-3" />
      </button>
    </motion.div>
  )
}

export const Toaster: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
