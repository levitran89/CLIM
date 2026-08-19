import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Star, Power } from 'lucide-react'
import type { EnvProfile } from '../../../shared/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/stores/i18n-store'

interface ProfileCardProps {
  profile: EnvProfile
  isActive: boolean
  onSelect: (profile: EnvProfile) => void
  onEdit: (profile: EnvProfile) => void
  onDelete: (id: string) => void
}

export function ProfileCard({
  profile,
  isActive,
  onSelect,
  onEdit,
  onDelete
}: ProfileCardProps): React.JSX.Element {
  const { language } = useTranslation()
  const varEntries = Object.entries(profile.variables || {})

  return (
    <div
      onClick={() => onSelect(profile)}
      className={cn(
        'group p-4 rounded-xl transition-all duration-200 border cursor-pointer relative flex flex-col justify-between',
        isActive
          ? 'bg-gradient-to-b from-emerald-950/40 to-zinc-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/30'
          : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/60 hover:border-zinc-700/80 hover:shadow-lg'
      )}
    >
      <div>
        {/* Header with Title and Action Buttons */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3
              className={cn(
                'text-base font-bold truncate',
                isActive ? 'text-emerald-300' : 'text-zinc-100'
              )}
            >
              {profile.name}
            </h3>
            {profile.isDefault && (
              <Badge
                variant="secondary"
                className="text-xs px-2 py-0.5 h-5 bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1 shrink-0 font-medium"
              >
                <Star size={11} fill="currentColor" /> {language === 'en' ? 'Default' : 'Mặc định'}
              </Badge>
            )}
          </div>

          {/* Prominent Activation Button */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isActive ? (
              <button
                onClick={() => onSelect(profile)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30 transition-all cursor-pointer"
                title={language === 'en' ? 'Click to deactivate' : 'Nhấn để tắt kích hoạt'}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>{language === 'en' ? 'ACTIVE' : 'ĐANG DÙNG'}</span>
              </button>
            ) : (
              <button
                onClick={() => onSelect(profile)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-800/90 text-zinc-300 border border-zinc-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all shadow-sm cursor-pointer"
                title={language === 'en' ? 'Click to activate this profile' : 'Nhấn để kích hoạt môi trường này'}
              >
                <Power size={13} className="text-zinc-400 group-hover:text-white shrink-0" />
                <span>{language === 'en' ? 'Activate' : 'Kích hoạt'}</span>
              </button>
            )}

            {/* Edit & Delete */}
            <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity ml-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                onClick={() => onEdit(profile)}
                title={language === 'en' ? 'Edit profile' : 'Chỉnh sửa môi trường'}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                onClick={() => onDelete(profile.id)}
                title={language === 'en' ? 'Delete profile' : 'Xóa môi trường'}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>

        {profile.description && (
          <p className="text-sm text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
            {profile.description}
          </p>
        )}

        {/* Variable list preview */}
        <div className="space-y-2 pt-3 border-t border-zinc-800/70">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            <span>{language === 'en' ? `ENVIRONMENT VARIABLES (${varEntries.length})` : `BIẾN MÔI TRƯỜNG (${varEntries.length})`}</span>
          </div>
          {varEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-hidden">
              {varEntries.slice(0, 8).map(([k, v]) => (
                <div
                  key={k}
                  className="inline-flex items-center text-xs font-mono bg-zinc-950/80 border border-zinc-800 rounded-md px-2 py-1 max-w-full truncate"
                  title={`${k}=${v}`}
                >
                  <span className="text-emerald-400 font-semibold">{k}</span>
                  <span className="text-zinc-600 mx-1">=</span>
                  <span className="text-zinc-300 truncate max-w-[120px]">
                    {v ? v : <span className="text-zinc-600 italic">{language === 'en' ? '<empty>' : '<trống>'}</span>}
                  </span>
                </div>
              ))}
              {varEntries.length > 8 && (
                <span className="text-xs text-zinc-500 self-center px-1 font-mono">
                  {language === 'en' ? `+${varEntries.length - 8} more` : `+${varEntries.length - 8} biến khác`}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-zinc-500 italic">{language === 'en' ? 'No variables defined' : 'Chưa có biến nào'}</span>
          )}
        </div>
      </div>
    </div>
  )
}
