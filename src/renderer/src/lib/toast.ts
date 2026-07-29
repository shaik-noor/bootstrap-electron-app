import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration: number
  action?: ToastAction
}

interface ToastStore {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

let counter = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    counter += 1
    const id = `toast_${counter}_${Math.random().toString(36).slice(2, 8)}`
    set((state) => ({ toasts: [...state.toasts, { ...t, id }] }))
    if (t.duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) }))
      }, t.duration)
    }
    return id
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) }))
}))

interface ToastOptions {
  description?: string
  duration?: number
  action?: ToastAction
}

function show(variant: ToastVariant, title: string, opts?: ToastOptions): string {
  const fallback = variant === 'error' ? 6000 : opts?.action ? 6000 : 3500
  return useToastStore.getState().push({
    variant,
    title,
    description: opts?.description,
    duration: opts?.duration ?? fallback,
    action: opts?.action
  })
}

export const toast = {
  success: (title: string, opts?: ToastOptions) => show('success', title, opts),
  error: (title: string, opts?: ToastOptions) => show('error', title, opts),
  info: (title: string, opts?: ToastOptions) => show('info', title, opts),
  dismiss: (id: string) => useToastStore.getState().dismiss(id)
}
