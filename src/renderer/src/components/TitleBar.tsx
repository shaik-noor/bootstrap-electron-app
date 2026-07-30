import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronsUpDown, Home, Moon, PanelLeftIcon, Settings, Sun } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { duration, ease, prefersReducedMotion } from '../lib/motion'
import type { WorkspaceId } from '../lib/workspaces'
import { getWorkspaceMeta, WORKSPACE_GROUPS, WORKSPACES, workspaceName } from '../lib/workspaces'
import type { CurrentView } from '../store/useAppStore'
import { useAppStore } from '../store/useAppStore'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useSidebar } from './ui/sidebar'

export const TitleBar: React.FC = () => {
  const { open, setOpen } = useSidebar()
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const sidebarOverlayOpen = useAppStore((s) => s.sidebarOverlayOpen)
  const setSidebarOverlayOpen = useAppStore((s) => s.setSidebarOverlayOpen)
  const { theme, toggleTheme } = useTheme()

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const switcherTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openSwitcher = (): void => {
    if (switcherTimer.current) clearTimeout(switcherTimer.current)
    setIsSwitcherOpen(true)
  }
  const closeSwitcher = (): void => {
    switcherTimer.current = setTimeout(() => setIsSwitcherOpen(false), 150)
  }

  const meta = currentView !== 'home' ? getWorkspaceMeta(currentView as WorkspaceId) : null
  const tileCls = meta ? meta.tint.tile : 'bg-sky-500/10 text-sky-500'
  const Icon = meta ? meta.icon : Home

  return (
    <div className="drag-region flex items-center justify-between w-full h-[40px] px-3 bg-sidebar border-b border-border/10 select-none shrink-0 z-50">
      {/* Left controls */}
      <div className="no-drag flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (open) {
              setOpen(false)
            } else {
              setSidebarOverlayOpen(!sidebarOverlayOpen)
            }
          }}
          className="cursor-pointer"
          title={open ? 'Collapse Sidebar' : sidebarOverlayOpen ? 'Close Sidebar' : 'Open Sidebar'}
        >
          <PanelLeftIcon className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setView('home')}
          className="cursor-pointer"
          title="Home"
        >
          <Home className="size-4" />
        </Button>

        {/* Workspace switcher pill */}
        <div className="h-4 w-[1px] bg-border/60 mx-1.5" />
        <Popover open={isSwitcherOpen} onOpenChange={setIsSwitcherOpen}>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: hover wrapper delegates interaction to child PopoverTrigger */}
          <span
            role="presentation"
            className="no-drag"
            onMouseEnter={openSwitcher}
            onMouseLeave={closeSwitcher}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={[
                  'flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer',
                  'transition-all duration-150 border',
                  isSwitcherOpen
                    ? `${tileCls} border-current/20`
                    : `${tileCls} border-transparent hover:border-current/20`
                ].join(' ')}
              >
                <Icon className="size-3 shrink-0 opacity-80" />
                <span className="text-2xs uppercase tracking-widest leading-none">
                  {workspaceName(currentView as CurrentView)}
                </span>
                <motion.div
                  animate={{ rotate: isSwitcherOpen ? 180 : 0 }}
                  transition={{
                    duration: prefersReducedMotion() ? 0 : duration.fast,
                    ease: ease.out
                  }}
                >
                  <ChevronsUpDown className="size-2.5 opacity-50 shrink-0" />
                </motion.div>
              </button>
            </PopoverTrigger>
          </span>
          <PopoverContent
            align="start"
            sideOffset={4}
            className="w-52 p-1 rounded-lg"
            onMouseEnter={openSwitcher}
            onMouseLeave={closeSwitcher}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onFocusOutside={(e) => e.preventDefault()}
            onInteractOutside={() => setIsSwitcherOpen(false)}
          >
            {WORKSPACE_GROUPS.map((group, gi) => {
              const items = WORKSPACES.filter((w) => w.group === group.id)
              return (
                <React.Fragment key={group.id}>
                  {gi > 0 && <div className="-mx-1 my-1 h-px bg-border" />}
                  <div className="text-2xs uppercase tracking-wider text-muted-foreground/60 px-2 py-1">
                    {group.label}
                  </div>
                  {items.map((ws) => {
                    const isActive = currentView === ws.id
                    const WsIcon = ws.icon
                    return (
                      <button
                        type="button"
                        key={ws.id}
                        onClick={() => {
                          setView(ws.id)
                          setIsSwitcherOpen(false)
                        }}
                        className={[
                          'w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-xs',
                          'cursor-pointer transition-colors outline-none',
                          'hover:bg-accent hover:text-accent-foreground',
                          isActive ? ws.tint.tile : ''
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'size-5 rounded flex items-center justify-center shrink-0',
                            isActive ? 'bg-current/15' : ws.tint.tile
                          ].join(' ')}
                        >
                          <WsIcon className="size-3" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="leading-none">{ws.name}</div>
                          <div
                            className={[
                              'text-2xs mt-0.5 leading-none',
                              isActive ? 'opacity-70' : 'text-muted-foreground/60'
                            ].join(' ')}
                          >
                            {ws.description}
                          </div>
                        </div>
                        {isActive && <Check className="size-3 shrink-0 opacity-70" />}
                      </button>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </PopoverContent>
        </Popover>
      </div>

      {/* Middle drag area */}
      <div className="flex-1 h-full drag-region" />

      {/* Right controls */}
      <div className="no-drag flex items-center gap-1.5 mr-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          className="cursor-pointer"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ opacity: 0, scale: prefersReducedMotion() ? 1 : 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: prefersReducedMotion() ? 1 : 0.8 }}
              transition={{ duration: prefersReducedMotion() ? 0 : duration.base, ease: ease.out }}
            >
              {theme === 'dark' ? (
                <Sun className="size-4 text-amber-500" />
              ) : (
                <Moon className="size-4 text-blue-500" />
              )}
            </motion.div>
          </AnimatePresence>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSettingsOpen(true)}
          className="cursor-pointer"
          title="Settings"
        >
          <Settings className="size-4" />
        </Button>
      </div>

      {/* Native Windows caption-button spacer */}
      <div className="w-[140px] h-full drag-region shrink-0" />
    </div>
  )
}
