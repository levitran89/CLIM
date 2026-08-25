import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Terminal,
  Cpu,
  Sparkles,
  ShieldCheck,
  Github,
  Globe,
  Heart,
  Code2,
  ExternalLink,
  X
} from 'lucide-react'
import logoSvg from '@/assets/logo.svg'
import { useTranslation } from '@/stores/i18n-store'
import { useLicenseStore } from '@/stores/license-store'

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutModal({ open, onOpenChange }: AboutModalProps): React.JSX.Element {
  const { t } = useTranslation()
  const { isPro, payload } = useLicenseStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950/95 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="relative p-6 pb-4 bg-gradient-to-b from-emerald-950/40 via-zinc-900/60 to-zinc-950 border-b border-zinc-800/80 text-center flex flex-col items-center">
          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-lg cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>

          {/* Glowing Animated Logo */}
          <div className="relative mb-3 group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-zinc-900 border border-emerald-500/40 p-2 flex items-center justify-center shadow-xl">
              <img src={logoSvg} alt="CLIM Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <DialogTitle className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400 tracking-tight">
            CLIM System Manager
          </DialogTitle>
          
          <div className="flex items-center gap-2 mt-1.5">
            {isPro ? (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] font-mono font-bold px-2.5 py-0.5 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                <span>PRO {payload?.plan === 'lifetime' ? 'LIFETIME' : 'ANNUAL'}</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-mono font-medium px-2.5 py-0.5">
                Desktop Edition
              </Badge>
            )}
          </div>

          <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
            {t('about.tagline') || 'Nền tảng quản trị lệnh, tự động hóa quy trình, máy chủ từ xa & AI Copilot toàn năng.'}
          </p>
        </DialogHeader>

        <div className="p-6 space-y-4 text-xs">
          {/* Key Feature Highlights */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Terminal size={15} />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block text-[11px]">{t('about.featTerminal') || 'Đa Terminal'}</span>
                <span className="text-[10px] text-zinc-500">{t('about.featTerminalSub') || 'PowerShell, CMD, WSL'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles size={15} />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block text-[11px]">{t('about.featAi') || 'AI Copilot'}</span>
                <span className="text-[10px] text-zinc-500">{t('about.featAiSub') || 'Gemini, OpenAI, Claude'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Cpu size={15} />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block text-[11px]">{t('about.featSsh') || 'Remote SSH'}</span>
                <span className="text-[10px] text-zinc-500">{t('about.featSshSub') || 'Tunnels, Keys & Ping'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck size={15} />
              </div>
              <div>
                <span className="font-semibold text-zinc-200 block text-[11px]">{t('about.featE2ee') || 'Cloud E2EE'}</span>
                <span className="text-[10px] text-zinc-500">{t('about.featE2eeSub') || 'GitHub Gist Sync'}</span>
              </div>
            </div>
          </div>

          {/* Credits & License */}
          <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-2 text-[11px] text-zinc-400">
            <div className="flex justify-between items-center">
              <span>{t('about.developer') || 'Tác giả & Phát triển:'}</span>
              <span className="font-bold text-zinc-100">TMT Team</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('about.license') || 'Giấy phép:'}</span>
              <span className="font-medium text-zinc-300">MIT Open Source</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Phiên bản:</span>
              <span className="font-mono text-emerald-400 font-semibold">v1.6.0</span>
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open('https://github.com', '_blank')}
              className="flex-1 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 gap-1.5 h-8 cursor-pointer"
            >
              <Github size={13} />
              <span>GitHub</span>
              <ExternalLink size={11} className="text-zinc-500" />
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold h-8 cursor-pointer"
            >
              {t('common.close') || 'Đóng'}
            </Button>
          </div>

          <div className="text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1">
            <span>Crafted with</span>
            <Heart size={10} className="text-rose-500 fill-rose-500" />
            <span>for Developers & SysAdmins</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
