import React from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Square, X, Terminal } from 'lucide-react'

export function TitleBar(): React.JSX.Element {
  return (
    <div className="flex items-center h-9 bg-zinc-900/90 border-b border-zinc-800/50 select-none backdrop-blur-xl"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo & Title */}
      <div className="flex items-center gap-2 px-3">
        <div className="flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-cyan-500">
          <Terminal size={11} className="text-white" />
        </div>
        <span className="text-xs font-bold tracking-wide text-zinc-300">
          CLIM
        </span>
        <span className="text-[10px] text-zinc-600 font-medium">
          CLI Manager
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Window Controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={() => window.api.window.minimize()}
        >
          <Minus size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={() => window.api.window.maximize()}
        >
          <Square size={11} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-zinc-400 hover:text-white hover:bg-red-600"
          onClick={() => window.api.window.close()}
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  )
}
