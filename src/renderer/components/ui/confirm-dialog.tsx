import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Info } from 'lucide-react'
import { useConfirmStore } from '@/stores/confirm-store'

export function ConfirmDialog(): React.JSX.Element {
  const { isOpen, title, description, confirmText, cancelText, variant, onConfirm, onCancel } =
    useConfirmStore()

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <Trash2 size={24} className="text-red-400" />,
          iconBg: 'bg-red-500/15 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.25)]',
          buttonClass:
            'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/60 font-semibold cursor-pointer'
        }
      case 'warning':
        return {
          icon: <AlertTriangle size={24} className="text-amber-400" />,
          iconBg: 'bg-amber-500/15 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
          buttonClass:
            'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/60 font-semibold cursor-pointer'
        }
      case 'info':
      default:
        return {
          icon: <Info size={24} className="text-emerald-400" />,
          iconBg: 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
          buttonClass:
            'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 font-semibold cursor-pointer'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="w-[90vw] max-w-md bg-zinc-900 border border-zinc-700/90 text-zinc-100 p-6 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(239,68,68,0.15)] ring-1 ring-zinc-600/50">
        <DialogHeader className="gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}
            >
              {styles.icon}
            </div>
            <div className="space-y-1 text-left min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold text-zinc-100 leading-snug">
                {title}
              </DialogTitle>
              <p className="text-sm text-zinc-400 leading-relaxed mt-1">
                {description}
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-9 px-4 text-xs sm:text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={`h-9 px-5 text-xs sm:text-sm rounded-xl ${styles.buttonClass}`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
