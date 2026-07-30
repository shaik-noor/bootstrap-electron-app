import { Check, ChevronsUpDown, Home, Moon, Settings, Sun } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import type { WorkspaceId } from '../lib/workspaces'
import { getWorkspaceMeta, WORKSPACE_GROUPS, WORKSPACES } from '../lib/workspaces'
import { useAppStore } from '../store/useAppStore'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from './ui/sidebar'

export const SidebarInner: React.FC<{ isCollapsed?: boolean }> = ({
  isCollapsed: isCollapsedProp
}) => {
  const { state } = useSidebar()
  const isCollapsed = isCollapsedProp ?? state === 'collapsed'
  const { theme, toggleTheme } = useTheme()
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const switcherTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openSwitcher = (): void => {
    if (switcherTimer.current) clearTimeout(switcherTimer.current)
    setIsSwitcherOpen(true)
  }
  const closeSwitcher = (): void => {
    switcherTimer.current = setTimeout(() => setIsSwitcherOpen(false), 150)
  }

  const activeMeta = currentView !== 'home' ? getWorkspaceMeta(currentView as WorkspaceId) : null
  const ActiveIcon = activeMeta ? activeMeta.icon : Home

  const renderWorkspaceContent = (): React.JSX.Element | null => {
    // ── Home: workspace list ─────────────────────────────────────────────────
    if (currentView === 'home') {
      return (
        <SidebarGroup className={`flex-1 min-h-0 flex flex-col ${isCollapsed ? 'p-1' : ''}`}>
          <SidebarGroupContent className="flex-1 min-h-0">
            {WORKSPACE_GROUPS.map((group) => {
              const items = WORKSPACES.filter((w) => w.group === group.id)
              if (items.length === 0) return null
              return (
                <div key={group.id} className="mb-3 last:mb-0">
                  {!isCollapsed && (
                    <SidebarGroupLabel className="mb-1.5">{group.label}</SidebarGroupLabel>
                  )}
                  <SidebarMenu className="flex flex-col gap-2">
                    {items.map((ws) => {
                      const WsIcon = ws.icon
                      return (
                        <SidebarMenuItem key={ws.id}>
                          <SidebarMenuButton
                            onClick={() => setView(ws.id)}
                            tooltip={ws.name}
                            size="lg"
                            className="w-full text-left rounded-lg border border-sidebar-border transition-all duration-200 hover:shadow-xs relative group select-none cursor-pointer flex items-center gap-3 p-3 bg-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          >
                            <div
                              className={`flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${ws.tint.tile} ${ws.tint.tileHover}`}
                            >
                              <WsIcon className="size-4" />
                            </div>
                            {!isCollapsed && (
                              <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                                <span className="font-semibold text-foreground truncate">
                                  {ws.name}
                                </span>
                                <span className="text-2xs text-muted-foreground truncate">
                                  {ws.description}
                                </span>
                              </div>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </div>
              )
            })}
          </SidebarGroupContent>
        </SidebarGroup>
      )
    }

    // ── Active workspace: contextual sidebar nav ────────────────────────────
    switch (currentView) {
      case 'dashboard':
        return (
          <SidebarGroup className={`flex-1 min-h-0 flex flex-col ${isCollapsed ? 'p-1' : ''}`}>
            {!isCollapsed && <SidebarGroupLabel>Dashboard</SidebarGroupLabel>}
            <SidebarGroupContent className="flex-1 min-h-0">
              <SidebarMenu className="flex flex-col gap-1">
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Overview" className="cursor-pointer" isActive>
                    <Home className="size-4 shrink-0" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      // Add more workspace cases here:
      // case 'notes': return <NotesSidebarContent isCollapsed={isCollapsed} />
      default:
        return (
          <SidebarGroup className={`flex-1 min-h-0 flex flex-col ${isCollapsed ? 'p-1' : ''}`}>
            {!isCollapsed && (
              <SidebarGroupLabel>{activeMeta?.name ?? 'Workspace'}</SidebarGroupLabel>
            )}
          </SidebarGroup>
        )
    }
  }

  return (
    <>
      {/* Header / workspace switcher */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {currentView === 'home' ? (
              <SidebarMenuButton
                size="lg"
                className="hover:bg-transparent cursor-default select-none"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Home className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">MyApp</span>
                  <span className="truncate text-xs text-muted-foreground">Home</span>
                </div>
              </SidebarMenuButton>
            ) : (
              <Popover open={isSwitcherOpen} onOpenChange={setIsSwitcherOpen}>
                {/* biome-ignore lint/a11y/noStaticElementInteractions: hover wrapper delegates interaction to child PopoverTrigger */}
                <span role="presentation" onMouseEnter={openSwitcher} onMouseLeave={closeSwitcher}>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent cursor-pointer"
                    >
                      <div
                        className={`flex aspect-square size-8 items-center justify-center rounded-lg ${activeMeta?.tint.tile ?? ''}`}
                      >
                        <ActiveIcon className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-foreground">
                          {activeMeta?.name ?? 'Workspace'}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {activeMeta?.description}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </PopoverTrigger>
                </span>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-1 rounded-lg"
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  onMouseEnter={openSwitcher}
                  onMouseLeave={closeSwitcher}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onFocusOutside={(e) => e.preventDefault()}
                  onInteractOutside={() => setIsSwitcherOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setView('home')
                      setIsSwitcherOpen(false)
                    }}
                    className="w-full flex items-center gap-2 p-2 cursor-pointer text-xs rounded-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border bg-primary/10 border-primary/20 text-primary shrink-0">
                      <Home className="size-3.5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs">Home</span>
                      <span className="text-2xs text-muted-foreground">Overview</span>
                    </div>
                  </button>
                  {WORKSPACE_GROUPS.map((group) => {
                    const items = WORKSPACES.filter((w) => w.group === group.id)
                    if (items.length === 0) return null
                    return (
                      <React.Fragment key={group.id}>
                        <div className="-mx-1 my-1 h-px bg-border" />
                        <div className="text-2xs uppercase tracking-widest text-muted-foreground/70 px-2 py-1">
                          {group.label}
                        </div>
                        {items.map((ws) => {
                          const WsIcon = ws.icon
                          const isCurrent = ws.id === currentView
                          return (
                            <button
                              type="button"
                              key={ws.id}
                              onClick={() => {
                                setView(ws.id)
                                setIsSwitcherOpen(false)
                              }}
                              className={`w-full flex items-center gap-2 p-2 cursor-pointer rounded-none transition-colors outline-none hover:bg-sidebar-accent ${isCurrent ? 'bg-sidebar-accent/50 font-semibold' : ''}`}
                            >
                              <div
                                className={`flex size-6 items-center justify-center rounded-sm border shrink-0 ${ws.tint.chip}`}
                              >
                                <WsIcon className="size-3.5" />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-xs">{ws.name}</span>
                                <span className="text-2xs text-muted-foreground">
                                  {ws.description}
                                </span>
                              </div>
                              {isCurrent && <Check className="ml-auto size-3.5 text-primary" />}
                            </button>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </PopoverContent>
              </Popover>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Workspace content */}
      <SidebarContent>{renderWorkspaceContent()}</SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              onClick={() => setSettingsOpen(true)}
              className="cursor-pointer"
            >
              <Settings className="size-4 shrink-0" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onClick={toggleTheme}
              className="cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="size-4 shrink-0 text-amber-500" />
              ) : (
                <Moon className="size-4 shrink-0 text-blue-500" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}

export const Sidebar: React.FC = () => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  return (
    <ShadcnSidebar collapsible="offcanvas" className="top-[40px]! h-[calc(100vh-40px)]!">
      <SidebarInner isCollapsed={isCollapsed} />
      <SidebarRail />
    </ShadcnSidebar>
  )
}
