import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function Dialog({ open, onOpenChange, children, className }: DialogProps): React.JSX.Element | null {
  if (!open) return null

  const modal = (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className={cn(
            'relative z-[101] w-full flex items-center justify-center pointer-events-auto animate-fade-in',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  )
  
  return createPortal(modal, document.body)
}

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-zinc-700/90 bg-zinc-900/95 p-6 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.12)] ring-1 ring-zinc-600/50 backdrop-blur-2xl',
        className
      )}
      {...props}
    />
  )
)
DialogContent.displayName = 'DialogContent'

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 mb-4', className)} {...props} />
  )
)
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
DialogTitle.displayName = 'DialogTitle'

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex justify-end gap-2 mt-6', className)}
      {...props}
    />
  )
)
DialogFooter.displayName = 'DialogFooter'

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter }
