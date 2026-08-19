import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Search, Layers, Maximize2, Minimize2, Columns2, Rows3 } from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/stores/confirm-store'
import type { EnvProfile } from '../../../shared/types'
import { useProfileStore } from '@/stores/profile-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useTranslation } from '@/stores/i18n-store'
import { ProfileCard } from './ProfileCard'
import { ProfileForm } from './ProfileForm'

const LAYOUT_WIDTH_KEY = 'clim-profiles-layout-width'

export function ProfileManager(): React.JSX.Element {
  const { settings, updateSettings } = useSettingsStore()
  const { t, language } = useTranslation()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<EnvProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const columns = settings.profileColumns || 2
  const [layoutWidth, setLayoutWidth] = useState<'centered' | 'full'>(() => {
    const saved = localStorage.getItem(LAYOUT_WIDTH_KEY)
    return saved === 'full' ? 'full' : 'centered'
  })

  const toggleLayoutWidth = () => {
    const next = layoutWidth === 'centered' ? 'full' : 'centered'
    setLayoutWidth(next)
    localStorage.setItem(LAYOUT_WIDTH_KEY, next)
  }

  const toggleColumns = () => {
    updateSettings({ profileColumns: columns === 1 ? 2 : 1 })
  }

  const {
    profiles,
    activeProfileId,
    loadProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
    setActiveProfileId
  } = useProfileStore()

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return profiles
    return profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        Object.keys(p.variables || {}).some((k) => k.toLowerCase().includes(q))
    )
  }, [profiles, searchQuery])

  const handleCreate = (): void => {
    setEditingProfile(null)
    setFormOpen(true)
  }

  const handleEdit = (profile: EnvProfile): void => {
    setEditingProfile(profile)
    setFormOpen(true)
  }

  const handleDelete = async (id: string): Promise<void> => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return
    const varCount = Object.keys(profile.variables || {}).length
    const confirmed = await confirmAction({
      title: language === 'en' ? 'Confirm delete profile' : 'Xác nhận xóa môi trường',
      description: language === 'en' ? `Are you sure you want to delete profile "${profile.name}" (${varCount} env variables)? This action cannot be undone.` : `Bạn có chắc chắn muốn xóa môi trường "${profile.name}" (${varCount} biến cấu hình) không? Thao tác này không thể hoàn tác.`,
      confirmText: language === 'en' ? 'Delete profile' : 'Xóa môi trường',
      cancelText: t('common.cancel'),
      variant: 'destructive'
    })
    if (confirmed) {
      await deleteProfile(id)
      toast.success(language === 'en' ? `Deleted profile "${profile.name}"` : `Đã xóa môi trường "${profile.name}"`)
    }
  }

  const handleFormSubmit = async (
    data: Omit<EnvProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    if (editingProfile) {
      await updateProfile(editingProfile.id, data)
      toast.success(language === 'en' ? 'Profile updated' : 'Đã cập nhật môi trường')
    } else {
      await addProfile(data)
      toast.success(language === 'en' ? 'New profile created' : 'Đã tạo môi trường mới')
    }
  }

  const handleSelectProfile = (profile: EnvProfile): void => {
    if (activeProfileId === profile.id) {
      setActiveProfileId(null)
      toast.info(language === 'en' ? 'Deactivated profile (using default system environment)' : 'Đã tắt môi trường đang dùng (sử dụng môi trường mặc định hệ thống)')
    } else {
      setActiveProfileId(profile.id)
      toast.success(language === 'en' ? `Switched to profile "${profile.name}"` : `Đã chuyển sang môi trường "${profile.name}"`)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/50 border-b border-zinc-800/60 flex items-center gap-2.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreate}
          className="h-9 shrink-0 text-sm font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 px-3.5 gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus size={15} />
          {t('profiles.addProfile')}
        </Button>

        <div className="relative flex-1 min-w-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('profiles.searchPlaceholder')}
            className="pl-9 h-9 text-sm bg-zinc-900/60 border-zinc-700/60 text-zinc-200 placeholder:text-zinc-500"
          />
        </div>

        {/* Column toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 shrink-0 ${
            columns === 2
              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          onClick={toggleColumns}
          title={columns === 2 ? t('common.oneColumn') : t('common.twoColumns')}
        >
          {columns === 2 ? <Columns2 size={16} /> : <Rows3 size={16} />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 shrink-0 ${
            layoutWidth === 'centered'
              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          onClick={toggleLayoutWidth}
          title={layoutWidth === 'centered' ? t('common.fullWidth') : t('common.webWidth')}
        >
          {layoutWidth === 'centered' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className={layoutWidth === 'centered' ? 'max-w-4xl mx-auto px-4 py-4 pb-12' : 'px-4 sm:px-6 py-4 pb-12'}>
          <div className={columns === 1 ? 'space-y-3.5 pb-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-3.5 pb-6'}>
            {filteredProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isActive={profile.id === activeProfileId}
                onSelect={handleSelectProfile}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-xs">
              <Layers size={32} className="mb-2 text-zinc-600 stroke-[1.5]" />
              <p>
                {searchQuery
                  ? 'Không tìm thấy môi trường nào phù hợp'
                  : 'Chưa có môi trường nào được tạo'}
              </p>
              {!searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleCreate}
                  className="mt-1 text-xs text-emerald-400"
                >
                  Tạo môi trường đầu tiên
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <ProfileForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingProfile(null)
        }}
        onSubmit={handleFormSubmit}
        initialData={editingProfile}
      />
    </div>
  )
}
