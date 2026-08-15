import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

function Checkbox({ className, ...props }: CheckboxProps): React.JSX.Element {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 cursor-pointer rounded border border-zinc-600 bg-transparent text-emerald-500/80',
        'checked:bg-emerald-500/20 checked:border-emerald-500/50',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
        'transition-colors',
        className
      )}
      {...props}
    />
  )
}

export { Checkbox }