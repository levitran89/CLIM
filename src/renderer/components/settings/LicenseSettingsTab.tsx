import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useLicenseStore, FREE_LIMITS } from '@/stores/license-store'
import { useTranslation } from '@/stores/i18n-store'
import {
  Award,
  CheckCircle2,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

export function LicenseSettingsTab(): React.JSX.Element {
  const { isPro, licenseKey, payload, activateKey, deactivateKey } = useLicenseStore()
  const { language } = useTranslation()
  const [inputKey, setInputKey] = useState('')
  const [copied, setCopied] = useState(false)

  const handleActivate = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!inputKey.trim()) {
      toast.error(language === 'en' ? 'Please enter a license key' : 'Vui lòng nhập mã bản quyền')
      return
    }

    const result = activateKey(inputKey)
    if (result.success) {
      toast.success(result.message)
      setInputKey('')
    } else {
      toast.error(result.message)
    }
  }

  const handleCopyKey = (): void => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey)
      setCopied(true)
      toast.success(language === 'en' ? 'License key copied to clipboard' : 'Đã sao chép mã bản quyền vào bộ nhớ tạm')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Status */}
      {isPro && payload ? (
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-cyan-500/10 border border-amber-500/40 shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
            <Award size={100} className="text-amber-400" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-zinc-100">
                    CLIM PRO EDITION
                  </h3>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                    {payload.plan === 'lifetime' ? 'VĨNH VIỄN (LIFETIME)' : 'HÀNG NĂM (ANNUAL)'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>{language === 'en' ? 'Licensed to:' : 'Chủ sở hữu:'} <strong>{payload.name}</strong></span>
                  <span className="text-zinc-500">•</span>
                  <span>{language === 'en' ? 'Issued:' : 'Ngày cấp:'} {payload.issuedAt}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyKey}
                className="h-8 text-xs border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 gap-1.5"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{language === 'en' ? 'Copy Key' : 'Sao chép Key'}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deactivateKey}
                className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/15"
              >
                {language === 'en' ? 'Deactivate' : 'Hủy kích hoạt'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                <KeyRound size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-zinc-200">
                    {language === 'en' ? 'CLIM Community (Free Edition)' : 'Gói Miễn Phí (Community Edition)'}
                  </h3>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px]">
                    FREE
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {language === 'en'
                    ? 'Enter your TMT Team License Key to unlock all Pro features without limits'
                    : 'Nhập License Key được cấp bởi TMT Team để mở khóa không giới hạn tính năng'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-2 pt-1">
            <Input
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="CLIM-PRO-eyJuIjoi..."
              className="bg-zinc-950 border-zinc-800 font-mono text-xs text-emerald-400 placeholder:text-zinc-600 h-9"
              spellCheck={false}
              autoCapitalize="off"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs h-9 px-4 shrink-0 gap-1.5 cursor-pointer shadow-md"
            >
              <Zap size={13} />
              <span>{language === 'en' ? 'Activate Pro' : 'Kích hoạt Pro'}</span>
            </Button>
          </form>
        </div>
      )}

      {/* 2. Feature Comparison Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Award size={14} className="text-amber-400" />
          <span>{language === 'en' ? 'Feature Comparison (Free vs Pro)' : 'So Sánh Tính Năng (Bản Free vs Pro)'}</span>
        </h4>

        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40 text-xs">
          <div className="grid grid-cols-12 bg-zinc-900/90 p-2.5 font-bold border-b border-zinc-800 text-zinc-300 text-[11px]">
            <div className="col-span-6">{language === 'en' ? 'Feature' : 'Tính Năng'}</div>
            <div className="col-span-3 text-center text-zinc-400">{language === 'en' ? 'Free Tier' : 'Bản Miễn Phí'}</div>
            <div className="col-span-3 text-center text-amber-400 font-extrabold">{language === 'en' ? 'CLIM Pro' : 'CLIM Pro 🌟'}</div>
          </div>

          <div className="divide-y divide-zinc-800/60 text-[11px]">
            <div className="grid grid-cols-12 p-2.5 items-center hover:bg-zinc-850/30">
              <div className="col-span-6 text-zinc-200 font-medium">{language === 'en' ? 'CLI Command Storage' : 'Kho Lưu Trữ Lệnh'}</div>
              <div className="col-span-3 text-center text-zinc-400">{FREE_LIMITS.maxCommands} {language === 'en' ? 'commands' : 'lệnh'}</div>
              <div className="col-span-3 text-center text-emerald-400 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 size={12} />
                <span>{language === 'en' ? 'Unlimited' : 'Không giới hạn'}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-2.5 items-center hover:bg-zinc-850/30">
              <div className="col-span-6 text-zinc-200 font-medium">{language === 'en' ? 'Automated Sequences' : 'Quy Trình Tự Động'}</div>
              <div className="col-span-3 text-center text-zinc-400">{FREE_LIMITS.maxSequences} {language === 'en' ? 'sequences' : 'quy trình'}</div>
              <div className="col-span-3 text-center text-emerald-400 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 size={12} />
                <span>{language === 'en' ? 'Unlimited' : 'Không giới hạn'}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-2.5 items-center hover:bg-zinc-850/30">
              <div className="col-span-6 text-zinc-200 font-medium">{language === 'en' ? 'Cron Task Scheduler' : 'Lập Lịch Tự Động Cron'}</div>
              <div className="col-span-3 text-center text-zinc-400">{FREE_LIMITS.maxTasks} {language === 'en' ? 'tasks' : 'tác vụ'}</div>
              <div className="col-span-3 text-center text-emerald-400 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 size={12} />
                <span>{language === 'en' ? 'Unlimited' : 'Không giới hạn'}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-2.5 items-center hover:bg-zinc-850/30">
              <div className="col-span-6 text-zinc-200 font-medium">{language === 'en' ? 'SSH Servers & Tunnels' : 'Quản Lý Máy Chủ SSH'}</div>
              <div className="col-span-3 text-center text-zinc-400">{FREE_LIMITS.maxSshHosts} {language === 'en' ? 'hosts' : 'máy chủ'}</div>
              <div className="col-span-3 text-center text-emerald-400 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 size={12} />
                <span>{language === 'en' ? 'Unlimited' : 'Không giới hạn'}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-2.5 items-center hover:bg-zinc-850/30">
              <div className="col-span-6 text-zinc-200 font-medium">{language === 'en' ? 'Discord & Telegram Webhooks' : 'Gửi Báo Cáo Webhook'}</div>
              <div className="col-span-3 text-center text-zinc-500 flex items-center justify-center">
                <Lock size={12} />
              </div>
              <div className="col-span-3 text-center text-emerald-400 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 size={12} />
                <span>{language === 'en' ? 'Full Support' : 'Đầy đủ'}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-2.5 items-center hover:bg-zinc-850/30">
              <div className="col-span-6 text-zinc-200 font-medium">{language === 'en' ? 'Cloud E2EE Gist Sync' : 'Đồng Bộ Đám Mây Cloud E2EE'}</div>
              <div className="col-span-3 text-center text-zinc-400">{language === 'en' ? 'Manual' : 'Thủ công'}</div>
              <div className="col-span-3 text-center text-emerald-400 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 size={12} />
                <span>{language === 'en' ? 'Auto 2-Way' : 'Tự động 2 chiều'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TMT Team Note */}
      <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 text-xs space-y-2">
        <div className="flex items-center gap-2 text-zinc-200 font-bold">
          <HelpCircle size={14} className="text-cyan-400" />
          <span>{language === 'en' ? 'How to get a License Key?' : 'Cách nhận License Key từ TMT Team:'}</span>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {language === 'en'
            ? 'License Keys are provided by TMT Team to supporters, contributors, and enterprise users. Contact TMT Team to receive your official activation key.'
            : 'Mã bản quyền được cấp bởi TMT Team cho người ủng hộ (Donate), người đóng góp và các đối tác. Bạn có thể liên hệ trực tiếp TMT Team để nhận Key kích hoạt chính thức.'}
        </p>
      </div>
    </div>
  )
}
