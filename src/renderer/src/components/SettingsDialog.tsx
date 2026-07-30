import { AnimatePresence, motion } from 'framer-motion'
import { Info, X } from 'lucide-react'
import type React from 'react'
import { useTheme } from '../context/ThemeContext'
import { duration, ease, prefersReducedMotion } from '../lib/motion'
import { useAppStore } from '../store/useAppStore'

export const SettingsDialog: React.FC = () => {
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const appVersion = useAppStore((s) => s.appVersion)
  const { theme, toggleTheme } = useTheme()
  const reduced = prefersReducedMotion()

  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          key="settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : duration.fast }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-xs"
          onClick={() => setSettingsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: reduced ? 1 : 0.97, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
            transition={{ duration: reduced ? 0 : duration.base, ease: ease.out }}
            className="w-full max-w-md mx-4 rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/60">
              <h2 className="text-sm font-semibold text-foreground">Settings</h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-5">
              {/* Appearance */}
              <section>
                <h3 className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Appearance
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">Theme</p>
                    <p className="text-2xs text-muted-foreground">Choose light or dark mode</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="h-7 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
                  >
                    {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                  </button>
                </div>
              </section>

              {/* About */}
              <section className="border-t border-border/60 pt-4">
                <div className="flex items-center gap-2 text-2xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" />
                  <span>MyApp {appVersion ? `v${appVersion}` : ''}</span>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
