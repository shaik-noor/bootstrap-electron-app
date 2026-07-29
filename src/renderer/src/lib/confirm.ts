import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  id: number
  resolve: (approved: boolean) => void
}

interface ConfirmStore {
  current: ConfirmRequest | null
  request: (opts: ConfirmOptions) => Promise<boolean>
  resolve: (approved: boolean) => void
}

let counter = 0

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  current: null,
  request: (opts) =>
    new Promise<boolean>((resolve) => {
      counter += 1
      const prev = get().current
      if (prev) prev.resolve(false)
      set({ current: { ...opts, id: counter, resolve } })
    }),
  resolve: (approved) => {
    const cur = get().current
    if (cur) {
      cur.resolve(approved)
      set({ current: null })
    }
  }
}))

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().request(opts)
}
