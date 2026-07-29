import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Home, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { fadeRise, staggerContainer } from '../lib/motion'
import { WORKSPACES } from '../lib/workspaces'

/**
 * HomeView — the landing screen shown when the user navigates to 'home'.
 * Mirrors MyDesk's HomeView: a greeting, a workspace quick-nav grid, and
 * space for recent activity.
 */
export const HomeView: React.FC = () => {
  const setView = useAppStore((s) => s.setView)

  return (
    <div className="relative flex-1 w-full min-h-0 overflow-hidden bg-background text-foreground">
      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="visible"
        className="relative z-10 h-full w-full overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl px-8 py-12">
          {/* Heading */}
          <motion.div variants={fadeRise()} className="flex items-center gap-3 mb-8">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Home className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MyApp</h1>
              <p className="text-xs text-muted-foreground">Select a workspace to get started</p>
            </div>
          </motion.div>

          {/* Workspace cards */}
          <motion.div variants={fadeRise()}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Workspaces</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WORKSPACES.map((ws) => {
                const WsIcon = ws.icon
                return (
                  <button
                    key={ws.id}
                    onClick={() => setView(ws.id)}
                    className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted cursor-pointer"
                  >
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${ws.tint.tile} ${ws.tint.tileHover}`}>
                      <WsIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{ws.name}</p>
                      <p className="text-2xs text-muted-foreground">{ws.description}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground/40 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
