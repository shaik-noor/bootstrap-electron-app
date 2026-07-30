import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useState } from 'react'
import { BootScreen } from './components/BootScreen'
import { ConfirmDialogHost } from './components/ConfirmDialogHost'
import { SettingsDialog } from './components/SettingsDialog'
import { Sidebar, SidebarInner } from './components/Sidebar'
import { TitleBar } from './components/TitleBar'
import { Toaster } from './components/Toaster'
import { SidebarInset, SidebarProvider, useSidebar } from './components/ui/sidebar'
import { TooltipProvider } from './components/ui/tooltip'
import { duration, ease, prefersReducedMotion } from './lib/motion'
import { useAppStore } from './store/useAppStore'
import { DashboardView } from './views/DashboardView'
import { HomeView } from './views/HomeView'

// Add more view imports here:
// import { NotesView } from './views/NotesView'

function AppContent(): React.JSX.Element {
  const currentView = useAppStore((s) => s.currentView)
  const isOverlayOpen = useAppStore((s) => s.sidebarOverlayOpen)
  const setSidebarOverlayOpen = useAppStore((s) => s.setSidebarOverlayOpen)
  const { open } = useSidebar()

  // Close overlay when sidebar is pinned open
  useEffect(() => {
    if (open) setSidebarOverlayOpen(false)
  }, [open, setSidebarOverlayOpen])

  const renderContent = (): React.ReactNode => {
    switch (currentView) {
      case 'home':
        return <HomeView />
      case 'dashboard':
        return <DashboardView />
      // Add your workspace cases here:
      // case 'notes':
      //   return <NotesView />
      default:
        return <div className="p-8 text-foreground">View not found</div>
    }
  }

  return (
    <div className="flex flex-col w-full h-screen bg-background text-foreground overflow-hidden relative">
      <TitleBar />

      <div className="flex flex-1 min-h-0 w-full h-[calc(100vh-40px)] overflow-hidden relative">
        <Sidebar />

        {/* Floating overlay sidebar (collapsed state) */}
        <AnimatePresence>
          {isOverlayOpen && !open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion() ? 0 : duration.fast }}
                className="absolute inset-0 z-40 bg-black/10 backdrop-blur-xs"
                onClick={() => setSidebarOverlayOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, x: prefersReducedMotion() ? 0 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: prefersReducedMotion() ? 0 : -16 }}
                transition={{
                  duration: prefersReducedMotion() ? 0 : duration.base,
                  ease: ease.out
                }}
                className="absolute top-1.5 left-3.5 z-50 w-64 h-[calc(100vh-60px)] bg-sidebar border border-border/60 shadow-2xl rounded-lg overflow-hidden flex flex-col"
              >
                <SidebarInner isCollapsed={false} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content with crossfade between views */}
        <SidebarInset className="min-w-0 flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: prefersReducedMotion() ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: prefersReducedMotion() ? 0 : -6 }}
                transition={{
                  duration: prefersReducedMotion() ? 0 : duration.base,
                  ease: ease.out
                }}
                className="flex-1 min-h-0 overflow-hidden flex flex-col"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </SidebarInset>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  const [booting, setBooting] = useState(true)
  const loadAppVersion = useAppStore((s) => s.loadAppVersion)

  useEffect(() => {
    let cancelled = false
    const minDisplay = prefersReducedMotion() ? 0 : 250

    const hydrate = Promise.allSettled([loadAppVersion()])
    const minTimer = new Promise<void>((resolve) => setTimeout(resolve, minDisplay))

    Promise.all([hydrate, minTimer]).then(() => {
      if (!cancelled) setBooting(false)
    })

    return () => {
      cancelled = true
    }
  }, [loadAppVersion])

  return (
    <TooltipProvider>
      <AnimatePresence>{booting && <BootScreen key="boot" />}</AnimatePresence>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
      <SettingsDialog />
      <ConfirmDialogHost />
      <Toaster />
    </TooltipProvider>
  )
}

export default App
