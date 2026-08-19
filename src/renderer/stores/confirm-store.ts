import { create } from 'zustand'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'warning' | 'info'
}

interface ConfirmState {
  isOpen: boolean
  title: string
  description: string
  confirmText: string
  cancelText: string
  variant: 'destructive' | 'warning' | 'info'
  resolver: ((value: boolean) => void) | null
  confirm: (options: ConfirmOptions) => Promise<boolean>
  onConfirm: () => void
  onCancel: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: '',
  description: '',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy',
  variant: 'destructive',
  resolver: null,

  confirm: (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        description: options.description || 'Hành động này không thể hoàn tác.',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy',
        variant: options.variant || 'destructive',
        resolver: resolve
      })
    })
  },

  onConfirm: () => {
    const { resolver } = get()
    if (resolver) resolver(true)
    set({ isOpen: false, resolver: null })
  },

  onCancel: () => {
    const { resolver } = get()
    if (resolver) resolver(false)
    set({ isOpen: false, resolver: null })
  }
}))

export const confirmAction = (options: ConfirmOptions): Promise<boolean> => {
  return useConfirmStore.getState().confirm(options)
}
