import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Square, X, Info, Globe } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'
import { AboutModal } from '@/components/about/AboutModal'
import { useTranslation } from '@/stores/i18n-store'
import { useLicenseStore } from '@/stores/license-store'

export function TitleBar(): React.JSX.Element {
  const [aboutOpen, setAboutOpen] = useState(false)
  const { language, setLanguage, t } = useTranslation()
  const { isPro } = useLicenseStore()
  return (
    <div className="flex items-center h-9 bg-zinc-900/90 border-b border-zinc-800/50 select-none backdrop-blur-xl"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo & Title */}
      <div 
        className="flex items-center gap-2 px-3 cursor-pointer group"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        onClick={() => setAboutOpen(true)}
        title={t('titleBar.about') || 'Giới thiệu về CLIM'}
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-md overflow-hidden bg-zinc-900 border border-emerald-500/30 group-hover:border-emerald-400 group-hover:scale-105 transition-all">
          <img src={logoSvg} alt="CLIM" className="w-4 h-4 object-contain" />
        </div>
        <span className="text-xs font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all">
          CLIM
        </span>
        {isPro && (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 border border-amber-500/40 tracking-wider shadow-sm">
            PRO
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick Actions (Language + About) */}
      <div 
        className="flex items-center gap-1 mr-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-transparent hover:border-zinc-700/60 transition-all cursor-pointer"
          title={language === 'vi' ? 'Chuyển sang English (Switch to English)' : 'Chuyển sang Tiếng Việt (Switch to Vietnamese)'}
        >
          <span className="text-xs">{language === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
          <span className="uppercase font-mono text-[10px]">{language}</span>
        </button>

        {/* About Button */}
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          title={t('titleBar.about') || 'Giới thiệu về CLIM'}
        >
          <Info size={13} />
        </button>
      </div>

      {/* Window Controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={() => window.api?.window?.minimize()}
        >
          <Minus size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          onClick={() => window.api?.window?.maximize()}
        >
          <Square size={11} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-11 rounded-none text-zinc-400 hover:text-white hover:bg-red-600"
          onClick={() => window.api?.window?.close()}
        >
          <X size={14} />
        </Button>
      </div>

      {/* About Modal */}
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  )
}
