import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { fadeRise, staggerContainer } from '../lib/motion'
import { EmptyState } from '../components/EmptyState'

function useGreeting(): string {
  return useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

const WorldClock: React.FC = () => {
  const now = useNow()
  return (
    <div className="sm:text-right">
      <div className="text-2xl font-bold tabular-nums leading-none">
        {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      <div className="mt-1.5 text-2xs font-medium uppercase tracking-widest text-muted-foreground">
        {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  )
}

/**
 * DashboardView — the main landing workspace.
 *
 * Replace this with your real app content. The structure here mirrors
 * MyDesk's HomeView: greeting + clock, stat strip, activity feed, quick actions.
 * All the primitives (EmptyState, motion tokens, store) are wired and ready.
 */
export const DashboardView: React.FC = () => {
  const greeting = useGreeting()
  const appVersion = useAppStore((s) => s.appVersion)

  // Example stats — replace with real data from your store
  const stats = [
    { key: 'stat1', label: 'Items', value: '0' },
    { key: 'stat2', label: 'Pending', value: '0' },
    { key: 'stat3', label: 'Done', value: '0' },
    { key: 'stat4', label: 'Version', value: appVersion || '—' }
  ]

  return (
    <div className="relative flex-1 w-full min-h-0 overflow-hidden bg-background text-foreground">
      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="visible"
        className="relative z-10 h-full w-full overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-4xl px-8 py-10">
          {/* Greeting + clock */}
          <motion.div variants={fadeRise()} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Welcome to your app.</p>
            </div>
            <WorldClock />
          </motion.div>

          {/* Stat strip */}
          <motion.div
            variants={fadeRise()}
            className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.key} className="bg-card px-4 py-3">
                <div className="text-2xl font-bold tabular-nums text-foreground">{s.value}</div>
                <div className="mt-0.5 text-2xs font-medium uppercase tracking-widest text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Activity feed — replace with real items */}
          <motion.div variants={fadeRise()} className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent activity</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
              <EmptyState
                icon={LayoutDashboard}
                title="Nothing here yet"
                description="Your activity will appear here once you start using the app."
              />
            </div>
          </motion.div>

          {/* Quick actions — replace with your own buttons */}
          <motion.div variants={fadeRise()} className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {}}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
              >
                <ArrowRight className="size-3.5" />
                Get started
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
