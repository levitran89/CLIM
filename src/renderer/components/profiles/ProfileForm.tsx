import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Plus, Trash2, CheckSquare, Square, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import type { EnvProfile } from '../../../shared/types'
import { useTranslation } from '@/stores/i18n-store'

interface ProfileFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<EnvProfile, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: EnvProfile | null
}

interface VariableRow {
  key: string
  value: string
}

export function ProfileForm({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: ProfileFormProps): React.JSX.Element {
  const { t, language } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [variables, setVariables] = useState<VariableRow[]>([])

  useEffect(() => {
    if (open) {
      setName(initialData?.name || '')
      setDescription(initialData?.description || '')
      setIsDefault(initialData?.isDefault || false)

      if (initialData?.variables) {
        const rows = Object.entries(initialData.variables).map(([key, value]) => ({
          key,
          value
        }))
        setVariables(rows.length > 0 ? rows : [{ key: '', value: '' }])
      } else {
        setVariables([{ key: '', value: '' }])
      }
    }
  }, [open, initialData])

  const handleAddRow = (): void => {
    setVariables([...variables, { key: '', value: '' }])
  }

  const handleRemoveRow = (index: number): void => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  const handleVariableChange = (index: number, field: 'key' | 'value', val: string): void => {
    const updated = [...variables]
    updated[index][field] = val
    setVariables(updated)
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(language === 'en' ? 'Please enter an environment profile name' : 'Vui lòng nhập tên môi trường')
      return
    }

    const varMap: Record<string, string> = {}
    for (const { key, value } of variables) {
      const trimmedKey = key.trim()
      if (trimmedKey) {
        varMap[trimmedKey] = value
      }
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      isDefault,
      variables: varMap
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border border-zinc-700/90 text-zinc-100 w-[92vw] max-w-xl p-6 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-zinc-600/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <SlidersHorizontal size={22} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                {initialData
                  ? (language === 'en' ? 'Edit Environment Profile' : 'Chỉnh sửa Môi trường')
                  : (language === 'en' ? 'Create New Environment Profile' : 'Tạo Môi trường Mới')}
              </DialogTitle>
              <p className="text-xs text-zinc-400 mt-0.5">
                {initialData
                  ? (language === 'en' ? 'Update environment variables and default active flags' : 'Cập nhật các biến môi trường và thiết lập mặc định')
                  : (language === 'en' ? 'Define a set of environment variables (.env) to inject into Terminals & Commands' : 'Định nghĩa tập biến môi trường (.env) để tự động nạp vào Terminal & Lệnh')}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-200">
              {language === 'en' ? 'Profile Name *' : 'Tên môi trường *'}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'en' ? 'e.g. Development, Staging, Production' : 'VD: Development, Staging, Production'}
              className="bg-zinc-950 border-zinc-800 text-sm h-9 text-zinc-100"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-200">
              {language === 'en' ? 'Description (optional)' : 'Mô tả (tùy chọn)'}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'en' ? 'Notes on variables and intended usage...' : 'Ghi chú về các biến và mục đích sử dụng...'}
              rows={2}
              className="bg-zinc-950 border-zinc-800 text-sm resize-none text-zinc-100"
            />
          </div>

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none text-zinc-300 hover:text-zinc-100 py-1"
            onClick={() => setIsDefault(!isDefault)}
          >
            {isDefault ? (
              <CheckSquare size={16} className="text-emerald-400" />
            ) : (
              <Square size={16} className="text-zinc-500" />
            )}
            <span className="text-sm font-medium">
              {language === 'en' ? 'Set as default active profile on app startup' : 'Đặt làm môi trường mặc định khi mở app'}
            </span>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-200">
                {language === 'en' ? 'Environment Variables (Key = Value)' : 'Danh sách Biến Môi trường (Key = Value)'}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddRow}
                className="h-7 px-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1 cursor-pointer"
              >
                <Plus size={13} />
                {language === 'en' ? 'Add variable' : 'Thêm biến'}
              </Button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {variables.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={row.key}
                    onChange={(e) => handleVariableChange(index, 'key', e.target.value)}
                    placeholder={language === 'en' ? 'KEY (e.g. PORT)' : 'KEY (VD: PORT)'}
                    className="flex-1 font-mono uppercase bg-zinc-950 border-zinc-800 text-sm h-9 text-emerald-300 font-semibold"
                  />
                  <span className="text-zinc-500 font-bold">=</span>
                  <Input
                    value={row.value}
                    onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                    placeholder={language === 'en' ? 'VALUE (e.g. 3000)' : 'VALUE (VD: 3000)'}
                    className="flex-1 font-mono bg-zinc-950 border-zinc-800 text-sm h-9 text-zinc-100"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(index)}
                    className="h-9 w-9 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 cursor-pointer"
                    title={language === 'en' ? 'Delete this variable' : 'Xóa biến này'}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}

              {variables.length === 0 && (
                <p className="text-center text-zinc-500 py-3 text-xs">
                  {language === 'en' ? 'No variables added yet. Click "Add variable" to start configuring.' : 'Chưa có biến nào. Nhấn "Thêm biến" để bắt đầu cấu hình.'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-sm text-zinc-400 hover:text-zinc-200"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="h-9 px-5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer"
            >
              {initialData
                ? (language === 'en' ? 'Save Changes' : 'Lưu thay đổi')
                : (language === 'en' ? 'Create Profile' : 'Tạo mới')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
