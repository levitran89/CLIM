import React, { useEffect, useState, useRef } from 'react'
import { useTerminalStore } from '@/stores/terminal-store'
import { useProfileStore } from '@/stores/profile-store'
import { useTranslation } from '@/stores/i18n-store'
import { Badge } from '@/components/ui/badge'
import { Zap, Layers, ChevronUp, Check, Star, Eye, RotateCcw } from 'lucide-react'

export function StatusBar(): React.JSX.Element {
  const { sessions, updateSession, setActiveSession } = useTerminalStore()
  const { profiles, activeProfileId, setActiveProfileId, loadProfiles } = useProfileStore()
  const { t } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const runningCount = sessions.filter((s) => s.status === 'running').length
  const backgroundSessions = sessions.filter((s) => s.isBackground)
  const activeSession = sessions.find(
    (s) => s.id === useTerminalStore.getState().activeSessionId
  )
  const activeProfile = profiles.find((p) => p.id === activeProfileId)

  return (
    <div className="flex items-center justify-between h-8 px-4 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-400 select-none relative z-40">
      {/* Left side: Terminal session metrics & Background process alert */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Zap
            size={12}
            className={runningCount > 0 ? 'text-emerald-400 fill-emerald-400' : 'text-zinc-600'}
          />
          <span className={runningCount > 0 ? 'text-emerald-300 font-medium' : 'text-zinc-500'}>
            {runningCount > 0
              ? t('statusBar.runningTerminals').replace('{count}', String(runningCount))
              : t('statusBar.noRunningTerminals')}
          </span>
        </div>

        {/* Thông báo terminal chạy ngầm đặt ở FooterBar - Không nền, chỉ chữ + nút màu */}
        {backgroundSessions.length > 0 && (
          <>
            <span className="text-zinc-700">│</span>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Eye size={13} className="text-amber-400 shrink-0" />
              <span className="font-semibold text-xs text-amber-300">
                {t('statusBar.backgroundTerminals').replace('{count}', String(backgroundSessions.length))}
              </span>
              <button
                onClick={() => {
                  backgroundSessions.forEach((s) => updateSession(s.id, { isBackground: false }))
                  if (backgroundSessions.length > 0) setActiveSession(backgroundSessions[0].id)
                }}
                className="ml-1 px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title={t('statusBar.restoreTooltip')}
              >
                <RotateCcw size={10} />
                {t('statusBar.restoreAll')}
              </button>
            </div>
          </>
        )}

        {activeSession && (
          <>
            <span className="text-zinc-700">│</span>
            <span className="flex items-center gap-1">
              Shell:
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-zinc-800 text-zinc-300 font-mono">
                {activeSession.shell.toUpperCase()}
              </Badge>
            </span>
            {activeSession.pid && (
              <>
                <span className="text-zinc-700">│</span>
                <span className="font-mono text-zinc-500">PID: {activeSession.pid}</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Right side: Environment Profile Selector + Version */}
      <div className="flex items-center gap-3">
        {/* Environment Profile Popover Dropdown (Opens UPWARDS) - Không nền */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs hover:bg-zinc-800/60 transition-all text-zinc-300 hover:text-zinc-100 cursor-pointer"
            title={t('statusBar.envProfile')}
          >
            <Layers size={13} className={activeProfile ? 'text-emerald-400' : 'text-zinc-500'} />
            <span className="font-medium">
              {t('statusBar.activeEnv')}{' '}
              <strong className={activeProfile ? 'text-emerald-300 font-semibold' : 'text-zinc-400 font-normal'}>
                {activeProfile ? activeProfile.name : `(${t('statusBar.notSelected')})`}
              </strong>
            </span>
            {activeProfile && (
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                ({Object.keys(activeProfile.variables || {}).length})
              </span>
            )}
            <ChevronUp
              size={12}
              className={`transition-transform duration-200 text-zinc-400 ${
                dropdownOpen ? 'rotate-180 text-emerald-400' : ''
              }`}
            />
          </button>

          {/* Upward-opening Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute bottom-full mb-1.5 right-0 w-64 bg-zinc-900 border border-zinc-700/90 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-2.5 py-1.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {t('statusBar.envProfile')}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {profiles.length} profiles
                </span>
              </div>

              <div className="py-1 max-h-48 overflow-y-auto space-y-0.5">
                {/* Default / None Option */}
                <button
                  onClick={() => {
                    setActiveProfileId(null)
                    setDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    !activeProfileId
                      ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="italic">({t('statusBar.noProfile')})</span>
                  </div>
                  {!activeProfileId && <Check size={13} className="text-emerald-400" />}
                </button>

                {/* List of profiles */}
                {profiles.map((p) => {
                  const isSelected = p.id === activeProfileId
                  const varCount = Object.keys(p.variables || {}).length
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProfileId(p.id)
                        setDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-300 font-medium'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate">{p.name}</span>
                        {p.isDefault && (
                          <span title="Default">
                            <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                          ({varCount})
                        </span>
                      </div>
                      {isSelected && <Check size={13} className="text-emerald-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <span className="text-zinc-700">│</span>
        <span className="text-zinc-500 font-mono text-[11px]">{t('statusBar.version')} 1.6.0</span>
      </div>
    </div>
  )
}
