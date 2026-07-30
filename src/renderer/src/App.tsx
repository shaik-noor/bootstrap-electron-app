import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'
import { useEffect, useState } from 'react'
import { BootScreen } from './components/BootScreen'
import { ConfirmDialogHost } from './components/ConfirmDialogHost'
import { SettingsDialog } from './components/SettingsDialog'
import { Sidebar } from './components/Sidebar'
import { TitleBar } from './components/TitleBar'
import { Toaster } from './components/Toaster'
import { SidebarInset, SidebarProvider } from './components/ui/sidebar'
import { TooltipProvider } from './components/ui/tooltip'
import { duration, ease, prefersReducedMotion } from './lib/motion'
import { useAppStore } from './store/useAppStore'
import { DashboardView } from './views/DashboardView'
import { HomeView } from './views/HomeView'

// Add more view imports here:
// import { NotesView } from './views/NotesView'

function AppContent(): React.JSX.Element {
  const currentView = useAppStore((s) => s.currentView)

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
