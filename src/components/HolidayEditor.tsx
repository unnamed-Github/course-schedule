'use client'

import { Plus, CalendarDays } from 'lucide-react'
import type { Holiday } from '@/lib/semester'

interface HolidayEditorProps {
  holidays: Holiday[]
  editingIdx: number | null
  setEditingIdx: (idx: number | null) => void
  form: Holiday
  setForm: (f: Holiday) => void
  onSave: (holidays: Holiday[]) => void
}

export function HolidayEditor({
  holidays,
  editingIdx,
  setEditingIdx,
  form,
  setForm,
  onSave,
}: HolidayEditorProps) {
  return (
    <div className="border-t pt-3" style={{ borderColor: 'var(--border-light)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <CalendarDays size={15} strokeWidth={1.8} />节假日
        </h3>
        <button
          onClick={() => { setForm({ name: '', start: '', end: '' }); setEditingIdx(-1) }}
          className="btn-ghost text-xs flex items-center gap-1"
        >
          <Plus size={12} strokeWidth={2} />添加
        </button>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {holidays.map((h, i) =>
          editingIdx === i ? (
            <HolidayEditForm
              key={i}
              form={form}
              setForm={setForm}
              onSave={(updated) => {
                const next = [...holidays]
                if (editingIdx === -1) next.push(updated)
                else next[editingIdx] = updated
                onSave(next)
              }}
              onCancel={() => setEditingIdx(null)}
            />
          ) : (
            <div key={i} className="flex items-center justify-between text-xs py-1" style={{ color: 'var(--text-secondary)' }}>
              <span>{h.name} {h.start}{h.end !== h.start ? ` — ${h.end}` : ''}</span>
              <div className="flex gap-1">
                <button onClick={() => { setForm({ ...h }); setEditingIdx(i) }} className="btn-ghost text-xs" style={{ color: 'var(--accent-info)' }}>编辑</button>
                <button onClick={() => onSave(holidays.filter((_, j) => j !== i))} className="btn-ghost text-xs" style={{ color: 'var(--accent-danger)' }}>删除</button>
              </div>
            </div>
          )
        )}
        {editingIdx === -1 && (
          <HolidayEditForm
            form={form}
            setForm={setForm}
            onSave={(updated) => onSave([...holidays, updated])}
            onCancel={() => setEditingIdx(null)}
          />
        )}
      </div>
    </div>
  )
}

function HolidayEditForm({
  form,
  setForm,
  onSave,
  onCancel,
}: {
  form: Holiday
  setForm: (f: Holiday) => void
  onSave: (h: Holiday) => void
  onCancel: () => void
}) {
  return (
    <div className="p-2 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="假日名称"
        className="w-full rounded-lg px-2 py-1 text-xs"
        style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={form.start}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
          className="flex-1 rounded-lg px-2 py-1 text-xs"
          style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
        />
        <input
          type="date"
          value={form.end}
          onChange={(e) => setForm({ ...form, end: e.target.value })}
          className="flex-1 rounded-lg px-2 py-1 text-xs"
          style={{ border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}
        />
      </div>
      <div className="flex gap-1 justify-end">
        <button
          onClick={() => {
            if (!form.name || !form.start) return
            onSave({ ...form, end: form.end || form.start })
          }}
          className="btn-ghost text-xs"
          style={{ color: 'var(--accent-info)' }}
        >保存</button>
        <button onClick={onCancel} className="btn-ghost text-xs">取消</button>
      </div>
    </div>
  )
}
